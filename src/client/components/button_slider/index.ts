import { type TemplateResult, html } from '@lit'
import { customElement, property, query, queryAssignedElements } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';
import type { ButtonSliderOption } from '../button_slider_option/index.ts';

import style from './index.css' with {type: 'css'};

/** Detail payload carried by `button-slider-option-:select` and `button-slider-:change`. */
interface SliderSelectDetail {
  value: string;
}

/**
 * A segmented, animated toggle between a small set of mutually exclusive
 * options (e.g. a Dark/Light theme switch). Options are declared as
 * `<button-slider-option->` children; this element owns the selection
 * state, the sliding highlight that animates behind the active option,
 * and all keyboard interaction.
 *
 * Unlike a native radio group, only the group itself is a single Tab
 * stop (`role="radiogroup"` + `tabindex="0"` on the host) - arrow keys
 * move the active option via `aria-activedescendant` rather than moving
 * real DOM focus between individually-tabbable options.
 *
 * @element button-slider-
 *
 * @slot - One or more `<button-slider-option->` elements.
 *
 * @fires change - Fired when the selected value changes, whether via
 *        click or keyboard. `event.detail` contains `{ value }`. Note
 *        that, like any DOM event bound with `@change=`, the listener
 *        receives the `Event` object itself - read the value off
 *        `event.detail.value`, not off the event directly.
 *
 * @example
 * ```html
 * <button-slider- value="dark" @change=${(e) => console.log(e.detail.value)}>
 *   <button-slider-option- value="dark">Dark</button-slider-option->
 *   <button-slider-option- value="light">Light</button-slider-option->
 * </button-slider->
 * ```
 */
@customElement('button-slider-')
export class ButtonSlider extends CustomElement {
  static override styles = style

  constructor() {
    super();
    this.addEventListener(
      'button-slider-option-:select',
      this.handleOptionSelect as EventListener,
    );
    this.addEventListener('keydown', this.handleKeydown);
  }

  /** The currently selected option's value. */
  @property({ attribute: 'value', reflect: true })
  accessor value: string = '';

  /** The absolutely-positioned sliding highlight element. */
  @query('.thumb')
  accessor thumbElement!: HTMLDivElement;

  /** The wrapping element the thumb's position is measured against. */
  @query('.track')
  accessor trackElement!: HTMLDivElement;

  /** All `<button-slider-option->` children currently assigned to the slot. */
  @queryAssignedElements({ selector: 'button-slider-option-' })
  accessor optionElements!: ButtonSliderOption[];

  /** Guards against animating the thumb into place on first render. */
  private hasPositionedOnce = false;

