import { type TemplateResult, html } from '@lit'
import { customElement, property } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';
import { badgeType, type BadgeType } from './badge_type.ts';

import style from './index.css' with {type: 'css'};


@customElement('badge-')
export class Badge extends CustomElement {
  static override styles = style

  @property({ attribute: 'type' })
  accessor badgeType : BadgeType = badgeType.INFO;

  override render() : TemplateResult {
    return html`<slot></slot>`;
  }
}
