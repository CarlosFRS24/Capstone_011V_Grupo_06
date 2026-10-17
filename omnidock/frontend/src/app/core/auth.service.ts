import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, ROL_ADMIN, Usuario } from './models';

const TOKEN_KEY = 'omnidock.token';
const USER_KEY = 'omnidock.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly user = signal<Usuario | null>(this.leerUsuario());
  readonly isLogged = computed(() => !!this.token() && !!this.user());
  readonly isAdmin = computed(() => this.user()?.idRol === ROL_ADMIN);

  login(emailInstitucional: string, passwordPrototipo: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { emailInstitucional, passwordPrototipo })
      .pipe(tap((r) => {
        localStorage.setItem(TOKEN_KEY, r.token);
        localStorage.setItem(USER_KEY, JSON.stringify(r.usuario));
        this.token.set(r.token);
        this.user.set(r.usuario);
      }));
  }

  logout(navegar = true) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
    if (navegar) this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  homeUrl(): string {
    return this.isAdmin() ? '/admin' : '/app';
  }

  private leerUsuario(): Usuario | null {
    try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'); } catch { return null; }
  }
}
