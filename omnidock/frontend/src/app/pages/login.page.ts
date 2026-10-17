import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, lockClosedOutline, mailOutline } from 'ionicons/icons';
import { AuthService } from '../core/auth.service';
import { UiService } from '../core/ui.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IonContent, IonButton, IonIcon, IonSpinner],
  template: `
    <ion-content [fullscreen]="true">
      <div class="wrap">
        <div class="marca">
          <img src="assets/logo.svg" alt="" width="104" height="104" />
          <div class="nombre">Omni<span>Dock</span></div>
          <div class="lema">SMART PARKING. CONNECTED DATA.</div>
        </div>

        <h1 class="titulo">Estaciona con confianza</h1>
        <p class="bajada">Tu bicicleta, conectada a tu sede.</p>

        @if (!conFormulario()) {
          <ion-button expand="block" class="entrar" (click)="conFormulario.set(true)">Ingresar mi cuenta institucional</ion-button>
        } @else {
          <form class="form" (ngSubmit)="entrar()">
            <label class="campo">
              <ion-icon name="mail-outline" aria-hidden="true"></ion-icon>
              <input type="email" name="email" placeholder="Correo institucional" autocomplete="username" aria-label="Correo institucional" [(ngModel)]="email" required />
            </label>
            <label class="campo">
              <ion-icon name="lock-closed-outline" aria-hidden="true"></ion-icon>
              <input [type]="ver() ? 'text' : 'password'" name="password" placeholder="Contraseña" autocomplete="current-password" aria-label="Contraseña" [(ngModel)]="password" required />
              <button type="button" class="ojo" (click)="ver.set(!ver())" [attr.aria-label]="ver() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                <ion-icon [name]="ver() ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
              </button>
            </label>
            <ion-button expand="block" type="submit" [disabled]="cargando() || !email || !password">
              @if (cargando()) { <ion-spinner name="dots"></ion-spinner> } @else { Ingresar }
            </ion-button>
          </form>
        }

        <div class="como">
          <b>¿Cómo funciona?</b>
          <p>Consulta espacios, escanea y asegura<br />tu bicicleta desde una sola app.</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-content { --background: var(--od-bg); }
    .wrap { min-height: 100%; display: flex; flex-direction: column; padding: 56px 24px 28px; max-width: 440px; margin: 0 auto; text-align: center; }
    .marca img { display: block; margin: 0 auto 6px; }
    .nombre { font-size: 44px; font-weight: 600; letter-spacing: -1px; color: #2a3b57; line-height: 1; }
    .nombre span { color: var(--od-blue); }
    .lema { font-size: 8.5px; letter-spacing: 2.6px; color: #2a3b57; margin-top: 6px; font-weight: 600; }
    .titulo { font-size: 25px; font-weight: 700; margin: 34px 0 0; color: var(--od-ink); letter-spacing: -.3px; }
    .bajada { font-size: 14px; color: var(--od-muted); margin: 10px 0 0; }
    .entrar { margin-top: 64px; }
    .entrar, .form ion-button { min-height: 52px; font-size: 16px; }
    .form { margin-top: 36px; display: grid; gap: 12px; text-align: left; }
    .form .campo { height: 50px; }
    .ojo { background: none; border: 0; padding: 4px; line-height: 0; cursor: pointer; }
    .como { margin-top: auto; background: var(--od-blue-soft); border-radius: 14px; padding: 22px 18px; }
    .como b { font-size: 19px; color: var(--od-ink); }
    .como p { margin: 10px 0 0; font-size: 14px; line-height: 1.7; color: var(--od-muted); }
    .wrap > .como { margin-top: 48px; }
    @media (min-height: 760px) { .wrap > .como { margin-top: auto; } }
  `],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private ui = inject(UiService);

  email = '';
  password = '';
  cargando = signal(false);
  conFormulario = signal(false);
  ver = signal(false);

  constructor() { addIcons({ mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline }); }

  entrar() {
    if (!this.email || !this.password || this.cargando()) return;
    this.cargando.set(true);
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => this.router.navigateByUrl(this.auth.homeUrl(), { replaceUrl: true }),
      error: (e) => { this.cargando.set(false); this.ui.error(e, 'No se pudo iniciar sesión'); },
      complete: () => this.cargando.set(false),
    });
  }
}
