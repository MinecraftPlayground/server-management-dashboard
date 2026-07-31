import { type TemplateResult, html, nothing } from '@lit'
import { customElement, property } from '@lit/decorators'
import { unsafeSVG } from '@lit/directives/unsafe-svg';
import { type StatusRenderer, Task } from '@lit/task';
import { CustomElement } from '../custom_element.ts';

import style from './index.css' with {type: 'css'};
import { loadCachedSvg } from './load_cached_svg.ts';


/**
 * Renders an SVG icon inline by fetching it from `src` and injecting its
 * markup directly into the shadow DOM. Requests are cached and
 * de-duplicated per `src` across all instances, so using the same icon
 * many times only triggers a single fetch. Sizing and colour are
 * controlled via CSS on the host element (`width`, `height`, `color`).
 *
 * Loading is driven by a `Task`, which re-runs whenever `src` changes and
 * automatically discards results from a previous, now-stale `src`.
 *
 * @element icon-
 *
 * @fires icon-:error - Fired when the SVG at `src` fails to load.
 *        `event.detail` contains `{ src, error }`.
 *
 * @example
 * ```html
 * <icon- src="./icons/heart.svg"></icon->
 *
 * <!-- Meaningful (non-decorative) icon -->
 * <icon- src="./icons/heart.svg" label="Favorit"></icon->
 *
 * <!-- Size and colour via CSS -->
 * <icon- src="./icons/heart.svg" style="width: 20px; height: 20px; color: red"></icon->
 * ```
 */
@customElement('icon-')
export class Icon extends CustomElement {
  static override styles = style

  /** Path or URL to the `.svg` file to render. */
  @property({ attribute: 'src', reflect: true })
  accessor src : string = '';

  /**
   * Accessible label for the icon. When set, the icon is exposed to
   * assistive technology as an image with this label. When omitted, the
   * icon is treated as purely decorative (`aria-hidden`).
   */
  @property({ attribute: 'label', reflect: true })
  accessor label : string = '';

  /**
   * Drives loading of the SVG at `src`. Re-runs automatically whenever
   * `src` changes; stale in-flight runs are discarded by `Task` itself.
   */
  private svgTask = new Task(this, {
    task: ([src]) => loadCachedSvg(src),
    args: () => [this.src] as const,
    onError: (error) => {
      this.dispatchEvent(
        new CustomEvent('icon-:error', {
          detail: { src: this.src, error },
          bubbles: true,
          composed: true,
        }),
      );
    },
  });

  protected override updated(changed : Map<PropertyKey, unknown>) : void {
    if (!changed.has('label')) return;

    if (this.label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.label);
    } else {
      this.setAttribute('aria-hidden', 'true');
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
    }
  }

  override render() : TemplateResult | unknown {
    return this.svgTask.render<StatusRenderer<string | null>>({
      initial: () => nothing,
      pending: () => nothing,
      complete: (svg) => (svg ? html`${unsafeSVG(svg)}` : nothing),
      error: () => nothing,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'icon-' : Icon;
  }
}
