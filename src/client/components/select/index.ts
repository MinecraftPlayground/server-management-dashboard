import { type PropertyValues, type TemplateResult, html, nothing } from '@lit'
import { customElement, property, query, queryAssignedElements, state, } from '@lit/decorators'
import { CustomElement } from '../custom_element.ts';
import type { Option } from '../option/index.ts';
import { queryAssignedElementsDeep } from '../query_assigned_elements_deep.ts';

import style from './index.css' with {type: 'css'};


@customElement('select-')
export class Select extends CustomElement {
  static override styles = [super.styles, style]
  private menuLink : string;

  constructor() {
    super()

    this.menuLink = crypto.randomUUID()
  }

  /** Text shown in the closed trigger when nothing is selected. */
  @property({ attribute : 'placeholder' })
  accessor placeholder : string = 'Select...';

  /** Message shown inside the popup when there are no `<option->` descendants. */
  @property({ attribute: 'empty-message' })
  accessor emptyMessage : string = 'No options available';

  /** Word used in the closed trigger's "First +N ..." label when `multiple` is set. */
  @property({ attribute: 'more-label' })
  accessor moreLabel : string = 'more';

  /** Allows selecting more than one option. Closed trigger then shows "First +N more". */
  @property({ attribute: 'multiple', reflect: true, type: Boolean })
  accessor multiple : boolean = false;

  /** Disables the whole control - not focusable, doesn't open, ignores clicks. */
  @property({ attribute: 'disabled', reflect: true, type: Boolean })
  accessor disabled : boolean = false;

  /** Whether the popup is open. Reflected, so it can be set declaratively (`<select- open>`). */
  @property({ attribute: 'open', reflect: true, type: Boolean })
  accessor open : boolean = false;

  @property({ attribute: 'value', reflect: true})
  accessor value : string = ''

  /** Label text shown in the closed trigger - the selection, or "First +N more" while `multiple`. */
  @state()
  accessor selectedLabel : string = '';

  /** Whether there is at least one `<option->` descendant right now. */
  @state()
  accessor hasOptions : boolean = false;

  @query('.select-button')
  accessor selectButtonElement! : HTMLButtonElement;

  @query('.select-menu')
  accessor selectMenuElement! : HTMLDivElement;

  @queryAssignedElementsDeep({selector: 'option-:not([disabled])'})
  accessor optionElementsEnabled! : Array<Option>;

  override firstUpdated() : void {
    this.selectMenuElement.addEventListener('toggle', ({newState}) => {
      this.open = newState === 'open'
    })

    this.optionElementsEnabled.forEach((element) => {
      element.addEventListener('click', ({target}) => {
        const option = target as Option;
        
        this.selectedLabel = option.innerText;
        this.value = option.value
        option.selected = !option.selected

        if (!this.multiple) {
          this.selectMenuElement.hidePopover();
        }
      })
    })
  
  }

  override render() : TemplateResult {
    return html`
      <button class="select-button" popovertarget="${this.menuLink}">
        <span class="label">
          ${this.selectedLabel || this.placeholder}
        </span>
        <svg class="chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div class="select-menu" id="${this.menuLink}" popover>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'select-': Select;
  }
}
