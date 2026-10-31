import { Component, Input, inject } from '@angular/core';
import { IonBackButton, IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, logOutOutline, notificationsOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { EstadoService } from '../core/estado.service';
import { AuthService } from '../core/auth.service';
import { UiService } from '../core/ui.service';

/** Cabecera blanca de la app móvil. Con `back` muestra la flecha de volver en vez de cerrar sesión. */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonBackButton],
  template: `
    <ion-header>
      <ion-toolbar>
        @if (back) {
          <ion-buttons slot="start">
            <ion-back-button [defaultHref]="back" text="" icon="chevron-back-outline"></ion-back-button>
          </ion-buttons>
        }
        <ion-title>{{ title }}</ion-title>
        @if (!back) {
          <ion-buttons slot="end">
            <ion-button (click)="avisos()" aria-label="Avisos" class="campana">
              <ion-icon slot="icon-only" name="notifications-outline"></ion-icon>
              @if (noLeidas() > 0) { <span class="globo">{{ noLeidas() > 9 ? '9+' : noLeidas() }}</span> }
            </ion-button>
            <ion-button (click)="salir()" aria-label="Cerrar sesión">
              <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    .campana { position: relative; }
    .globo { position: absolute; top: 4px; right: 2px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 9px;
             background: var(--od-red); color: #fff; font-size: 10.5px; font-weight: 700; display: grid; place-items: center; }
  `],
})
export class AppHeaderComponent {
  @Input() title = 'Omnidock';
  @Input() back = '';

  private auth = inject(AuthService);
  private ui = inject(UiService);
  private router = inject(Router);
  private estado = inject(EstadoService);

  noLeidas = () => this.estado.estado()?.notificacionesNoLeidas ?? 0;

  constructor() { addIcons({ logOutOutline, chevronBackOutline, notificationsOutline }); }

  avisos() { this.router.navigateByUrl('/app/avisos'); }

  async salir() {
    if (await this.ui.confirmar('Cerrar sesión', '¿Quieres salir de OmniDock?', 'Salir')) this.auth.logout();
  }
}
