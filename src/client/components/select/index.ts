import { type TemplateResult, html, nothing } from '@lit'
import { customElement, property, state, query } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';
import type { Option } from '../option/index.ts';

import style from './index.css' with {type: 'css'};

/**
 * A themeable select modelled on the native `<select>`: a closed
 * trigger showing the current value, opening a popup listbox of
 * `<option->` children (optionally grouped via `<option-group->`).
 *
 * The popup is a native `<dialog>` (`showModal()`), positioned via CSS
 * Anchor Positioning with a JS-measured fallback where that's not
 * supported (see `index.css` and `positionPopupManually()`).
 *
 * @element select-
 *
 * @slot - `<option->` children, optionally wrapped in `<option-group->`.
 *
 * @fires change - Fired on selection change. `event.detail` is the
 *        newly selected value (`string`).
 *
 * @example
 * ```html
 * <select- @change=${(e) => console.log(e.detail)}>
 *   <option- value="option_1">Option 1</option->
 *   <option- value="option_2" selected>Option 2</option->
 *   <option- value="option_3" disabled>Option 3</option->
 * </select->
 * ```
 *
 * @example With groups
 * ```html
 * <select->
 *   <option-group- label="First Group">
 *     <option- value="option_1">Option 1</option->
 *   </option-group->
 *   <option-group- label="Second Group">
 *     <option- value="option_2">Option 2</option->
 *   </option-group->
 * </select->
 * ```
 */
@customElement('select-')
export class Select extends CustomElement {
  static override styles = style

  constructor() {
    super();
    this.addEventListener('keydown', this.handleKeydown);
  }

  /** Text shown in the closed trigger when nothing is selected. */
  @property({ attribute: 'placeholder' })
  accessor placeholder: string = 'Auswählen…';

  /** Message shown inside the popup when there are no `<option->` descendants. */
  @property({ attribute: 'empty-message' })
  accessor emptyMessage: string = 'No options available';

  /** Whether the popup is open. Reflected, so it can be set declaratively (`<select- open>`). */
  @property({ attribute: 'open', reflect: true, type: Boolean })
  accessor open: boolean = false;

  /** Label text of the currently selected option, shown in the closed trigger. */
  @state()
  accessor selectedLabel: string = '';

  /** Whether there is at least one `<option->` descendant right now. */
  @state()
  accessor hasOptions: boolean = false;

  @query('dialog')
  accessor dialogElement!: HTMLDialogElement;

  @query('.trigger')
  accessor triggerElement!: HTMLDivElement;

  /**
   * All `<option->` descendants, however deeply nested. A plain
   * light-DOM query rather than `queryAssignedElements`, since the
   * latter can't see inside a slotted `<option-group->`'s own shadow DOM.
   */
  private get optionElements(): Option[] {
    return Array.from(this.querySelectorAll('option-'));
  }

  /** Non-disabled options - the only ones reachable via keyboard or click. */
  private get selectableOptions(): Option[] {
    return this.optionElements.filter((option) => !option.disabled);
  }

  /** Index (within `selectableOptions`) that's currently keyboard-highlighted. */
  private activeIndex = 0;

  /**
   * Whether arrow keys have been pressed since the popup opened - gates
   * the highlight ring on the active option, similar to
   * `:focus-visible`, so opening via mouse click doesn't show a
   * highlight nobody asked for.
   */
  private keyboardNavActive = false;

  /** The currently selected option's value, or `''` if none is selected. */
  get value(): string {
    return this.optionElements.find((option) => option.selected)?.value ?? '';
  }

  set value(newValue: string) {
    for (const option of this.optionElements) {
      option.selected = option.value === newValue;
    }
    this.syncSelectedLabel();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.tabIndex = 0;
    this.setAttribute('role', 'combobox');
    this.setAttribute('aria-haspopup', 'listbox');
  }

