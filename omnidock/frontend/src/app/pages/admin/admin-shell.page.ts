import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent, IonIcon, IonMenu, IonMenuToggle, IonRouterOutlet, IonSplitPane } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { iniciales } from '../../core/format';
import { ROL } from '../../core/models';
import { UiService } from '../../core/ui.service';

/** Marco del panel web: barra lateral azul marino con la navegación y la cuenta. */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [IonSplitPane, IonMenu, IonContent, IonIcon, IonMenuToggle, IonRouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <ion-split-pane contentId="admin-main" when="lg">
      <ion-menu contentId="admin-main">
        <ion-content>
          <div class="lateral">
            <div class="marca">
              <div><div class="nombre">Omni<span>Dock</span></div><div class="admin">ADMIN</div></div>
              <img src="assets/logo.svg" alt="" width="46" height="46" />
            </div>
            <nav>
              @for (m of items; track m.url) {
                <ion-menu-toggle [autoHide]="false">
                  <a [routerLink]="m.url" routerLinkActive="activo">{{ m.label }}</a>
                </ion-menu-toggle>
              }
            </nav>
            <div class="cuenta">
              <div class="quien">
                <span class="avatar suave">{{ ini() }}</span>
                <div><b>{{ auth.user()?.nombreCompleto }}</b><span>{{ rol() }}</span></div>
              </div>
              <button class="salir" (click)="salir()"><ion-icon name="log-out-outline"></ion-icon> Cerrar sesión</button>
            </div>
          </div>
        </ion-content>
      </ion-menu>
      <ion-router-outlet id="admin-main"></ion-router-outlet>
    </ion-split-pane>
  `,
  styles: [`
    ion-split-pane { --side-width: 250px; --side-max-width: 250px; --border: 0; }
    ion-menu { --background: var(--od-navy); --width: 250px; }
    ion-menu ion-content { --background: var(--od-navy); }
    .lateral { min-height: 100%; display: flex; flex-direction: column; color: #fff; padding: 16px 14px 22px; }
    .marca { display: flex; align-items: center; justify-content: space-between; padding: 6px 2px 0 14px; margin-bottom: 14px; }
    .nombre { font-size: 26px; font-weight: 600; letter-spacing: -.5px; } .nombre span { color: #2f8bff; }
    .admin { font-size: 11.5px; font-weight: 600; letter-spacing: .3px; margin-top: 4px; }
    .marca img { background: #fff; border-radius: 4px; padding: 4px; }
    nav { display: grid; gap: 14px; }
    nav a { display: block; padding: 14px 52px; border-radius: 8px; color: #fff; font-weight: 600; font-size: 15px; text-decoration: none; }
    nav a:hover { background: rgba(255,255,255,.07); }
    nav a.activo { background: var(--od-blue); }
    .cuenta { margin-top: auto; border-top: 1px solid rgba(255,255,255,.14); padding: 20px 8px 0; }
    .quien { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .quien .avatar { width: 40px; height: 40px; font-size: 13px; }
    .quien b { display: block; font-size: 13.5px; } .quien span { font-size: 11.5px; opacity: .75; }
    .salir { background: none; border: 0; color: #ff7b7b; font: inherit; font-size: 13.5px; display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 4px; }
  `],
})
export class AdminShellPage {
  auth = inject(AuthService);
  private ui = inject(UiService);

  items = [
    { label: 'Racks', url: '/admin/racks' },
    { label: 'Tickets', url: '/admin/tickets' },
    { label: 'Usuarios', url: '/admin/usuarios' },
    { label: 'Analítica', url: '/admin/analitica' },
  ];

  constructor() { addIcons({ logOutOutline }); }

  ini() { return iniciales(this.auth.user()?.nombreCompleto); }
  rol() { return ROL[this.auth.user()?.idRol ?? 0] ?? ''; }

  async salir() {
    if (await this.ui.confirmar('Cerrar sesión', '¿Quieres salir de OmniDock?', 'Salir')) this.auth.logout();
  }
}
