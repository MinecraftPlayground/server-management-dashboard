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
 * A segmented, animated toggle between mutually exclusive options (e.g.
 * a Dark/Light switch). Options are `<button-slider-option->` children;
 * this element owns selection state, the sliding highlight, and
 * keyboard interaction.
 *
 * Only the group itself is a Tab stop (`role="radiogroup"` +
 * `tabindex="0"`) - arrow keys move the active option via
 * `aria-activedescendant` rather than moving real focus between options.
 *
 * @element button-slider-
 *
 * @slot - One or more `<button-slider-option->` elements.
 *
 * @fires change - Fired on selection change (click or keyboard).
 *        `event.detail` contains `{ value }` - read it off
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
      this.#handleOptionSelect as EventListener,
    );
    this.addEventListener('keydown', this.#handleKeydown);
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
  #hasPositionedOnce = false;

  /** Keeps the thumb correctly placed when an option resizes (e.g. font load, text change). */
  #resizeObserver = new ResizeObserver(() => this.#positionThumb());

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
    this.#handleSlotChange();
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('value')) {
      this.#syncSelection();
    }
  }

  /** Defaults `value` to the first option if the current one no longer exists, then syncs selection and the thumb. */
  #handleSlotChange(): void {
    this.#resizeObserver.disconnect();
    for (const option of this.optionElements) {
      this.#resizeObserver.observe(option);
    }

    const hasValidSelection = this.optionElements.some((option) => option.value === this.value);
    if (!hasValidSelection && this.optionElements.length > 0) {
      this.value = this.optionElements[0].value;
      return; // `updated()` will run `#syncSelection()` from the `value` change above.
    }

    this.#syncSelection();
  }

  /** Marks the option matching `value` as selected, points `aria-activedescendant` at it, and repositions the thumb. */
  #syncSelection(): void {
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

    this.#positionThumb();
  }

  /**
   * Moves the thumb to the selected option's position/size. Skips the
   * transition on the very first call so it doesn't visibly slide in
   * from the top-left corner on initial render.
   */
  #positionThumb(): void {
    const selected = this.optionElements.find((option) => option.selected);
    if (!selected || !this.thumbElement || !this.trackElement) return;

    const trackRect = this.trackElement.getBoundingClientRect();
    const optionRect = selected.getBoundingClientRect();

    if (!this.#hasPositionedOnce) {
      this.thumbElement.style.transition = 'none';
    }

    this.thumbElement.style.width = `${optionRect.width}px`;
    this.thumbElement.style.transform = `translateX(${optionRect.left - trackRect.left}px)`;

    if (!this.#hasPositionedOnce) {
      // Force layout so `transition: none` above actually applies before
      // we remove it, then re-enable animation for future changes.
      this.thumbElement.offsetHeight;
      this.thumbElement.style.transition = '';
      this.#hasPositionedOnce = true;
    }
  }

  /**
   * Handles a selection request bubbling up from any child
   * `<button-slider-option->`.
   *
   * @param event - The `button-slider-option-:select` custom event.
   */
  #handleOptionSelect(event: CustomEvent<SliderSelectDetail>): void {
    this.#selectValue(event.detail.value);
    // Mirrors clicking a native radio: focus lands on the (now selected)
    // control so arrow keys work immediately afterwards.
    this.focus();
  }

  /**
   * Arrow keys/Home/End/digits move the selection - real focus never
   * leaves the group, only `value` (and `aria-activedescendant`) change.
   *
   * @param event - The keydown event, fired on the group itself.
   */
  #handleKeydown(event: KeyboardEvent): void {
    const currentIndex = this.optionElements.findIndex((option) => option.selected);
    if (currentIndex === -1) return;

    const numberIndex = this.#numberKeyToIndex(event.key);
    if (numberIndex !== null) {
      event.preventDefault();
      this.#selectValue(this.optionElements[numberIndex].value);
      return;
    }

    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % this.optionElements.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
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
    this.#selectValue(this.optionElements[nextIndex].value);
  }

  /**
   * Maps a digit key (`"1"`-`"9"`) to a zero-based option index. Only
   * enabled below 10 options, so every option has an unambiguous shortcut.
   *
   * @param key - `event.key` from the keydown event.
   * @returns The matching index, or `null`.
   */
  #numberKeyToIndex(key: string): number | null {
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
  #selectValue(value: string): void {
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
        <slot @slotchange=${this.#handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'button-slider-': ButtonSlider;
  }
}
