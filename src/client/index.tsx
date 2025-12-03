import { render } from '@solid-js/web';
import { HashRouter, Route } from '@solid-js/router'
import { Header } from './components/header/header.tsx';
import { Status } from './components/status/status.tsx';
import { Sidebar } from './components/sidebar/sidebar.tsx';
import { Main } from './components/main/main.tsx';
import { QuickAccess } from './components/quick_access/quick_access.tsx';

import './index.css'


render(
  () => <HashRouter>
    <Route path='/' component={() => <>
      <Header></Header>
      <Status></Status>
      <Sidebar></Sidebar>
      <Main></Main>
      <QuickAccess></QuickAccess>
    </>}/>
  </HashRouter>,
  globalThis.document.body
);
