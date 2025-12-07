import { render } from '@solid-js/web';
import { HashRouter, Route } from '@solid-js/router'
import { Header } from './sections/header/header.tsx';
import { Status } from './sections/status/status.tsx';
import { Sidebar } from './sections/sidebar/sidebar.tsx';
import { Main } from './sections/main/main.tsx';
import { QuickAccess } from './sections/quick_access/quick_access.tsx';

import './index.css'


render(
  () => <HashRouter>
    <Route path='/' component={() => <>
      <Header></Header>
      <Status></Status>
      <Sidebar></Sidebar>
      <Main></Main>
      {/* <QuickAccess></QuickAccess> */}
    </>}/>
  </HashRouter>,
  globalThis.document.body
);
