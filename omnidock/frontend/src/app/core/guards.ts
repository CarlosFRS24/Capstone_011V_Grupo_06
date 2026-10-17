import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Exige sesión iniciada. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLogged() ? true : inject(Router).parseUrl('/login');
};

/** Exige un rol: 'admin' para /admin, 'user' (usuario/colaborador) para /app. Redirige al home que corresponde. */
export const roleGuard = (rol: 'admin' | 'user'): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLogged()) return router.parseUrl('/login');
  return (rol === 'admin') === auth.isAdmin() ? true : router.parseUrl(auth.homeUrl());
};

/** Si ya hay sesión, el login manda al home. */
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLogged() ? inject(Router).parseUrl(auth.homeUrl()) : true;
};
