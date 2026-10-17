import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, ModalController } from '@ionic/angular/standalone';
import { ApiService } from '../../core/api.service';
import { Bahia } from '../../core/models';
import { UiService } from '../../core/ui.service';

/** Alta de un ticket de mantenimiento desde el panel web. */
@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent],
  template: `
    <ion-header><ion-toolbar>
      <ion-title>Nuevo ticket</ion-title>
      <ion-buttons slot="end"><ion-button (click)="cerrar()">Cancelar</ion-button></ion-buttons>
    </ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <div class="campos">
        <div>
          <p class="rotulo">Rack</p>
          <label class="campo">
            <select aria-label="Rack" [(ngModel)]="idBahia">
              <option [ngValue]="null" disabled>Selecciona un rack</option>
              @for (b of bahias; track b.idBahia) { <option [ngValue]="b.idBahia">{{ b.codigoIot }} · {{ b.ubicacion }}</option> }
            </select>
          </label>
        </div>
        <div>
          <p class="rotulo">Descripción de la falla</p>
          <textarea class="area" rows="4" maxlength="255" placeholder="Ej.: candado no responde" aria-label="Descripción de la falla" [(ngModel)]="descripcion"></textarea>
        </div>
        <p class="muted">Al crear el ticket, la bahía queda fuera de servicio.</p>
        <ion-button expand="block" [disabled]="!idBahia || !descripcion.trim() || guardando()" (click)="guardar()">Crear ticket</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .campos { display: grid; gap: 14px; max-width: 520px; margin: 0 auto; }
    .area { width: 100%; border: 1px solid var(--od-line); border-radius: 10px; padding: 12px 14px; font: inherit; font-size: 14px; color: var(--od-ink); background: #fff; resize: vertical; outline: 0; }
    .area:focus { border-color: var(--od-blue); }
  `],
})
export class TicketFormComponent {
  private api = inject(ApiService);
  private modal = inject(ModalController);
  private ui = inject(UiService);

  @Input() bahias: Bahia[] = [];
  idBahia: number | null = null;
  descripcion = '';
  guardando = signal(false);

  cerrar() { this.modal.dismiss(null, 'cancel'); }

  guardar() {
    if (!this.idBahia) return;
    this.guardando.set(true);
    this.api.crearTicket(this.idBahia, this.descripcion.trim()).subscribe({
      next: () => this.modal.dismiss(true, 'confirm'),
      error: (e) => { this.guardando.set(false); this.ui.error(e, 'No se pudo crear el ticket'); },
    });
  }
}
