import { type TemplateResult, html } from '@lit'
import { customElement, property } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';

import style from './index.css' with {type: 'css'};

/**
 * A single selectable option inside a `<select->`. Purely dumb - it
 * renders its label, reports selection requests upward, and reflects
 * whatever `selected`/`active` state the parent `<select->` assigns it.
 * The parent owns all actual selection logic, keyboard navigation and
 * search filtering.
 *
 * @element option-
 *
 * @slot - The option's label.
 *
 * @fires option-:toggle - Requests that this option's selection be
 *        toggled (multi-select) or become the sole selection
 *        (single-select) - the parent `<select->` decides which, based
 *        on its own `multiple` state. `event.detail` contains
 *        `{ value }`. Bubbles and is composed.
 *
 * @example
 * ```html
 * <select->
 *   <option- value="option_1">Option 1</option->
 *   <option- value="option_2" selected>Option 2</option->
 * </select->
 * ```
 */
@customElement('option-')
export class Option extends CustomElement {
  static override styles = style

  constructor() {
    super();
    this.addEventListener('click', this.handleClick);
  }

  /** Unique value identifying this option within its parent `<select->`. */
  @property({ attribute: 'value' })
  accessor value: string = '';

  /**
   * Whether this option is currently selected (part of the `<select->`'s
   * value). Set by the parent - not intended to be written to directly,
   * except declaratively in markup for the initial state.
   */
  @property({ attribute: 'selected', reflect: true, type: Boolean })
  accessor selected: boolean = false;

  /**
   * Whether this option is the one currently highlighted by keyboard
   * navigation (i.e. what `aria-activedescendant` points to on the
   * parent). Distinct from `selected` - in multi-select mode `active`
   * moves across options with arrow keys without changing what's
   * actually selected until Space/Enter is pressed. Set by the parent
   * `<select->`.
   */
  @property({ attribute: 'active', reflect: true, type: Boolean })
  accessor active: boolean = false;

  /**
   * Optional tags used by `<select->`'s search filtering, in addition
   * to this option's own text content. Not reflected as an attribute -
   * set it as a property (`.tags=${['fruit', 'healthy']}`).
   */
  @property({ attribute: false })
  accessor tags: string[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'option');

    // `<select->` needs a stable id to point `aria-activedescendant` at.
    if (!this.id) {
      this.id = `option-${crypto.randomUUID()}`;
    }
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('selected')) {
      this.setAttribute('aria-selected', String(this.selected));
    }
  }

  private handleClick(): void {
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('option-:toggle', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'option-': Option;
  }
}
