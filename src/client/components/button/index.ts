import { type TemplateResult, html } from '@lit'
import { customElement, property } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';
import { type ButtonType, buttonType } from './button_type.ts';
import { type ButtonSize, buttonSize } from './button_size.ts';

import style from './index.css' with {type: 'css'};

/**
 * Keys that activate the button when it has focus, mirroring the
 * behaviour of a native `<button>` element.
 */
const ACTIVATION_KEYS = new Set(['Enter', ' ', 'Spacebar']);

@customElement('button-')
export class Button extends CustomElement {

  constructor() {
    super();
    this.addEventListener('click', this.handleClick);
    this.addEventListener('keydown', this.handleKeydown);
  }

  static override styles = style

  @property({ attribute: 'type', reflect: true })
  accessor buttonType : ButtonType = buttonType.SECONDARY;
  @property({ attribute: 'size', reflect: true })
  accessor buttonSize : ButtonSize = buttonSize.MEDIUM;
  @property({ attribute: 'disabled', reflect: true, type: Boolean})
  accessor disabled : boolean = false;

  override connectedCallback() : void {
    super.connectedCallback();
    this.setAttribute('role', 'button');
    this.syncAccessibilityState();
  }

  protected override updated(changed : Map<PropertyKey, unknown>) : void {
    if (changed.has('disabled')) {
      this.syncAccessibilityState();
    }
  }

  /**
   * Keeps `tabindex`/`aria-disabled` in sync with the `disabled` property,
   * since this element has no native `<button>` to handle that for us.
   */
  private syncAccessibilityState() : void {
    if (this.disabled) {
      this.removeAttribute('tabindex');
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.setAttribute('tabindex', '0');
      this.removeAttribute('aria-disabled');
    }
  }

  /**
   * Re-dispatches the native click as a composed custom event so it can
   * be listened to from outside the shadow root, and blocks the
   * interaction entirely while `disabled` is true.
   *
   * @param event - The native click event from the internal `<button>`.
   */
  private handleClick(event : MouseEvent) : void {
    if (this.disabled) {
      event.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();
    }
  }

  /**
   * Activates the button via keyboard, mirroring native `<button>`
   * behaviour where Enter and Space both trigger a click.
   *
   * @param event - The keydown event from the host element.
   */
  private handleKeydown(event : KeyboardEvent) : void {
    if (this.disabled) return;
    if (!ACTIVATION_KEYS.has(event.key)) return;

    event.preventDefault();
    this.click();
  }

  override render() : TemplateResult {
    return html`
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'button-' : Button;
  }
}
