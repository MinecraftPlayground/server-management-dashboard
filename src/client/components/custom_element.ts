import { type CSSResultGroup, LitElement } from '@lit';

import style from '../styles/default.css' with {type: 'css'};


/**
 * This class wrapps the default LitElement, and adds a `shadow-root` attribute to every element.
 */
export class CustomElement extends LitElement {
  constructor() {
    super();
    this.setAttribute('shadow-root', '');
  }

  static override styles : CSSResultGroup = [style];
}
