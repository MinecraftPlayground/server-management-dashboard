import { LitElement } from '@lit';


/**
 * This class wrapps the default LitElement, and adds a `shadow-root` attribute to every element.
 */
export class CustomLitElement extends LitElement {
  constructor() {
    super();
    this.setAttribute('shadow-root', '');
  }
}
