import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { ApiService } from '../../core/api.service';
import { TipoVehiculo } from '../../core/models';
import { UiService } from '../../core/ui.service';

/** Formulario para registrar un vehículo, dentro de la pantalla Mis vehículos. */
@Component({
  selector: 'app-vehiculo-form',
  standalone: true,
  imports: [FormsModule, IonButton, IonSpinner],
  template: `
    <div class="od-card">
      <b class="titulo">Nuevo vehículo</b>
      <p class="rotulo">Tipo de vehículo</p>
      <label class="campo">
        <select aria-label="Tipo de vehículo" [(ngModel)]="tipo">
          @for (t of tipos(); track t.idTipoVehiculo) { <option [ngValue]="t.idTipoVehiculo">{{ nombre(t.nombreTipo) }}</option> }
        </select>
      </label>
      <p class="rotulo">Nombre del vehículo</p>
      <label class="campo">
        <input type="text" maxlength="50" placeholder="Ej.: Falcon Azul" aria-label="Nombre del vehículo" [(ngModel)]="identificador" />
      </label>
      <p class="ayuda">Podrás cambiar el vehículo seleccionado cuando quieras.</p>
      <ion-button expand="block" [disabled]="!tipo || !identificador.trim() || guardando()" (click)="guardar()">
        @if (guardando()) { <ion-spinner name="dots"></ion-spinner> } @else { Guardar vehículo }
      </ion-button>
      <ion-button expand="block" fill="clear" color="medium" (click)="cancelado.emit()">Cancelar</ion-button>
    </div>
  `,
  styles: [`
    .titulo { display: block; font-size: 15px; margin-bottom: 4px; }
    .rotulo { margin: 12px 0 6px; font-size: 12px; }
    .ayuda { font-size: 11px; color: var(--od-muted); margin: 12px 0; }
  `],
})
export class VehiculoFormComponent implements OnInit {
  private api = inject(ApiService);
  private ui = inject(UiService);

  @Output() guardado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  tipos = signal<TipoVehiculo[]>([]);
  tipo: number | null = null;
  identificador = '';
  guardando = signal(false);

  ngOnInit() {
    this.api.tiposVehiculo().subscribe({
      next: (t) => { this.tipos.set(t); this.tipo = t[0]?.idTipoVehiculo ?? null; },
      error: (e) => this.ui.error(e),
    });
  }

  nombre(n: string) { return n.charAt(0) + n.slice(1).toLowerCase(); }

  guardar() {
    if (!this.tipo) return;
    this.guardando.set(true);
    this.api.crearVehiculo({ idTipoVehiculo: this.tipo, identificador: this.identificador.trim() }).subscribe({
      next: () => this.guardado.emit(),
      error: (e) => { this.guardando.set(false); this.ui.error(e, 'No se pudo registrar el vehículo'); },
    });
  }
}
