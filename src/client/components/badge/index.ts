import { type TemplateResult, html } from '@lit'
import { customElement, property } from '@lit/decorators'
import { CustomLitElement } from '$/components/custom_lit_element.ts';
import { badgeType, type BadgeType } from './types.ts';

import style from './index.css' with {type: 'css'};


@customElement('badge-')
export class Badge extends CustomLitElement {
  static override styles = style

  @property({ attribute: 'type' })
  accessor badgeType : BadgeType = badgeType.INFO;

  override render() : TemplateResult {
    return html`<slot></slot>`;
  }
}
