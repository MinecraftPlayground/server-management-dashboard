import { type TemplateResult, html, nothing } from '@lit'
import { customElement, property, state, query } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';
import type { Option } from '../option/index.ts';

import style from './index.css' with {type: 'css'};

/**
 * A themeable select modelled on the native `<select>`: a closed
 * trigger showing the current value, opening a popup listbox of
 * `<option->` children (optionally grouped via `<option-group->`).
 * Supports `multiple` selection and `disabled`.
 *
 * The popup is a native `<dialog>` shown non-modally (`.show()`, not
 * `.showModal()`) — no top layer, no backdrop, no focus trap, so Tab
 * moves through the page normally, matching the closed-trigger
 * behaviour. Position/size come from CSS Anchor Positioning with a
 * JS-measured fallback where that's not supported (see `index.css` and
 * `positionPopupManually()`). Because there's no backdrop or trap to
 * lean on, this component detects "click outside" and "focus left the
 * component" itself (`handleOutsideClick()`, `handleFocusOut()`).
 *
 * Tab reaches the closed trigger and opens the popup on focus (arrows/
 * Enter/Space also open it if it's closed-but-already-focused). The
 * highlight ring on the active option only appears when opened via
 * keyboard, not via mouse click — see `keyboardNavActive`. Once open,
 * Arrow Up/Down move the highlight, Enter/Space confirm it, Escape or
 * Tabbing away closes without changing anything (Tab also moves focus
 * on to the next element, as normal).
 *
 * @element select-
 *
 * @slot - `<option->` children, optionally wrapped in `<option-group->`.
 *
 * @fires change - Fired on selection change. `event.detail` is the
 *        newly selected value(s) — a `string` normally, or `string[]`
 *        while `multiple` is set.
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
 * @example Multi-select — closed trigger shows "Option 1 +1 mehr" etc.
 * ```html
 * <select- multiple @change=${(e) => console.log(e.detail)}>
 *   <option- value="option_1" selected>Option 1</option->
 *   <option- value="option_2" selected>Option 2</option->
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
    this.addEventListener('focus', this.handleFocus);
    this.addEventListener('focusout', this.handleFocusOut);
    this.addEventListener('mousedown', this.handleMouseDown);
  }

  /** Text shown in the closed trigger when nothing is selected. */
  @property({ attribute: 'placeholder' })
  accessor placeholder: string = 'Auswählen…';

  /** Message shown inside the popup when there are no `<option->` descendants. */
  @property({ attribute: 'empty-message' })
  accessor emptyMessage: string = 'No options available';

  /** Word used in the closed trigger's "First +N …" label when `multiple` is set. */
  @property({ attribute: 'more-label' })
  accessor moreLabel: string = 'mehr';

  /** Allows selecting more than one option. Closed trigger then shows "First +N mehr". */
  @property({ attribute: 'multiple', reflect: true, type: Boolean })
  accessor multiple: boolean = false;

  /** Disables the whole control — not focusable, doesn't open, ignores clicks. */
  @property({ attribute: 'disabled', reflect: true, type: Boolean })
  accessor disabled: boolean = false;

  /** Whether the popup is open. Reflected, so it can be set declaratively (`<select- open>`). */
  @property({ attribute: 'open', reflect: true, type: Boolean })
  accessor open: boolean = false;

  /** Label text shown in the closed trigger — the selection, or "First +N mehr" while `multiple`. */
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

  /** Non-disabled options — the only ones reachable via keyboard or click. */
  private get selectableOptions(): Option[] {
    return this.optionElements.filter((option) => !option.disabled);
  }

  /** Index (within `selectableOptions`) that's currently keyboard-highlighted. */
  private activeIndex = 0;

  /**
   * Whether the popup was opened via keyboard (Tab landing on the host,
   * or Enter/Space/arrows while closed-but-focused) rather than mouse
   * click — gates the highlight ring on the active option, similar to
   * `:focus-visible`. Set by whichever opening path triggers `open =
   * true`; `handleFocus()` in particular has to distinguish a genuine
   * Tab-focus from the `.focus()` call `handleTriggerClick()` makes on
   * itself, via `focusingProgrammatically`.
   */
  private keyboardNavActive = false;

  /** Set around our own `this.focus()` call in `handleTriggerClick()`, so `handleFocus()` can tell it apart from a genuine Tab-focus. */
  private focusingProgrammatically = false;

  /**
   * Whether the host already had focus at the moment of the most
   * recent mousedown — captured before the browser's default
   * click-focuses-the-target behaviour runs. Needed so
   * `handleTriggerClick()` can tell "this click just gave the host
   * focus for the first time" (where `handleFocus()` already opened
   * the popup a moment ago) apart from "the host was already focused
   * and open, and this is a deliberate click to close it".
   */
  private wasFocusedBeforeMouseDown = false;

  /** Bound once so it can be added/removed as a `document` listener while open. */
  private handleOutsideClickBound = this.handleOutsideClick.bind(this);

  /**
   * The currently selected value(s). A `string` (empty if nothing
   * selected) normally; a `string[]` while `multiple` is set.
   */
  get value(): string | string[] {
    const selected = this.optionElements.filter((option) => option.selected).map((option) => option.value);
    return this.multiple ? selected : (selected[0] ?? '');
  }

  set value(newValue: string | string[]) {
    const valuesToSelect = new Set(Array.isArray(newValue) ? newValue : [newValue].filter(Boolean));
    for (const option of this.optionElements) {
      option.selected = valuesToSelect.has(option.value);
    }
    this.syncSelectedLabel();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.tabIndex = this.disabled ? -1 : 0;
    this.setAttribute('role', 'combobox');
    this.setAttribute('aria-haspopup', 'listbox');
    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true');
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleOutsideClickBound);
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
    if (changed.has('disabled')) {
      this.tabIndex = this.disabled ? -1 : 0;
      this.setAttribute('aria-disabled', String(this.disabled));
      if (this.disabled) {
        this.open = false;
      }
    }

    if (changed.has('multiple') && this.dialogElement) {
      if (this.multiple) {
        this.dialogElement.setAttribute('aria-multiselectable', 'true');
      } else {
        this.dialogElement.removeAttribute('aria-multiselectable');
      }
    }

    if (!changed.has('open')) return;

    this.setAttribute('aria-expanded', String(this.open));

    if (this.open) {
      this.showDialog();
    } else if (this.dialogElement?.open) {
      this.dialogElement.close();
      document.removeEventListener('click', this.handleOutsideClickBound);
      for (const option of this.optionElements) {
        option.active = false;
      }
      this.dialogElement.removeAttribute('aria-activedescendant');
    }
  }

  /**
   * In single-select mode, ensures something is selected by default
   * (mirroring native `<select>`, skipping disabled options) — multi-
   * select has no such default, an empty selection is valid there. Then
   * syncs the trigger label and empty-state flag.
   */
  private handleSlotChange(): void {
    const options = this.optionElements;

    if (!this.multiple && options.length > 0 && !options.some((option) => option.selected)) {
      const firstSelectable = options.find((option) => !option.disabled);
      if (firstSelectable) firstSelectable.selected = true; // silent — no `change` for this default
    }

    this.hasOptions = options.length > 0;
    this.syncSelectedLabel();
  }

  /**
   * Builds the closed trigger's label from the current selection: the
   * single selected option's text, or (while `multiple`) the first
   * selected option's text plus a "+N `moreLabel`" suffix for the rest.
   */
  private syncSelectedLabel(): void {
    const selected = this.optionElements.filter((option) => option.selected);

    if (selected.length === 0) {
      this.selectedLabel = '';
      return;
    }

    const firstLabel = selected[0].textContent?.trim() ?? '';
    const remaining = selected.length - 1;

    this.selectedLabel = remaining > 0 ? `${firstLabel} +${remaining} ${this.moreLabel}` : firstLabel;
  }

  /** Shows the dialog non-modally, wires up outside-click detection, and picks the initial keyboard-highlighted option. */
  private showDialog(): void {
    if (this.disabled || !this.dialogElement || this.dialogElement.open) return;

    this.dialogElement.classList.remove('flip-block', 'flip-inline');
    this.dialogElement.show();
    document.addEventListener('click', this.handleOutsideClickBound);

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
   * and toggles `.flip-block`/`.flip-inline` — each switches which
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
   * Opens the popup on focus. Marks `keyboardNavActive` true unless
   * this focus came from our own `handleTriggerClick()` calling
   * `this.focus()` (tracked via `focusingProgrammatically`) — so Tab
   * shows the highlight immediately, but a mouse click doesn't.
   */
  private handleFocus(): void {
    if (this.disabled) return;
    this.keyboardNavActive = !this.focusingProgrammatically;
    this.open = true;
  }

  /**
   * Closes the popup once focus genuinely leaves the component (e.g.
   * Tab to the next element) — mirrors a native `<select>` closing on
   * blur. Uses `focusout`'s `relatedTarget` to avoid closing when focus
   * moves to something else *inside* this element.
   *
   * @param event - The focusout event.
   */
  private handleFocusOut(event: FocusEvent): void {
    const nextFocusTarget = event.relatedTarget as Node | null;
    if (nextFocusTarget && this.contains(nextFocusTarget)) return;
    this.open = false;
  }

  /**
   * Captures whether the host already had focus *before* this
   * mousedown — a mousedown on an unfocused element focuses it before
   * `click` fires, which would otherwise make `handleTriggerClick()`
   * think the popup was already open (from `handleFocus()`) and
   * immediately toggle it back closed.
   */
  private handleMouseDown(): void {
    this.wasFocusedBeforeMouseDown = document.activeElement === this;
  }

  /**
   * Focuses the host before opening (see `focusingProgrammatically` re:
   * why `handleFocus()` needs to know this happened). If this click is
   * what's giving the host focus for the first time, `handleFocus()`
   * has already opened the popup; skip the toggle so we don't
   * immediately close it again.
   */
  private handleTriggerClick(): void {
    if (this.disabled) return;

    this.focusingProgrammatically = true;
    this.focus();
    this.focusingProgrammatically = false;

    if (!this.wasFocusedBeforeMouseDown) return;
    this.open = !this.open;
  }

  /**
   * Closes the popup on a genuine click outside this element.
   *
   * @param event - The document-level click event.
   */
  private handleOutsideClick(event: MouseEvent): void {
    if (event.composedPath().includes(this)) return;
    this.open = false;
  }

  /**
   * Sets which option is keyboard-highlighted, updating
   * `aria-activedescendant` on the dialog and each option's `active` state.
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
    active.active = this.keyboardNavActive;
    this.dialogElement?.setAttribute('aria-activedescendant', active.id);
  }

  /**
   * Closed-but-focused (e.g. right after Escape or selecting an option
   * — focus returns to the host, but the popup is now shut): Enter,
   * Space, or either arrow reopens it. The very first open, from Tab
   * landing on the host, already happens via `handleFocus()`.
   *
   * Open: arrows move the highlight (wrapping). Enter/Space commit it —
   * replacing the selection and closing in single-select mode, or
   * toggling just that option without closing in multi-select mode, so
   * more can be picked. Escape closes unchanged.
   *
   * @param event - The keydown event.
   */
  private handleKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;

    if (!this.open) {
      switch (event.key) {
        case 'Enter':
        case ' ':
        case 'ArrowDown':
        case 'ArrowUp':
          event.preventDefault();
          this.keyboardNavActive = true;
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
        if (this.multiple) {
          this.toggleValue(active.value);
        } else {
          this.commitValue(active.value);
          this.open = false;
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.open = false;
        break;
    }
  }

  /** Keeps `open` in sync if something outside our control closes the native dialog. */
  private handleDialogClose(): void {
    this.open = false;
  }

  /**
   * Handles a clicked `<option->`: in single-select mode, commits it as
   * the sole selection and closes the popup. In multi-select mode,
   * toggles just that option and leaves the popup open so more can be picked.
   *
   * @param event - The `option-:toggle` custom event.
   */
  private handleOptionToggle(event: CustomEvent<{ value: string }>): void {
    if (this.multiple) {
      this.toggleValue(event.detail.value);
    } else {
      this.commitValue(event.detail.value);
      this.open = false;
    }
  }

  /**
   * Selects exactly one option by value (single-select), syncs the
   * trigger label, and fires `change` if the value actually changed.
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
      this.dispatchChange();
    }
  }

  /**
   * Flips one option's `selected` state without affecting any others
   * (multi-select), syncs the trigger label, and fires `change`.
   *
   * @param value - The value to toggle.
   */
  private toggleValue(value: string): void {
    const option = this.optionElements.find((candidate) => candidate.value === value);
    if (!option || option.disabled) return;

    option.selected = !option.selected;
    this.syncSelectedLabel();
    this.dispatchChange();
  }

  private dispatchChange(): void {
    this.dispatchEvent(
      new CustomEvent<string | string[]>('change', {
        detail: this.value,
        bubbles: true,
        composed: true,
      }),
    );
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
