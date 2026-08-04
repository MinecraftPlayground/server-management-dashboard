import { type TemplateResult, html } from '@lit'
import { customElement, property } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';

import style from './index.css' with {type: 'css'};

/**
 * A single selectable option inside a `<select->`. Purely dumb - it
 * renders its label, reports clicks upward, and reflects whatever
 * `selected`/`active` state the parent `<select->` assigns it. The
 * parent owns all selection logic and keyboard navigation.
 *
 * @element option-
 *
 * @slot - The option's label.
 *
 * @fires option-:toggle - Requests that this option become selected.
 *        `event.detail` contains `{ value }`. Bubbles and is composed.
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

  /** Whether this option is selected. Set by the parent - not intended to be written to directly. */
  @property({ attribute: 'selected', reflect: true, type: Boolean })
  accessor selected: boolean = false;

  /**
   * Whether this is the keyboard-highlighted option (what
   * `aria-activedescendant` on the parent points to). Distinct from
   * `selected` - arrow keys move `active` without committing a
   * selection until Enter/Space is pressed. Set by the parent.
   */
  @property({ attribute: 'active', reflect: true, type: Boolean })
  accessor active: boolean = false;

  /** Whether this option can be selected. Disabled options ignore clicks. */
  @property({ attribute: 'disabled', reflect: true, type: Boolean })
  accessor disabled: boolean = false;

  /**
   * Optional tags for `<select->`'s search filtering, in addition to
   * this option's text. Not an attribute - set as a property
   * (`.tags=${['fruit', 'healthy']}`).
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
    if (changed.has('disabled')) {
      this.setAttribute('aria-disabled', String(this.disabled));
    }
  }

  private handleClick(): void {
    if (this.disabled) return;

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
