import { type TemplateResult, html } from '@lit'
import { customElement } from '@lit/decorators'
import { CustomElement } from '../../components/custom_element.ts';

import style from './index.css' with {type: 'css'};


@customElement('sidebar-')
export class Button extends CustomElement {

  static override styles = style

  private handleClick(event : MouseEvent) : void {
    console.dir(event.currentTarget);
  }

  override render() : TemplateResult {
    return html`
      <div>
        <badge- type="debug">Debug</badge->
        <badge- type="info">Info</badge->
        <badge- type="success">Success</badge->
        <badge- type="warning">Warning</badge->
        <badge- type="error">Error</badge->
        
        <button- @click=${this.handleClick} type="secondary" size="small"><icon- src="./icons/alert_24.svg"></icon->Small</button->
        <button- @click=${this.handleClick} type="secondary" size="medium"><icon- src="./icons/alert_24.svg"></icon->Medium</button->
        <button- @click=${this.handleClick} type="secondary" size="large"><icon- src="./icons/alert_24.svg"></icon->Large</button->
        
        <button- @click=${this.handleClick} type="secondary" disabled size="small"><icon- src="./icons/alert_24.svg"></icon->Small</button->
        <button- @click=${this.handleClick} type="secondary" disabled size="medium"><icon- src="./icons/alert_24.svg"></icon->Medium</button->
        <button- @click=${this.handleClick} type="secondary" disabled size="large"><icon- src="./icons/alert_24.svg"></icon->Large</button->
        
        <button- @click=${this.handleClick} type="primary" size="small"><icon- src="./icons/alert_24.svg"></icon->Small</button->
        <button- @click=${this.handleClick} type="primary" size="medium"><icon- src="./icons/alert_24.svg"></icon->Medium</button->
        <button- @click=${this.handleClick} type="primary" size="large"><icon- src="./icons/alert_24.svg"></icon->Large</button->
        
        <button- @click=${this.handleClick} type="primary" disabled size="small"><icon- src="./icons/alert_24.svg"></icon->Small</button->
        <button- @click=${this.handleClick} type="primary" disabled size="medium"><icon- src="./icons/alert_24.svg"></icon->Medium</button->
        <button- @click=${this.handleClick} type="primary" disabled size="large"><icon- src="./icons/alert_24.svg"></icon->Large</button->
        
        <button- @click=${this.handleClick} type="danger" size="small"><icon- src="./icons/alert_24.svg"></icon->Small</button->
        <button- @click=${this.handleClick} type="danger" size="medium"><icon- src="./icons/alert_24.svg"></icon->Medium</button->
        <button- @click=${this.handleClick} type="danger" size="large"><icon- src="./icons/alert_24.svg"></icon->Large</button->

        <button- @click=${this.handleClick} type="danger" disabled size="small"><icon- src="./icons/alert_24.svg"></icon->Small</button->
        <button- @click=${this.handleClick} type="danger" disabled size="medium"><icon- src="./icons/alert_24.svg"></icon->Medium</button->
        <button- @click=${this.handleClick} type="danger" disabled size="large"><icon- src="./icons/alert_24.svg"></icon->Large</button->

        <button-slider- @change=${(newValue) => console.log(newValue)}>
          <button-slider-option- value="option_1">Option 1</button-slider-option->
          <button-slider-option- value="option_2">Option 2</button-slider-option->
          <button-slider-option- value="option_3">Option 3</button-slider-option->
          <button-slider-option- value="option_4">Option 4</button-slider-option->
          <button-slider-option- value="option_5">Option 5</button-slider-option->
          <button-slider-option- value="option_6">Option 6</button-slider-option->
          <button-slider-option- value="option_7">Option 7</button-slider-option->
          <button-slider-option- value="option_8">Option 8</button-slider-option->
          <button-slider-option- value="option_9">Option 9</button-slider-option->
        </button-slider->
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sidebar-': Button;
  }
}
