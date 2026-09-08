import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'usuarios', loadComponent: () => import('./pages/usuarios/usuarios-list/usuarios-list.component').then(m => m.UsuariosListComponent) },
      { path: 'setores', loadComponent: () => import('./pages/setores/setores-list/setores-list.component').then(m => m.SetoresListComponent) },
      { path: 'setores/novo', loadComponent: () => import('./pages/setores/setores-cad/setores-cad.component').then(m => m.SetoresCadComponent) },
      { path: 'setores/:queueId', loadComponent: () => import('./pages/setores/setores-cad/setores-cad.component').then(m => m.SetoresCadComponent) },
      { path: 'daily', loadComponent: () => import('./pages/daily/daily-list/daily-list.component').then(m => m.DailyListComponent) },
      { path: 'daily/:dailyId/registros', loadComponent: () => import('./pages/daily/daily-cad/daily-cad.component').then(m => m.DailyCadComponent) },
      { path: 'daily/:dailyId', loadComponent: () => import('./pages/daily/daily-cad/daily-cad.component').then(m => m.DailyCadComponent) },
      { path: 'ordens-servico', loadComponent: () => import('./pages/ordens-servico/ordens-servico-list/ordens-servico-list.component').then(m => m.OrdensServicoListComponent) },
      { path: 'ordens-servico/novo', loadComponent: () => import('./pages/ordens-servico/ordens-servico-cad/ordens-servico-cad.component').then(m => m.OrdensServicoCadComponent) },
      { path: 'ordens-servico/:codigo', loadComponent: () => import('./pages/ordens-servico/ordens-servico-cad/ordens-servico-cad.component').then(m => m.OrdensServicoCadComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'status', loadComponent: () => import('./pages/status/status-list/status-list.component').then(m => m.StatusListComponent) },
      { path: 'status/novo', loadComponent: () => import('./pages/status/status-cad/status-cad.component').then(m => m.StatusCadComponent) },
      { path: 'status/:statusId', loadComponent: () => import('./pages/status/status-cad/status-cad.component').then(m => m.StatusCadComponent) },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
