import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonInput, IonSelect, IonSelectOption, IonTitle, IonToolbar, ModalController,
} from '@ionic/angular/standalone';
import { ApiService } from '../../core/api.service';
import { TipoVehiculo } from '../../core/models';
import { UiService } from '../../core/ui.service';

@Component({
  selector: 'app-bahia-form',
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonInput, IonSelect, IonSelectOption],
  template: `
    <ion-header><ion-toolbar>
      <ion-buttons slot="start"><ion-button (click)="cerrar()">Cancelar</ion-button></ion-buttons>
      <ion-title>Nuevo rack</ion-title>
    </ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <div class="campos">
        <ion-input label="Código IoT (el del QR)" labelPlacement="floating" fill="outline" placeholder="RACK-BICI-03" maxlength="50" [(ngModel)]="codigo"></ion-input>
        <ion-input label="Ubicación" labelPlacement="floating" fill="outline" placeholder="Sede Maipu - Acceso Norte" maxlength="100" [(ngModel)]="ubicacion"></ion-input>
        <ion-select label="Tipo de vehículo permitido" labelPlacement="floating" fill="outline" [(ngModel)]="tipo" interface="popover">
          @for (t of tipos(); track t.idTipoVehiculo) { <ion-select-option [value]="t.idTipoVehiculo">{{ t.nombreTipo }}</ion-select-option> }
        </ion-select>
        <ion-input label="Dirección MAC del dispositivo (opcional)" labelPlacement="floating" fill="outline" placeholder="00:1B:44:11:3A:C1" maxlength="20" [(ngModel)]="mac"></ion-input>
        <ion-button expand="block" [disabled]="!codigo.trim() || !ubicacion.trim() || !tipo || guardando()" (click)="guardar()">Crear rack</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`.campos { display: grid; gap: 16px; max-width: 520px; margin: 0 auto; }`],
})
export class BahiaFormComponent implements OnInit {
  private api = inject(ApiService);
  private modal = inject(ModalController);
  private ui = inject(UiService);

  tipos = signal<TipoVehiculo[]>([]);
  codigo = ''; ubicacion = ''; mac = '';
  tipo: number | null = null;
  guardando = signal(false);

  ngOnInit() { this.api.tiposVehiculo().subscribe({ next: (t) => this.tipos.set(t), error: (e) => this.ui.error(e) }); }
  cerrar() { this.modal.dismiss(null, 'cancel'); }

  guardar() {
    if (!this.tipo) return;
    this.guardando.set(true);
    this.api.crearBahia({
      codigoIot: this.codigo.trim(), ubicacion: this.ubicacion.trim(), idTipoPermitido: this.tipo,
      direccionMac: this.mac.trim() || undefined,
    }).subscribe({
      next: () => this.modal.dismiss(true, 'confirm'),
      error: (e) => { this.guardando.set(false); this.ui.error(e, 'No se pudo crear la bahía'); },
    });
  }
}
