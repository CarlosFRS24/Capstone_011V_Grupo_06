import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bicycleOutline, homeOutline, scanOutline, timeOutline } from 'ionicons/icons';

/** Navegación inferior del diseño. La pestaña Perfil del mockup se reemplaza por Vehículos. */
@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="bahias"><ion-icon name="home-outline"></ion-icon><ion-label>Inicio</ion-label></ion-tab-button>
        <ion-tab-button tab="sesion"><ion-icon name="scan-outline"></ion-icon><ion-label>Escanear</ion-label></ion-tab-button>
        <ion-tab-button tab="historial"><ion-icon name="time-outline"></ion-icon><ion-label>Historial</ion-label></ion-tab-button>
        <ion-tab-button tab="vehiculos"><ion-icon name="bicycle-outline"></ion-icon><ion-label>Vehículos</ion-label></ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  constructor() { addIcons({ homeOutline, scanOutline, timeOutline, bicycleOutline }); }
}
