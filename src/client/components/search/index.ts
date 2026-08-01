import { type TemplateResult, html } from '@lit'
import { customElement, property, query } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';
import { fuzzySearch, type SearchData, type SearchResult } from './fuzzy_search.ts';

import style from './index.css' with {type: 'css'};

/**
 * A reusable search input.
 *
 * On its own, it's a plain text field that fires `input` (on every
 * keystroke) and `change` (on blur/Enter) events carrying the raw query
 * string - usable anywhere a search box is needed.
 *
 * Optionally, set `.data` to a list of searchable entries and this
 * component will *also* run a fuzzy match against them internally on
 * every keystroke, firing a `results` event with the matches. This is a
 * convenience for fully self-contained, standalone use. Components that
 * embed a `<search->` to filter their *own* data (like `<select->`
 * filtering its `<option->` children) should generally leave `.data`
 * unset and instead listen for the plain `input` event, calling the
 * exported `fuzzySearch()` utility themselves - see `fuzzy_search.ts`.
 *
 * @element search-
 *
 * @slot icon - Optional leading icon, e.g. `<icon- slot="icon" src="...">`.
 *
 * @fires input - Fired on every keystroke. `event.detail` is the raw
 *        query string.
 * @fires change - Fired when the query settles (blur or Enter).
 *        `event.detail` is the raw query string.
 * @fires results - Only fired while `.data` is set. `event.detail` is
 *        the `SearchResult[]` from `fuzzySearch(this.data, value)`.
 *
 * @example Standalone, self-contained search
 * ```html
 * <search- .data=${myData} @results=${(e) => console.log(e.detail)}></search->
 * ```
 *
 * @example As a dumb input inside another component, e.g. `<select->`
 * ```html
 * <search- @input=${(e) => filterSomethingWith(e.detail)}></search->
 * ```
 */
@customElement('search-')
export class Search extends CustomElement {
  static override styles = style

  /**
   * Optional searchable data. When set, this component runs
   * `fuzzySearch()` internally on every keystroke and fires `results`.
   * Not reflected as an attribute - set it as a property (`.data=`).
   */
  @property({ attribute: false })
  accessor data: SearchData[] | null = null;

  /** Placeholder text for the input. */
  @property({ attribute: 'placeholder' })
  accessor placeholder: string = 'Suchen...';

  /** The current query text. */
  @property({ attribute: 'value' })
  accessor value: string = '';

  @query('input')
  accessor inputElement!: HTMLInputElement;

  /**
   * Handles every keystroke: updates `value`, re-dispatches as a plain
   * `input` event (stopping the native one first, so it isn't reported
   * twice - see the `button-` component for why this is necessary),
   * and optionally runs `fuzzySearch()` when `.data` is set.
   *
   * @param event - The native input event from the internal `<input>`.
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
   * Re-dispatches the native `change` (fired on blur, or Enter) as a
   * composed event carrying just the query string.
   *
   * @param event - The native change event from the internal `<input>`.
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
