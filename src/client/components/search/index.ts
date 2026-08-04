import { type TemplateResult, html } from '@lit'
import { customElement, property, query } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';
import { fuzzySearch, type SearchData, type SearchResult } from './fuzzy_search.ts';

import style from './index.css' with {type: 'css'};

/**
 * A reusable search input. Always fires `input`/`change` with the raw
 * query string. Optionally set `.data` to also run a fuzzy match
 * internally and fire `results` - for fully standalone use. Components
 * that filter their *own* data (like `<select->`) should leave `.data`
 * unset and call `fuzzySearch()` themselves on the `input` event.
 *
 * @element search-
 *
 * @slot icon - Optional leading icon, e.g. `<icon- slot="icon" src="...">`.
 *
 * @fires input - Every keystroke. `event.detail` is the raw query string.
 * @fires change - On blur/Enter. `event.detail` is the raw query string.
 * @fires results - Only while `.data` is set. `event.detail` is the
 *        `SearchResult[]` from `fuzzySearch(this.data, value)`.
 *
 * @example Standalone, self-contained search
 * ```html
 * <search- .data=${myData} @results=${(e) => console.log(e.detail)}></search->
 * ```
 *
 * @example As a dumb input, filtering handled elsewhere
 * ```html
 * <search- @input=${(e) => filterSomethingWith(e.detail)}></search->
 * ```
 */
@customElement('search-')
export class Search extends CustomElement {
  static override styles = style

  /** Optional searchable data - if set, runs `fuzzySearch()` internally and fires `results`. Set as a property (`.data=`), not an attribute. */
  @property({ attribute: false })
  accessor data: SearchData[] | null = null;

  /** Placeholder text for the input. */
  @property({ attribute: 'placeholder' })
  accessor placeholder: string = 'Search...';

  /** The current query text. */
  @property({ attribute: 'value' })
  accessor value: string = '';

  @query('input')
  accessor inputElement!: HTMLInputElement;

  /**
   * Updates `value`, re-dispatches as a plain `input` event (stopping
   * the native one first - see `button-` for why), and runs
   * `fuzzySearch()` if `.data` is set.
   *
   * @param event - The native input event.
   */
  private handleInput(event: InputEvent): void {
    event.stopPropagation();
    this.value = (event.target as HTMLInputElement).value;

    this.dispatchEvent(
      new CustomEvent<string>('input', {
        detail: this.value,
        bubbles: true,
        composed: true,
      }),
    );

    if (this.data) {
      const results: SearchResult[] = fuzzySearch(this.data, this.value);
      this.dispatchEvent(
        new CustomEvent<SearchResult[]>('results', {
          detail: results,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  /**
   * Re-dispatches the native `change` (blur/Enter) with just the query string.
   *
   * @param event - The native change event.
   */
  private handleChange(event: Event): void {
    event.stopPropagation();
    this.dispatchEvent(
      new CustomEvent<string>('change', {
        detail: this.value,
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render(): TemplateResult {
    return html`
      <slot name="icon"></slot>
      <input
        type="text"
        .value=${this.value}
        placeholder=${this.placeholder}
        @input=${this.handleInput}
        @change=${this.handleChange}
      >
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'search-': Search;
  }
}