  protected override firstUpdated(): void {
    // `slotchange` isn't reliably guaranteed to fire for content already
    // present at parse time in every browser; run this once to be sure.
    this.handleSlotChange();

    if (this.open) {
      this.showDialog();
    }
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (!changed.has('open')) return;

    this.setAttribute('aria-expanded', String(this.open));

    if (this.open) {
      this.showDialog();
    } else if (this.dialogElement?.open) {
      this.dialogElement.close();
      for (const option of this.optionElements) {
        option.active = false;
      }
      this.dialogElement.removeAttribute('aria-activedescendant');
    }
  }

  /**
   * Ensures something is selected by default (mirroring native
   * `<select>`, skipping disabled options), then syncs the trigger
   * label and empty-state flag.
   */
  private handleSlotChange(): void {
    const options = this.optionElements;

    if (options.length > 0 && !options.some((option) => option.selected)) {
      const firstSelectable = options.find((option) => !option.disabled);
      if (firstSelectable) firstSelectable.selected = true; // silent - no `change` for this default
    }

    this.hasOptions = options.length > 0;
    this.syncSelectedLabel();
  }

  /** Reads the current selection's text content into `selectedLabel`. */
  private syncSelectedLabel(): void {
    const selected = this.optionElements.find((option) => option.selected);
    this.selectedLabel = selected?.textContent?.trim() ?? '';
  }

  /** Shows the dialog and picks the initial keyboard-highlighted option. */
  private showDialog(): void {
    if (!this.dialogElement || this.dialogElement.open) return;

    this.dialogElement.classList.remove('flip-block', 'flip-inline');
    this.dialogElement.showModal();

    this.keyboardNavActive = false;
    const selectedIndex = this.selectableOptions.findIndex((option) => option.selected);
    this.setActiveIndex(Math.max(selectedIndex, 0));

    if (CSS.supports('anchor-name', '--select-trigger')) {
      this.applyAnchorFlipClasses();
    } else {
      this.positionPopupManually();
    }
  }

  /**
   * Measures the popup's natural size against available viewport space
   * and toggles `.flip-block`/`.flip-inline` - each switches which
   * `anchor()` expression `index.css` uses for that axis. JS-driven
   * instead of `position-try-fallbacks`, which isn't reliably supported
   * everywhere yet.
   */
  private applyAnchorFlipClasses(): void {
    const triggerRect = this.triggerElement.getBoundingClientRect();
    const popupRect = this.dialogElement.getBoundingClientRect();

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const needsFlipBlock = spaceBelow < popupRect.height && spaceAbove > spaceBelow;

    const spaceRight = window.innerWidth - triggerRect.left;
    const needsFlipInline = spaceRight < popupRect.width;

    this.dialogElement.classList.toggle('flip-block', needsFlipBlock);
    this.dialogElement.classList.toggle('flip-inline', needsFlipInline);
  }

  /** Fallback for browsers without CSS Anchor Positioning: same corner-aware placement, computed manually. */
  private positionPopupManually(): void {
    const triggerRect = this.triggerElement.getBoundingClientRect();
    const popupHeight = this.dialogElement.offsetHeight;
    const popupWidth = this.dialogElement.offsetWidth;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const openUpward = spaceBelow < popupHeight && spaceAbove > spaceBelow;
    const alignRight = triggerRect.left + popupWidth > viewportWidth;

    const style = this.dialogElement.style;
    style.minWidth = `${triggerRect.width}px`;

    if (alignRight) {
      style.left = 'auto';
      style.right = `${viewportWidth - triggerRect.right}px`;
    } else {
      style.left = `${triggerRect.left}px`;
      style.right = 'auto';
    }

    if (openUpward) {
      style.top = 'auto';
      style.bottom = `${viewportHeight - triggerRect.top + 4}px`;
    } else {
      style.top = `${triggerRect.bottom + 4}px`;
      style.bottom = 'auto';
    }
  }

  /**
   * Focuses the host before opening - matters because `<dialog>`
   * restores focus to whatever had it before `showModal()` on close. A
   * mouse click alone never gives the host real focus otherwise,
   * breaking subsequent Tab navigation.
   */
  private handleTriggerClick(): void {
    this.focus();
    this.open = !this.open;
  }

