import { Component, computed, inject, signal } from '@angular/core';
import { IonButton, IonContent, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Vehiculo } from '../../core/models';
import { PreferenciasService } from '../../core/preferencias.service';
import { UiService } from '../../core/ui.service';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { VehIconComponent } from '../../shared/veh-icon.component';
import { VehiculoFormComponent } from './vehiculo-form.component';

/** Mis vehículos (HU-02): elegir el que se usa al reservar, registrar y desactivar. */
@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [AppHeaderComponent, VehIconComponent, VehiculoFormComponent, IonContent, IonButton, IonIcon, IonRefresher, IonRefresherContent],
  template: `
    <app-header title="Mis vehículos"></app-header>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>
      <div class="app-wrap">
        <h2 class="h2">Tus vehículos registrados</h2>
        <p class="sub">Selecciona cuál usarás en tus próximas reservas.</p>

        <div class="lista">
          @for (v of lista(); track v.idVehiculo) {
            <div class="od-card">
              <div class="fila">
                <span class="tile"><app-veh-icon [tipo]="v.idTipoVehiculo"></app-veh-icon></span>
                <div class="crece col">
                  <b>{{ v.identificador }}</b>
                  <span class="muted">{{ nombre(v.nombreTipo) }}</span>
                </div>
              </div>
              <div class="separa"></div>
              <div class="fila">
                <span class="crece">
                  @if (v.idVehiculo === elegido()?.idVehiculo) { <span class="chip verde">Seleccionado</span> }
                  @else { <button class="enlace" (click)="seleccionar(v)">Seleccionar</button> }
                </span>
                <button class="enlace rojo" (click)="eliminar(v)">Desactivar</button>
              </div>
            </div>
          } @empty {
            <div class="od-card vacio muted">{{ cargado() ? 'Aún no registras vehículos. Agrega uno para poder reservar.' : 'Cargando…' }}</div>
          }
        </div>

        @if (formulario()) {
          <app-vehiculo-form (guardado)="registrado()" (cancelado)="formulario.set(false)"></app-vehiculo-form>
        } @else {
          <ion-button expand="block" (click)="formulario.set(true)"><ion-icon slot="start" name="add-outline"></ion-icon>Registrar vehículo</ion-button>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .lista { margin: 16px 0 14px; }
    .col { display: grid; gap: 3px; } .col b { font-size: 15px; }
    .enlace { font-size: 12.5px; }
    .vacio { text-align: center; padding: 22px 16px; }
  `],
})
export class VehiculosPage {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private ui = inject(UiService);
  private prefs = inject(PreferenciasService);

  lista = signal<Vehiculo[]>([]);
  cargado = signal(false);
  formulario = signal(false);
  elegido = computed(() => this.prefs.seleccionado(this.lista()));

  constructor() { addIcons({ addOutline }); }

  ionViewWillEnter() { this.formulario.set(false); this.cargar(); }

  nombre(n: string) { return n.charAt(0) + n.slice(1).toLowerCase(); }

  cargar() {
    this.api.vehiculos(this.auth.user()!.idUsuario).subscribe({
      next: (v) => { this.lista.set(v); this.cargado.set(true); },
      error: (e) => { this.cargado.set(true); this.ui.error(e, 'No se pudieron cargar tus vehículos'); },
    });
  }

  refrescar(ev: CustomEvent) { this.cargar(); setTimeout(() => (ev.target as HTMLIonRefresherElement).complete(), 500); }

  seleccionar(v: Vehiculo) { this.prefs.elegir(v.idVehiculo); this.ui.ok(`${v.identificador} quedó seleccionado`); }

  registrado() { this.formulario.set(false); this.ui.ok('Vehículo registrado'); this.cargar(); }

  async eliminar(v: Vehiculo) {
    if (!(await this.ui.confirmar('Desactivar vehículo', `¿Desactivar "${v.identificador}"? Tu historial se conserva.`, 'Desactivar', true))) return;
    this.api.eliminarVehiculo(v.idVehiculo).subscribe({
      next: () => { this.ui.ok('Vehículo desactivado'); this.cargar(); },
      error: (e) => this.ui.error(e),
    });
  }
}
