import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, IonContent, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, mapOutline, searchOutline } from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Bahia, ESTADO_BAHIA, EST, TIPO_VEHICULO, Vehiculo } from '../../core/models';
import { PreferenciasService } from '../../core/preferencias.service';
import { UiService } from '../../core/ui.service';
import { AppHeaderComponent } from '../../shared/app-header.component';

/** Inicio: vehículo elegido y bahías agrupadas por ubicación, con sus libres (HU-06). */
@Component({
  selector: 'app-bahias',
  standalone: true,
  imports: [AppHeaderComponent, IonContent, IonRefresher, IonRefresherContent, IonIcon],
  template: `
    <app-header></app-header>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>

      <div class="app-wrap">
        <h1 class="h1">Hola, {{ nombre() }}</h1>
        <p class="sub">Encuentra un rack disponible</p>

        <label class="campo busca">
          <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
          <input type="search" placeholder="Buscar sede o edificio" aria-label="Buscar sede o edificio"
                 [value]="texto()" (input)="texto.set($any($event.target).value)" />
        </label>

        <div class="od-card veh">
          @if (vehiculo(); as v) {
            <b>{{ v.identificador }}</b>
            <span class="muted">{{ tipoVeh(v.nombreTipo) }} ·
              @if (vehiculos().length > 1) { <button class="enlace" (click)="cambiarVehiculo()">Cambiar vehículo</button> }
              @else { <button class="enlace" (click)="irVehiculos()">Mis vehículos</button> }
            </span>
          } @else {
            <b>Sin vehículo registrado</b>
            <span class="muted">Necesitas uno para reservar · <button class="enlace" (click)="irVehiculos()">Registrar vehículo</button></span>
          }
        </div>

        @for (g of grupos(); track g.ubicacion; let primero = $first) {
          <div class="grupo">
            <h2 class="h2">{{ g.ubicacion }}</h2>
            <p class="sub">{{ g.libres }} {{ g.libres === 1 ? 'bahía libre' : 'bahías libres' }}@if (primero) { · Disponibilidad actualizada hace {{ haceSeg() }} s }</p>
            @for (b of g.items; track b.idBahia) {
              <button class="od-card bahia" (click)="abrir(b)">
                <span class="crece">
                  <b>Bahía {{ b.codigoIot }}</b>
                  <span class="muted">{{ tipo(b.idTipoPermitido) }}</span>
                  <span class="chip e{{ b.idEstado }}">{{ estado(b.idEstado) }}</span>
                </span>
                <ion-icon name="chevron-forward-outline" aria-hidden="true"></ion-icon>
              </button>
            }
          </div>
        } @empty {
          <div class="empty">
            <ion-icon name="map-outline"></ion-icon>
            <p>{{ cargado() ? 'No hay bahías que coincidan con la búsqueda.' : 'Cargando bahías…' }}</p>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .busca { margin-top: 14px; }
    .veh { margin-top: 14px; display: grid; gap: 4px; }
    .veh b { font-size: 14.5px; }
    .grupo { margin-top: 22px; }
    .grupo .sub { margin-bottom: 12px; }
    .bahia { display: flex; align-items: center; width: 100%; text-align: left; font: inherit; color: inherit; cursor: pointer; margin-top: 10px; }
    .bahia .crece { flex: 1; display: grid; gap: 6px; justify-items: start; }
    .bahia b { font-size: 14.5px; }
    .bahia ion-icon { color: var(--od-ink); font-size: 16px; }
  `],
})
export class BahiasPage implements OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private ui = inject(UiService);
  private router = inject(Router);
  private sheet = inject(ActionSheetController);
  private prefs = inject(PreferenciasService);

  private timer?: ReturnType<typeof setInterval>;
  private reloj?: ReturnType<typeof setInterval>;
  private ultima = Date.now();

  bahias = signal<Bahia[]>([]);
  vehiculos = signal<Vehiculo[]>([]);
  texto = signal('');
  cargado = signal(false);
  haceSeg = signal(0);

  nombre = computed(() => (this.auth.user()?.nombreCompleto ?? '').trim().split(/\s+/)[0] ?? '');
  vehiculo = computed(() => this.prefs.seleccionado(this.vehiculos()));
  grupos = computed(() => {
    const q = this.texto().trim().toLowerCase();
    const visibles = this.bahias().filter((b) => !q || b.ubicacion.toLowerCase().includes(q) || b.codigoIot.toLowerCase().includes(q));
    const mapa = new Map<string, Bahia[]>();
    for (const b of visibles) mapa.set(b.ubicacion, [...(mapa.get(b.ubicacion) ?? []), b]);
    return [...mapa.entries()].map(([ubicacion, items]) => ({
      ubicacion,
      items: [...items].sort((a, b) => a.idEstado - b.idEstado || a.codigoIot.localeCompare(b.codigoIot)),
      libres: items.filter((b) => b.idEstado === EST.DISPONIBLE).length,
    }));
  });

  constructor() { addIcons({ searchOutline, chevronForwardOutline, mapOutline }); }

  ionViewWillEnter() {
    this.cargar(true);
    this.timer = setInterval(() => this.cargar(false), environment.pollAppMs);
    this.reloj = setInterval(() => this.haceSeg.set(Math.floor((Date.now() - this.ultima) / 1000)), 1000);
  }
  ionViewWillLeave() { this.detener(); }
  ngOnDestroy() { this.detener(); }
  private detener() {
    if (this.timer) clearInterval(this.timer);
    if (this.reloj) clearInterval(this.reloj);
  }

  tipo(id: number) { return id === 1 ? 'Bicicletero' : `Para ${(TIPO_VEHICULO[id] ?? 'vehículo').toLowerCase()}`; }
  estado(id: number) { return ESTADO_BAHIA[id] ?? '—'; }
  tipoVeh(n: string) { return n.charAt(0) + n.slice(1).toLowerCase(); }

  private cargar(mostrarError: boolean) {
    const idUsuario = this.auth.user()!.idUsuario;
    forkJoin({ b: this.api.bahias(), v: this.api.vehiculos(idUsuario) }).subscribe({
      next: ({ b, v }) => {
        this.bahias.set(b); this.vehiculos.set(v); this.cargado.set(true);
        this.ultima = Date.now(); this.haceSeg.set(0);
      },
      error: (e) => { if (mostrarError) this.ui.error(e, 'No se pudieron cargar las bahías'); },
    });
  }

  refrescar(ev: CustomEvent) {
    this.cargar(true);
    setTimeout(() => (ev.target as HTMLIonRefresherElement).complete(), 600);
  }

  abrir(b: Bahia) {
    if (b.idEstado !== EST.DISPONIBLE) {
      this.ui.toast(`La bahía ${b.codigoIot} está ${this.estado(b.idEstado).toLowerCase()}. Elige una disponible.`, 'warning');
      return;
    }
    this.router.navigate(['/reservar', b.idBahia]);
  }

  irVehiculos() { this.router.navigateByUrl('/app/vehiculos'); }

  async cambiarVehiculo() {
    const s = await this.sheet.create({
      header: '¿Con qué vehículo vas a reservar?',
      buttons: [
        ...this.vehiculos().map((v) => ({ text: `${v.identificador} · ${this.tipoVeh(v.nombreTipo)}`, handler: () => this.prefs.elegir(v.idVehiculo) })),
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await s.present();
  }
}
