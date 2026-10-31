import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, IonButton, IonContent, IonIcon, IonRefresher, IonRefresherContent, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, banOutline, chevronDownOutline, chevronForwardOutline, chevronUpOutline, hourglassOutline, mapOutline, searchOutline, timeOutline } from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { EstadoService } from '../../core/estado.service';
import { hora, mmss, segundosRestantes } from '../../core/format';
import { Bahia, ESTADO_BAHIA, EST, TIPO_VEHICULO, Vehiculo } from '../../core/models';
import { PreferenciasService } from '../../core/preferencias.service';
import { UiService } from '../../core/ui.service';
import { AppHeaderComponent } from '../../shared/app-header.component';

/*
  Inicio: vehículo elegido y bahías agrupadas por ubicación, con sus libres (HU-06).
  Faltas, horario de reservas, lista de espera y sectores que se contraen (50 bahías).
 */
@Component({
  selector: 'app-bahias',
  standalone: true,
  imports: [AppHeaderComponent, IonContent, IonRefresher, IonRefresherContent, IonIcon, IonButton, IonSpinner],
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
          @if (est(); as e) {
            @if (e.faltasVigentes > 0 && !e.reservasBloqueadas) {
              <span class="faltas muted"><ion-icon name="alert-circle-outline"></ion-icon> Faltas: {{ e.faltasVigentes }} de {{ e.maxFaltas }}</span>
            }
          }
        </div>

        <!-- Avisos de bloqueo, horario y lista de espera -->
        @if (est(); as e) {
          @if (e.reservasBloqueadas) {
            <div class="aviso roja bloque">
              <ion-icon name="ban-outline"></ion-icon>
              <div><b>No puedes reservar</b>Sumaste {{ e.faltasVigentes }} faltas por no llegar a tus reservas. Acércate a la administración para que te desbloqueen.</div>
            </div>
          } @else if (!e.horario.reservasAbiertas) {
            <div class="aviso ambar bloque">
              <ion-icon name="time-outline"></ion-icon>
              <div><b>Fuera del horario de reservas</b>{{ e.horario.mensaje }}</div>
            </div>
          }
          @if (e.espera; as esp) {
            @if (esp.estadoEspera === 'OFRECIDA') {
              <div class="aviso verde bloque oferta">
                <ion-icon name="hourglass-outline"></ion-icon>
                <div class="crece">
                  <b>¡Se liberó la bahía {{ esp.codigoIot }}!</b>
                  {{ esp.ubicacion }}. Está guardada para ti {{ restante(esp.fechaLimiteOferta) }} más (hasta las {{ hora(esp.fechaLimiteOferta) }}).
                  <div class="acciones">
                    <ion-button size="small" [disabled]="ocupado()" (click)="confirmarOferta()">
                      @if (ocupado()) { <ion-spinner name="dots"></ion-spinner> } @else { Reservar esta bahía }
                    </ion-button>
                    <ion-button size="small" class="sec" [disabled]="ocupado()" (click)="salirEspera(true)">No la quiero</ion-button>
                  </div>
                </div>
              </div>
            } @else {
              <div class="aviso bloque">
                <ion-icon name="hourglass-outline"></ion-icon>
                <div class="crece">
                  <b>Estás en la lista de espera · posición {{ esp.posicion }}</b>
                  Te avisaremos aquí cuando se libere una bahía para tu {{ tipoNombre(esp.idTipoVehiculo) }}. Tendrás {{ minutosOferta }} minutos para confirmarla.
                  <div class="acciones">
                    <ion-button size="small" class="sec" [disabled]="ocupado()" (click)="salirEspera(false)">Salir de la lista</ion-button>
                  </div>
                </div>
              </div>
            }
          } @else if (puedeEsperar()) {
            <div class="aviso ambar bloque">
              <ion-icon name="hourglass-outline"></ion-icon>
              <div class="crece">
                <b>No hay bahías libres para tu {{ tipoNombre(vehiculo()!.idTipoVehiculo) }}</b>
                Únete a la lista de espera y te avisaremos cuando se libere una.
                <div class="acciones">
                  <ion-button size="small" [disabled]="ocupado()" (click)="unirseEspera()">
                    @if (ocupado()) { <ion-spinner name="dots"></ion-spinner> } @else { Unirme a la lista de espera }
                  </ion-button>
                </div>
              </div>
            </div>
          }
        }

        @if (vehiculo()) {
          <label class="solo-compat">
            <input type="checkbox" [checked]="soloCompatibles()" (change)="soloCompatibles.set($any($event.target).checked)" />
            Ver solo bahías para mi {{ tipoNombre(vehiculo()!.idTipoVehiculo) }}
          </label>
        }

        @for (g of grupos(); track g.ubicacion; let primero = $first) {
          <div class="grupo">
            <button class="cab-grupo" (click)="alternar(g.ubicacion)" [attr.aria-expanded]="!cerrado(g.ubicacion)">
              <span class="crece">
                <h2 class="h2">{{ g.ubicacion }}</h2>
                <p class="sub">{{ g.libres }} {{ g.libres === 1 ? 'bahía libre' : 'bahías libres' }} de {{ g.items.length }}@if (primero) { · actualizado hace {{ haceSeg() }} s }</p>
              </span>
              <ion-icon [name]="cerrado(g.ubicacion) ? 'chevron-down-outline' : 'chevron-up-outline'" aria-hidden="true"></ion-icon>
            </button>
            @if (!cerrado(g.ubicacion)) {
            @for (b of mostrar(g.ubicacion, g.items); track b.idBahia) {
              <button class="od-card bahia" (click)="abrir(b)">
                <span class="crece">
                  <b>Bahía {{ b.codigoIot }}</b>
                  <span class="muted">{{ tipo(b.idTipoPermitido) }}</span>
                  <span class="chip e{{ b.idEstado }}">{{ estado(b.idEstado) }}</span>
                </span>
                <ion-icon name="chevron-forward-outline" aria-hidden="true"></ion-icon>
              </button>
            }
            @if (g.items.length > visiblesPorSector && !expandido(g.ubicacion)) {
              <button class="enlace ver-mas" (click)="expandir(g.ubicacion)">Ver las {{ g.items.length - visiblesPorSector }} bahías restantes</button>
            }
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
    .faltas { display: inline-flex; align-items: center; gap: 4px; color: #a86a00; font-weight: 600; margin-top: 4px; }
    .bloque { margin-top: 14px; }
    .bloque > ion-icon { font-size: 20px; flex: none; margin-top: 1px; }
    .bloque .crece { flex: 1; }
    .oferta { align-items: flex-start; }
    .solo-compat { display: flex; align-items: center; gap: 8px; margin-top: 16px; font-size: 13px; color: var(--od-muted); }
    .cab-grupo { display: flex; align-items: center; width: 100%; background: none; border: 0; padding: 0; text-align: left; font: inherit; color: inherit; cursor: pointer; }
    .cab-grupo .crece { flex: 1; }
    .cab-grupo ion-icon { font-size: 18px; color: var(--od-muted); }
    .grupo .sub { margin-bottom: 4px; }
    .ver-mas { display: block; margin: 12px auto 0; font-size: 13px; }
  `],
})
export class BahiasPage implements OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private ui = inject(UiService);
  private router = inject(Router);
  private sheet = inject(ActionSheetController);
  private prefs = inject(PreferenciasService);
  private estadoSrv = inject(EstadoService);

  private timer?: ReturnType<typeof setInterval>;
  private reloj?: ReturnType<typeof setInterval>;
  private ultima = Date.now();

  bahias = signal<Bahia[]>([]);
  vehiculos = signal<Vehiculo[]>([]);
  texto = signal('');
  cargado = signal(false);
  haceSeg = signal(0);
  ahora = signal(Date.now());          // para la cuenta regresiva de la oferta
  ocupado = signal(false);
  soloCompatibles = signal(true);
  private cerrados = signal<Set<string>>(new Set());
  private expandidos = signal<Set<string>>(new Set());
  readonly visiblesPorSector = 6;
  readonly minutosOferta = 15;
  est = this.estadoSrv.estado;
  hora = hora;

  nombre = computed(() => (this.auth.user()?.nombreCompleto ?? '').trim().split(/\s+/)[0] ?? '');
  vehiculo = computed(() => this.prefs.seleccionado(this.vehiculos()));
  grupos = computed(() => {
    const q = this.texto().trim().toLowerCase();
    const tipoVeh = this.soloCompatibles() ? this.vehiculo()?.idTipoVehiculo : undefined;
    const visibles = this.bahias().filter((b) =>
      (!tipoVeh || b.idTipoPermitido === tipoVeh) &&
      (!q || b.ubicacion.toLowerCase().includes(q) || b.codigoIot.toLowerCase().includes(q)));
    const mapa = new Map<string, Bahia[]>();
    for (const b of visibles) mapa.set(b.ubicacion, [...(mapa.get(b.ubicacion) ?? []), b]);
    return [...mapa.entries()].map(([ubicacion, items]) => ({
      ubicacion,
      items: [...items].sort((a, b) => a.idEstado - b.idEstado || a.codigoIot.localeCompare(b.codigoIot)),
      libres: items.filter((b) => b.idEstado === EST.DISPONIBLE).length,
    }));
  });

  /* Sin bahías libres para el vehículo elegido, en horario y sin bloqueo -> se ofrece la lista de espera. */
  puedeEsperar = computed(() => {
    const e = this.est(), v = this.vehiculo();
    if (!e || !v || !this.cargado() || e.reservasBloqueadas || !e.horario.reservasAbiertas || e.espera) return false;
    return !this.bahias().some((b) => b.idTipoPermitido === v.idTipoVehiculo && b.idEstado === EST.DISPONIBLE);
  });

  constructor() {
    addIcons({ searchOutline, chevronForwardOutline, chevronDownOutline, chevronUpOutline, mapOutline, alertCircleOutline, banOutline, hourglassOutline, timeOutline });
  }

  ionViewWillEnter() {
    this.cargar(true);
    this.timer = setInterval(() => this.cargar(false), environment.pollAppMs);
    this.reloj = setInterval(() => { this.haceSeg.set(Math.floor((Date.now() - this.ultima) / 1000)); this.ahora.set(Date.now()); }, 1000);
    this.estadoSrv.refrescar();
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
  tipoNombre(id: number) { return (TIPO_VEHICULO[id] ?? 'vehículo').toLowerCase(); }

  // Sectores que se contraen y "ver más"
  cerrado(u: string) { return this.cerrados().has(u); }
  expandido(u: string) { return this.expandidos().has(u) || !!this.texto().trim(); }
  alternar(u: string) {
    const s = new Set(this.cerrados());
    s.has(u) ? s.delete(u) : s.add(u);
    this.cerrados.set(s);
  }
  expandir(u: string) { this.expandidos.set(new Set(this.expandidos()).add(u)); }
  mostrar(u: string, items: Bahia[]) { return this.expandido(u) ? items : items.slice(0, this.visiblesPorSector); }

  restante(limite?: string) {
    this.ahora();   // se recalcula cada segundo
    return limite ? mmss(segundosRestantes(limite)) : '—';
  }

  //  Lista de espera
  unirseEspera() {
    const v = this.vehiculo();
    if (!v || this.ocupado()) return;
    this.ocupado.set(true);
    this.api.unirseEspera(v.idVehiculo).subscribe({
      next: (e) => { this.ocupado.set(false); this.ui.ok(`Estás en la lista de espera (posición ${e.posicion})`); this.estadoSrv.refrescar(); },
      error: (e) => { this.ocupado.set(false); this.ui.error(e, 'No se pudo unir a la lista'); this.estadoSrv.refrescar(); this.cargar(false); },
    });
  }

  async salirEspera(rechazaOferta: boolean) {
    const msg = rechazaOferta ? 'La bahía pasará al siguiente de la lista y tú saldrás de ella.' : 'Perderás tu lugar en la fila.';
    if (!(await this.ui.confirmar(rechazaOferta ? 'Rechazar bahía' : 'Salir de la lista', msg, 'Salir', true))) return;
    this.ocupado.set(true);
    this.api.salirEspera().subscribe({
      next: () => { this.ocupado.set(false); this.ui.toast('Saliste de la lista de espera'); this.estadoSrv.refrescar(); this.cargar(false); },
      error: (e) => { this.ocupado.set(false); this.ui.error(e); this.estadoSrv.refrescar(); },
    });
  }

  async confirmarOferta() {
    this.ocupado.set(true);
    await this.estadoSrv.confirmarOferta();
    this.ocupado.set(false);
  }

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
    this.estadoSrv.refrescar();
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
