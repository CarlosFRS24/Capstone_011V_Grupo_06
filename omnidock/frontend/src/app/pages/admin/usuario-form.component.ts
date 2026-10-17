import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonInput, IonSelect, IonSelectOption, IonTitle, IonToolbar, ModalController,
} from '@ionic/angular/standalone';
import { ApiService } from '../../core/api.service';
import { ROL } from '../../core/models';
import { UiService } from '../../core/ui.service';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonInput, IonSelect, IonSelectOption],
  template: `
    <ion-header><ion-toolbar>
      <ion-buttons slot="start"><ion-button (click)="cerrar()">Cancelar</ion-button></ion-buttons>
      <ion-title>Nuevo usuario</ion-title>
    </ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <div class="campos">
        <ion-input label="RUT" labelPlacement="floating" fill="outline" placeholder="12345678-9" maxlength="12" [(ngModel)]="rut"></ion-input>
        <ion-input label="Nombre completo" labelPlacement="floating" fill="outline" maxlength="100" [(ngModel)]="nombre"></ion-input>
        <ion-input label="Correo institucional" labelPlacement="floating" fill="outline" type="email" maxlength="100" [(ngModel)]="email"></ion-input>
        <ion-input label="Contraseña temporal" labelPlacement="floating" fill="outline" type="password" [(ngModel)]="password"></ion-input>
        <ion-select label="Rol" labelPlacement="floating" fill="outline" [(ngModel)]="rol" interface="popover">
          @for (r of roles; track r.id) { <ion-select-option [value]="r.id">{{ r.nombre }}</ion-select-option> }
        </ion-select>
        <ion-button expand="block" [disabled]="!valido() || guardando()" (click)="guardar()">Crear usuario</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`.campos { display: grid; gap: 16px; max-width: 520px; margin: 0 auto; }`],
})
export class UsuarioFormComponent {
  private api = inject(ApiService);
  private modal = inject(ModalController);
  private ui = inject(UiService);

  roles = Object.entries(ROL).map(([id, nombre]) => ({ id: +id, nombre }));
  rut = ''; nombre = ''; email = ''; password = '';
  rol = 2;
  guardando = signal(false);

  valido() { return !!(this.rut.trim() && this.nombre.trim() && this.email.includes('@') && this.password); }
  cerrar() { this.modal.dismiss(null, 'cancel'); }

  guardar() {
    this.guardando.set(true);
    this.api.crearUsuario({
      rut: this.rut.trim(), nombreCompleto: this.nombre.trim(), emailInstitucional: this.email.trim(),
      passwordPrototipo: this.password, idRol: this.rol,
    }).subscribe({
      next: () => this.modal.dismiss(true, 'confirm'),
      error: (e) => { this.guardando.set(false); this.ui.error(e, 'No se pudo crear el usuario'); },
    });
  }
}
