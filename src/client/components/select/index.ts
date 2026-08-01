import { type TemplateResult, html } from '@lit'
import { customElement, property, queryAssignedElements } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';
import type { Option } from '../option/index.ts';
import { fuzzySearch, type SearchData } from '../search/fuzzy_search.ts';

import style from './index.css' with {type: 'css'};


/**
 * A themeable, accessible select - a listbox of `<option->` children,
 * optionally filterable via a slotted `<search->`.
 *
 * The group itself is always the single Tab stop (`role="listbox"` +
 * `tabindex="0"` on the host), even when a `<search->` is present -
 * arrow keys move the highlighted option via `aria-activedescendant`
 * without moving real DOM focus. Typing requires explicitly
 * clicking/tabbing into the search field itself.
 *
 * @element select-
 *
 * @slot - `<option->` children, and optionally a single `<search->`
 *         (anywhere among them) to enable filtering.
 *
 * @fires change - Fired whenever the selection changes, via click or
 *        keyboard. `event.detail` is a `string` (single-select) or
 *        `string[]` (multi-select, `multiple` attribute present).
 *
 * @example Single-select
 * ```html
 * <select- @change=${(e) => console.log(e.detail)}>
 *   <option- value="option_1">Option 1</option->
 *   <option- value="option_2" selected>Option 2</option->
 * </select->
 * ```
 *
 * @example Multi-select with search
 * ```html
 * <select- multiple @change=${(e) => console.log(e.detail)}>
 *   <search-></search->
 *   <option- value="option_1" tags="fruit">Option 1</option->
 *   <option- value="option_2" selected>Option 2</option->
 * </select->
 * ```
 */
@customElement('select-')
export class Select extends CustomElement {
  static override styles = style

  constructor() {
    super();
    this.addEventListener('option-:toggle', this.handleOptionToggle as EventListener);
    this.addEventListener('input', this.handleSearchInput as EventListener);
    this.addEventListener('keydown', this.handleKeydown);
  }

  /** Enables multi-select. When absent, exactly one option is always selected. */
  @property({ attribute: 'multiple', reflect: true, type: Boolean })
  accessor multiple: boolean = false;

  /** All `<option->` children currently assigned to the slot, filtered or not. */
  @queryAssignedElements({ selector: 'option-' })
  accessor optionElements!: Option[];

  /** Index (within the currently *visible* options) that's keyboard-highlighted. */
  private activeIndex = 0;

  /**
   * The currently selected value(s), derived from which `<option->`
   * children have `selected` set - not a separately-tracked field, so
   * it can never drift out of sync with what's declared in markup.
   * `string` in single-select mode (empty string if nothing selected),
   * `string[]` in multi-select mode.
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
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'listbox');
    this.tabIndex = 0;
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (!changed.has('multiple')) return;

    if (this.multiple) {
      this.setAttribute('aria-multiselectable', 'true');
    } else {
      this.removeAttribute('aria-multiselectable');
    }
  }

  protected override firstUpdated(): void {
    // `slotchange` is not reliably guaranteed to fire for content that
    // was already present at parse time in every browser; running this
    // once explicitly guarantees correct initial state regardless.
    this.handleSlotChange();
  }

  /**
   * Ensures single-select mode always has *something* selected by
   * default (mirroring native `<select>`), then establishes the
   * initial keyboard-active option. Runs on every slot change so newly
   * added/removed options stay correctly accounted for.
   */
  private handleSlotChange(): void {
    if (!this.multiple && this.optionElements.length > 0 && !this.optionElements.some((option) => option.selected)) {
      this.optionElements[0].selected = true; // silent - no `change` event for this default
    }

    const visibleOptions = this.optionElements.filter((option) => !option.hidden);
    const preSelectedIndex = visibleOptions.findIndex((option) => option.selected);
    this.setActiveIndex(Math.max(preSelectedIndex, 0), visibleOptions);
  }

  /**
   * Filters options via `fuzzySearch()` against each option's own text
   * content plus its optional `tags` attribute. An empty query shows
   * everything again.
   *
   * @param event - The `input` event, bubbled up from a slotted `<search->`.
   */
  private handleSearchInput(event: CustomEvent<string>): void {
    const trimmed = event.detail.trim();

    if (!trimmed) {
      for (const option of this.optionElements) option.hidden = false;
    } else {
      const data: SearchData[] = this.optionElements.map((option) => ({
        text: option.textContent?.trim() ?? '',
        tags: option.tags ? option.tags : [],
      }));

      const matchedIndices = new Set(fuzzySearch(data, trimmed).map((result) => result.index));
      this.optionElements.forEach((option, index) => {
        option.hidden = !matchedIndices.has(index);
      });
    }

    this.setActiveIndex(0, this.optionElements.filter((option) => !option.hidden));
  }

