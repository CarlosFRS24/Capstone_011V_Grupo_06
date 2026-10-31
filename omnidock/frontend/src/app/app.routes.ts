import { Routes } from '@angular/router';
import { authGuard, loginGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  {
    // App móvil (usuario / colaborador)
    path: 'app',
    canActivate: [authGuard, roleGuard('user')],
    loadComponent: () => import('./pages/app/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'bahias' },
      { path: 'bahias', loadComponent: () => import('./pages/app/bahias.page').then((m) => m.BahiasPage) },
      { path: 'sesion', loadComponent: () => import('./pages/app/sesion.page').then((m) => m.SesionPage) },
      { path: 'vehiculos', loadComponent: () => import('./pages/app/vehiculos.page').then((m) => m.VehiculosPage) },
      { path: 'historial', loadComponent: () => import('./pages/app/historial.page').then((m) => m.HistorialPage) },
      { path: 'avisos', loadComponent: () => import('./pages/app/avisos.page').then((m) => m.AvisosPage) },
    ],
  },
  {
    // Detalle de reserva: pantalla completa, sin la barra de pestañas
    path: 'reservar/:idBahia',
    canActivate: [authGuard, roleGuard('user')],
    loadComponent: () => import('./pages/app/reservar.page').then((m) => m.ReservarPage),
  },
  {
    // Panel web administrativo
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/admin/admin-shell.page').then((m) => m.AdminShellPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'racks' },
      { path: 'racks', loadComponent: () => import('./pages/admin/racks.page').then((m) => m.RacksPage) },
      { path: 'tickets', loadComponent: () => import('./pages/admin/tickets.page').then((m) => m.TicketsPage) },
      { path: 'usuarios', loadComponent: () => import('./pages/admin/usuarios.page').then((m) => m.UsuariosPage) },
      { path: 'analitica', loadComponent: () => import('./pages/admin/analitica.page').then((m) => m.AnaliticaPage) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
