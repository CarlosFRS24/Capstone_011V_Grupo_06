import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline } from 'ionicons/icons';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { duracion, etiquetaDia, hora } from '../../core/format';
import { Historial } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { AppHeaderComponent } from '../../shared/app-header.component';

/** Historial de estacionamientos del usuario (HU-08). */
@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [AppHeaderComponent, IonContent, IonIcon, IonRefresher, IonRefresherContent],
  template: `
    <app-header></app-header>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>
      <div class="app-wrap">
        <h1 class="h1">Mi historial</h1>
        <p class="sub">Tus ingresos y salidas registrados</p>

        <div class="od-card oscura mes">
          <small>Este mes</small>
          <b>{{ delMes() }} {{ delMes() === 1 ? 'estacionamiento' : 'estacionamientos' }}</b>
        </div>

        @if (lista().length) {
          <h2 class="h2 mov">Movimientos recientes</h2>
          @for (h of lista(); track h.idTransaccion) {
            <div class="od-card item">
              <b>{{ dia(h.fechaInicio) }} · {{ hh(h.fechaInicio) }}@if (h.fechaFin) {-{{ hh(h.fechaFin) }}}</b>
              <span class="muted">{{ h.ubicacion }} · {{ h.codigoIot }}</span>
              @if (h.estadoTransaccion === 'ACTIVA') { <span class="chip azul">En curso</span> }
              @else { <span class="mini">{{ dur(h.minutos) }}@if (h.vehiculo) { · {{ h.vehiculo }} }</span> }
            </div>
          }
          <p class="pie muted">Cada movimiento conserva fecha y hora.</p>
        } @else {
          <div class="empty"><ion-icon name="time-outline"></ion-icon>
            <p>{{ cargado() ? 'Todavía no tienes estacionamientos registrados.' : 'Cargando…' }}</p></div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .mes { margin-top: 16px; }
    .mov { margin: 22px 0 12px; }
    .item { display: grid; gap: 5px; justify-items: start; }
    .item b { font-size: 14.5px; }
    .mini { font-size: 11.5px; color: var(--od-muted); }
    .pie { margin-top: 26px; }
  `],
})
export class HistorialPage {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private ui = inject(UiService);

  lista = signal<Historial[]>([]);
  cargado = signal(false);
  delMes = computed(() => {
    const hoy = new Date();
    return this.lista().filter((h) => {
      const d = new Date(h.fechaInicio);
      return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
    }).length;
  });
  dur = duracion;
  dia = etiquetaDia;
  hh = hora;

  constructor() { addIcons({ timeOutline }); }
  ionViewWillEnter() { this.cargar(); }

  cargar() {
    this.api.historial(this.auth.user()!.idUsuario).subscribe({
      next: (h) => {
        this.lista.set([...h].sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()));
        this.cargado.set(true);
      },
      error: (e) => { this.cargado.set(true); this.ui.error(e, 'No se pudo cargar el historial'); },
    });
  }
  refrescar(ev: CustomEvent) { this.cargar(); setTimeout(() => (ev.target as HTMLIonRefresherElement).complete(), 500); }
}
