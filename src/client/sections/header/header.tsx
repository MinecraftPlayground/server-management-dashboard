import type { JSXElement } from '@solid-js'

import './index.css'
import { ServerSwitcher } from '../../components/server_switcher/server_switcher.tsx';


/**
 * Header component
 */
export function Header() : JSXElement {
  return (
    <div class='container-header'>
      <div class='logo-wrapper'>
        <img class='logo' src="/static/logo.svg" alt="Logo" />
        <ServerSwitcher/>
      </div>
    </div>
  )
}
