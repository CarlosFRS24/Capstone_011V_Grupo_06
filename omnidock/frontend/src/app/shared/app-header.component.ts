import { Component, Input, inject } from '@angular/core';
import { IonBackButton, IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, logOutOutline } from 'ionicons/icons';
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
            <ion-button (click)="salir()" aria-label="Cerrar sesión">
              <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>
  `,
})
export class AppHeaderComponent {
  @Input() title = 'Omnidock';
  @Input() back = '';

  private auth = inject(AuthService);
  private ui = inject(UiService);

  constructor() { addIcons({ logOutOutline, chevronBackOutline }); }

  async salir() {
    if (await this.ui.confirmar('Cerrar sesión', '¿Quieres salir de OmniDock?', 'Salir')) this.auth.logout();
  }
}
