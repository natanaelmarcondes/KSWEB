import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { ShellComponent } from './layout/shell/shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DailyCadComponent } from './pages/daily/daily-cad/daily-cad.component';
import { DailyListComponent } from './pages/daily/daily-list/daily-list.component';
import { LoginComponent } from './pages/login/login.component';
import { OrdensServicoCadComponent } from './pages/ordens-servico/ordens-servico-cad/ordens-servico-cad.component';
import { OrdensServicoListComponent } from './pages/ordens-servico/ordens-servico-list/ordens-servico-list.component';
import { SetoresCadComponent } from './pages/setores/setores-cad/setores-cad.component';
import { SetoresListComponent } from './pages/setores/setores-list/setores-list.component';
import { UsuariosListComponent } from './pages/usuarios/usuarios-list/usuarios-list.component';
import { StatusCadComponent } from './pages/status/status-cad/status-cad.component';
import { StatusListComponent } from './pages/status/status-list/status-list.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'usuarios', component: UsuariosListComponent },
      { path: 'setores', component: SetoresListComponent },
      { path: 'setores/novo', component: SetoresCadComponent },
      { path: 'setores/:queueId', component: SetoresCadComponent },
      { path: 'daily', component: DailyListComponent },
      { path: 'daily/:dailyId/registros', component: DailyCadComponent },
      { path: 'daily/:dailyId', component: DailyCadComponent },
      { path: 'ordens-servico', component: OrdensServicoListComponent },
      { path: 'ordens-servico/:codigo', component: OrdensServicoCadComponent },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'status', component: StatusListComponent },
      { path: 'status/novo', component: StatusCadComponent },
      { path: 'status/:statusId', component: StatusCadComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
