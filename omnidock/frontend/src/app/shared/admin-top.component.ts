import { Component, Input, inject } from '@angular/core';
import { IonMenuButton } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth.service';
import { iniciales } from '../core/format';

/** Encabezado de cada pantalla del panel web: título, bajada y la cuenta. En pantallas angostas muestra el botón del menú. */
@Component({
  selector: 'app-admin-top',
  standalone: true,
  imports: [IonMenuButton],
  template: `
    <div class="adm-top">
      <ion-menu-button color="dark"></ion-menu-button>
      <div class="crece">
        <h1>{{ titulo }}</h1>
        <p>{{ bajada }}</p>
      </div>
      <span class="avatar" [attr.title]="auth.user()?.nombreCompleto">{{ ini() }}</span>
    </div>
  `,
  styles: [`ion-menu-button { margin: -6px 0 0 -8px; }`],
})
export class AdminTopComponent {
  @Input() titulo = '';
  @Input() bajada = '';
  auth = inject(AuthService);
  ini() { return iniciales(this.auth.user()?.nombreCompleto); }
}
