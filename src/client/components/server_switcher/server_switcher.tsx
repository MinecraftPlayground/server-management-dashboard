import type { JSXElement } from '@solid-js'

import './index.css'


/**
 * Main component
 */
export function ServerSwitcher() : JSXElement {
  return (
    <div class='server-switcher'>
      <div class='server-switcher-info'>
        <h1 class='server-switcher-info__name'>Server 1</h1>
        <span class='server-switcher-info__address'>localhost:8080</span>
      </div>
      <div class='server-switcher-action'></div>
    </div>
  )
}