  /** Keeps the thumb correctly placed when an option resizes (e.g. font load, text change). */
  // deno-lint-ignore no-undef
  private resizeObserver = new ResizeObserver(() => this.positionThumb());

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'radiogroup');
    // The group itself is the only Tab stop; individual options are
    // never focused directly (see `#handleKeydown` / `aria-activedescendant`).
    this.tabIndex = 0;
  }

  protected override firstUpdated(): void {
    // `slotchange` is not reliably guaranteed to fire for content that
    // was already present at parse time in every browser; running this
    // once explicitly guarantees correct initial state regardless.
    this.handleSlotChange();
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('value')) {
      this.syncSelection();
    }
  }

  /**
   * Called whenever the slotted `<button-slider-option->` children
   * change. Defaults `value` to the first option if nothing (or an
   * option that no longer exists) is selected, then syncs selection
   * state and repositions the thumb.
   */
  private handleSlotChange(): void {
    this.resizeObserver.disconnect();
    for (const option of this.optionElements) {
      this.resizeObserver.observe(option);
    }

    const hasValidSelection = this.optionElements.some((option) => option.value === this.value);
    if (!hasValidSelection && this.optionElements.length > 0) {
      this.value = this.optionElements[0].value;
      return; // `updated()` will run `#syncSelection()` from the `value` change above.
    }

    this.syncSelection();
  }

  /**
   * Marks the option matching `value` as selected (all others as not),
   * points `aria-activedescendant` at it, and repositions the sliding
   * thumb behind it.
   */
  private syncSelection(): void {
    let selected: ButtonSliderOption | undefined;

    for (const option of this.optionElements) {
      option.selected = option.value === this.value;
      if (option.selected) selected = option;
    }

    if (selected) {
      this.setAttribute('aria-activedescendant', selected.id);
    } else {
      this.removeAttribute('aria-activedescendant');
    }

    this.positionThumb();
  }

  /**
   * Measures the currently selected option's position/size relative to
   * `.track` and moves the thumb there. Skips the transition for the
   * very first positioning so the thumb doesn't visibly slide in from
   * the top-left corner on initial render.
   */
  private positionThumb(): void {
    const selected = this.optionElements.find((option) => option.selected);
    if (!selected || !this.thumbElement || !this.trackElement) return;

    const trackRect = this.trackElement.getBoundingClientRect();
    const optionRect = selected.getBoundingClientRect();

    if (!this.hasPositionedOnce) {
      this.thumbElement.style.transition = 'none';
    }

    this.thumbElement.style.width = `${optionRect.width}px`;
    this.thumbElement.style.transform = `translateX(${optionRect.left - trackRect.left}px)`;

    if (!this.hasPositionedOnce) {
      // Force layout so `transition: none` above actually applies before
      // we remove it, then re-enable animation for future changes.
      this.thumbElement.offsetHeight;
      this.thumbElement.style.transition = '';
      this.hasPositionedOnce = true;
    }
  }

  /**
   * Handles a selection request bubbling up from any child
   * `<button-slider-option->`.
   *
   * @param event - The `button-slider-option-:select` custom event.
   */
  private handleOptionSelect(event: CustomEvent<SliderSelectDetail>): void {
    this.selectValue(event.detail.value);
    // Mirrors clicking a native radio: focus lands on the (now selected)
    // control so arrow keys work immediately afterwards.
    this.focus();
  }

  /**
   * Moves the active selection between options via the arrow keys, and
   * to the first/last option via Home/End. Real DOM focus never leaves
   * the group itself - this only updates `value` (and, via
   * `#syncSelection()`, `aria-activedescendant`), mirroring how a native
   * `<select>` handles arrow keys without moving Tab focus anywhere.
   *
   * @param event - The keydown event. Fires directly on the group,
   *        since it's the element that actually holds focus.
   */
  private handleKeydown(event: KeyboardEvent): void {
    const currentIndex = this.optionElements.findIndex((option) => option.selected);
    if (currentIndex === -1) return;

    const numberIndex = this.numberKeyToIndex(event.key);
    if (numberIndex !== null) {
      event.preventDefault();
      this.selectValue(this.optionElements[numberIndex].value);
      return;
    }

    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        nextIndex = (currentIndex + 1) % this.optionElements.length;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        nextIndex = (currentIndex - 1 + this.optionElements.length) % this.optionElements.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = this.optionElements.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.selectValue(this.optionElements[nextIndex].value);
  }

  /**
   * Maps a pressed digit key (`"1"`-`"9"`) to a zero-based option index,
   * so e.g. pressing `2` selects the second option. Only enabled while
   * there are fewer than 10 options, so every option has an
   * unambiguous single-digit shortcut.
   *
   * @param key - `event.key` from the keydown event.
   * @returns The matching option's index, or `null` if the key isn't a
   *          usable digit, there are 10+ options, or no option exists
   *          at that position (e.g. `5` with only 3 options).
   */
  private numberKeyToIndex(key: string): number | null {
    if (this.optionElements.length >= 10) return null;
    if (!/^[1-9]$/.test(key)) return null;

    const index = Number(key) - 1;
    return index < this.optionElements.length ? index : null;
  }

  /**
   * Updates `value` if it actually changed and notifies listeners.
   *
   * @param value - The newly selected option's value.
   */
  private selectValue(value: string): void {
    if (value === this.value) return;
    this.value = value;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render(): TemplateResult {
    return html`
      <div class="track">
        <div class="thumb"></div>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'button-slider-': ButtonSlider;
  }
}
