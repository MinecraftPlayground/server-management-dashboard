import { type TemplateResult, html } from '@lit'
import { customElement, property } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';

import style from './index.css' with {type: 'css'};

/**
 * A single selectable option inside a `<button-slider->`. Purely
 * dumb/presentational - it renders its label and reports selection
 * requests upward; the parent `<button-slider->` owns all selection
 * state, keyboard navigation and the sliding highlight.
 *
 * @element button-slider-option-
 *
 * @slot - The option's label.
 *
 * @fires button-slider-option-:select - Requests that this option become
 *        selected. `event.detail` contains `{ value }`. Bubbles and is
 *        composed so `<button-slider->` can listen for it from outside
 *        this element's shadow root.
 *
 * @example
 * ```html
 * <button-slider- value="dark">
 *   <button-slider-option- value="dark">Dark</button-slider-option->
 *   <button-slider-option- value="light">Light</button-slider-option->
 * </button-slider->
 * ```
 */
@customElement('button-slider-option-')
export class ButtonSliderOption extends CustomElement {
  static override styles = style

  constructor() {
    super();
    this.addEventListener('click', this.#handleClick);
  }

  /**
   * Unique value identifying this option within its parent
   * `<button-slider->`.
   */
  @property({ attribute: 'value' })
  accessor value: string = '';

  /**
   * Whether this option is currently the selected one. Set by the
   * parent `<button-slider->` - not intended to be set directly by
   * consumers.
   */
  @property({ attribute: 'selected', reflect: true, type: Boolean })
  accessor selected: boolean = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'radio');

    // `<button-slider->` needs a stable id to point `aria-activedescendant`
    // at - options are never focused directly themselves, so they don't
    // need a `tabindex` of their own.
    if (!this.id) {
      this.id = `button-slider-option-${crypto.randomUUID()}`;
    }
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (!changed.has('selected')) return;
    this.setAttribute('aria-checked', String(this.selected));
  }

  /** Requests selection of this option. */
  #requestSelect(): void {
    this.dispatchEvent(
      new CustomEvent('button-slider-option-:select', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #handleClick(): void {
    this.#requestSelect();
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'button-slider-option-': ButtonSliderOption;
  }
}