  /**
   * Sets which option is keyboard-highlighted, updating
   * `aria-activedescendant` on the dialog (the element that actually
   * holds focus while open) and each option's `active` state.
   *
   * @param index - Index into `selectableOptions` to highlight.
   */
  private setActiveIndex(index: number): void {
    const selectable = this.selectableOptions;

    for (const option of this.optionElements) {
      option.active = false;
    }

    if (selectable.length === 0) {
      this.activeIndex = 0;
      this.dialogElement?.removeAttribute('aria-activedescendant');
      return;
    }

    this.activeIndex = Math.min(Math.max(index, 0), selectable.length - 1);
    const active = selectable[this.activeIndex];
    active.active = this.keyboardNavActive; // see keyboardNavActive doc
    this.dialogElement?.setAttribute('aria-activedescendant', active.id);
  }

  /**
   * Closed: Enter/Space/either arrow opens the popup. Open: arrows move
   * the highlight (wrapping), Enter/Space commits it and closes,
   * Escape closes unchanged (native `<dialog>` already does this too -
   * this is just an explicit, redundant-but-harmless path to the same
   * result via `handleDialogClose()`).
   *
   * @param event - The keydown event.
   */
  private handleKeydown(event: KeyboardEvent): void {
    if (!this.open) {
      switch (event.key) {
        case 'Enter':
        case ' ':
        case 'ArrowDown':
        case 'ArrowUp':
          event.preventDefault();
          this.open = true;
          break;
      }
      return;
    }

    const selectable = this.selectableOptions;

    switch (event.key) {
      case 'ArrowDown':
        if (selectable.length === 0) return;
        event.preventDefault();
        this.keyboardNavActive = true;
        this.setActiveIndex((this.activeIndex + 1) % selectable.length);
        break;
      case 'ArrowUp':
        if (selectable.length === 0) return;
        event.preventDefault();
        this.keyboardNavActive = true;
        this.setActiveIndex((this.activeIndex - 1 + selectable.length) % selectable.length);
        break;
      case 'Enter':
      case ' ': {
        if (selectable.length === 0) return;
        event.preventDefault();
        const active = selectable[this.activeIndex];
        this.commitValue(active.value);
        this.open = false;
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.open = false;
        break;
    }
  }

  /**
   * A genuine backdrop click: with `showModal()`, clicking outside the
   * dialog's content targets the dialog element itself, never a
   * descendant.
   *
   * @param event - The click event, listened for on the dialog.
   */
  private handleDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogElement) {
      this.open = false;
    }
  }

  /** Keeps `open` in sync if something outside our control closes the native dialog. */
  private handleDialogClose(): void {
    this.open = false;
  }

  /**
   * Commits a clicked `<option->` as the selection and closes the popup.
   *
   * @param event - The `option-:toggle` custom event.
   */
  private handleOptionToggle(event: CustomEvent<{ value: string }>): void {
    this.commitValue(event.detail.value);
    this.open = false;
  }

  /**
   * Selects exactly one option by value, syncs the trigger label, and
   * fires `change` if the value actually changed.
   *
   * @param value - The value to select.
   */
  private commitValue(value: string): void {
    const changed = this.value !== value;

    for (const option of this.optionElements) {
      option.selected = option.value === value;
    }
    this.syncSelectedLabel();

    if (changed) {
      this.dispatchEvent(
        new CustomEvent<string>('change', {
          detail: value,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  override render(): TemplateResult {
    return html`
      <div class="trigger" @click=${this.handleTriggerClick}>
        <span class="label ${this.selectedLabel ? '' : 'placeholder'}">
          ${this.selectedLabel || this.placeholder}
        </span>
        <svg class="chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <dialog
        role="listbox"
        @click=${this.handleDialogClick}
        @close=${this.handleDialogClose}
        @option-:toggle=${this.handleOptionToggle}
      >
        ${!this.hasOptions ? html`<div class="empty">${this.emptyMessage}</div>` : nothing}
        <slot @slotchange=${this.handleSlotChange}></slot>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'select-': Select;
  }
}
