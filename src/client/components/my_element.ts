import {LitElement, type TemplateResult, html} from '@lit'
import {customElement, property} from '@lit/decorators'

import style from './index.css' with {type: 'css'};


@customElement('element-')
export class MyElement extends LitElement {
  // Styles are applied to the shadow root and scoped to this element
  static override styles = style

  // Creates a reactive property that triggers rendering
  @property()
  accessor mood : string = 'great';

  // Render the component's DOM by returning a Lit template
  override render() : TemplateResult {
    return html`Web Components are <span>${this.mood}</span>! <slot></slot>`;
  }
}
