import { type TemplateResult, html } from '@lit'
import { customElement, property } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';

import style from './index.css' with {type: 'css'};

/**
 * Groups `<option->` children under a label inside a `<select->`.
 * Purely visual - `<select->` finds `<option->` descendants via a
 * plain light-DOM query, so nesting depth doesn't matter.
 *
 * @element option-group-
 *
 * @slot - `<option->` children belonging to this group.
 *
 * @example
 * ```html
 * <select->
 *   <option-group- label="First Group">
 *     <option- value="option_1">Option 1</option->
 *     <option- value="option_2">Option 2</option->
 *   </option-group->
 * </select->
 * ```
 */
@customElement('option-group-')
export class OptionGroup extends CustomElement {
  static override styles = style

  /** Heading text shown above this group's options. */
  @property({ attribute: 'label' })
  accessor label: string = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'group');
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('label')) {
      this.setAttribute('aria-label', this.label);
    }
  }

  override render(): TemplateResult {
    return html`
      <div class="group-label">${this.label}</div>
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'option-group-': OptionGroup;
  }
}