  /**
   * Handles a selection request bubbling up from a clicked `<option->`.
   * In single-select mode it becomes the sole selection; in
   * multi-select mode its own selection is toggled. Either way it also
   * becomes the keyboard-active option, and focus moves to the group -
   * mirroring how clicking a native radio/checkbox also focuses it.
   *
   * @param event - The `option-:toggle` custom event.
   */
  private handleOptionToggle(event: CustomEvent<{ value: string }>): void {
    const visibleOptions = this.optionElements.filter((option) => !option.hidden);
    const index = visibleOptions.findIndex((option) => option.value === event.detail.value);
    if (index !== -1) this.setActiveIndex(index, visibleOptions);

    if (this.multiple) {
      this.toggleSelection(event.detail.value);
    } else {
      this.selectOnly(event.detail.value);
    }

    this.focus();
  }

  /**
   * Arrow keys move the highlighted option; Home/End jump to the
   * first/last visible option; digit keys `1`-`9` jump directly to that
   * option (only while fewer than 10 are visible). In single-select
   * mode, moving also selects immediately (radio-like); in
   * multi-select mode, moving only highlights - Space/Enter toggles the
   * highlighted option's selection.
   *
   * @param event - The keydown event. Always fires directly on the
   *        group, since it's the only focusable element regardless of
   *        whether a `<search->` is present.
   */
  private handleKeydown(event: KeyboardEvent): void {
    const visibleOptions = this.optionElements.filter((option) => !option.hidden);
    if (visibleOptions.length === 0) return;

    if (event.key === 'Enter' || event.key === ' ') {
      if (this.multiple) {
        event.preventDefault();
        this.toggleSelection(visibleOptions[this.activeIndex].value);
      }
      return;
    }

    const numberIndex = this.numberKeyToIndex(event.key, visibleOptions.length);
    let nextIndex: number;

    if (numberIndex !== null) {
      nextIndex = numberIndex;
    } else {
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          nextIndex = (this.activeIndex + 1) % visibleOptions.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          nextIndex = (this.activeIndex - 1 + visibleOptions.length) % visibleOptions.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = visibleOptions.length - 1;
          break;
        default:
          return;
      }
    }

    event.preventDefault();
    this.setActiveIndex(nextIndex, visibleOptions);

    if (!this.multiple) {
      this.selectOnly(visibleOptions[nextIndex].value);
    }
  }

  /**
   * Maps a pressed digit key (`"1"`-`"9"`) to a zero-based index into
   * the currently *visible* options, mirroring `<button-slider->`'s
   * shortcut. Only enabled while fewer than 10 options are visible.
   *
   * @param key - `event.key` from the keydown event.
   * @param visibleCount - Number of currently visible options.
   * @returns The matching index, or `null`.
   */
  private numberKeyToIndex(key: string, visibleCount: number): number | null {
    if (visibleCount >= 10) return null;
    if (!/^[1-9]$/.test(key)) return null;

    const index = Number(key) - 1;
    return index < visibleCount ? index : null;
  }

  /**
   * Marks exactly one option (by value) as selected, deselecting all
   * others, and fires `change`.
   *
   * @param value - The value to select.
   */
  private selectOnly(value: string): void {
    for (const option of this.optionElements) {
      option.selected = option.value === value;
    }
    this.dispatchChange();
  }

  /**
   * Flips one option's `selected` state without affecting any others,
   * and fires `change`.
   *
   * @param value - The value to toggle.
   */
  private toggleSelection(value: string): void {
    const option = this.optionElements.find((candidate) => candidate.value === value);
    if (!option) return;
    option.selected = !option.selected;
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

  /**
   * Sets which (visible) option is keyboard-highlighted, updating
   * `aria-activedescendant` and each option's `active` state to match.
   *
   * @param index - Index into `visibleOptions` to activate.
   * @param visibleOptions - The currently visible options, pre-filtered
   *        by the caller (avoids recomputing it repeatedly per call).
   */
  private setActiveIndex(index: number, visibleOptions: Option[]): void {
    for (const option of this.optionElements) {
      option.active = false;
    }

    if (visibleOptions.length === 0) {
      this.activeIndex = 0;
      this.removeAttribute('aria-activedescendant');
      return;
    }

    this.activeIndex = Math.min(Math.max(index, 0), visibleOptions.length - 1);
    const active = visibleOptions[this.activeIndex];
    active.active = true;
    this.setAttribute('aria-activedescendant', active.id);
  }

  override render(): TemplateResult {
    return html`<slot @slotchange=${this.handleSlotChange}></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'select-': Select;
  }
}
