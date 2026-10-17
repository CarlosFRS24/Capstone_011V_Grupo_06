import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, checkmarkOutline, homeOutline, locationOutline, qrCodeOutline, scanOutline, swapHorizontalOutline,
} from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { duracion, etiquetaDia, hhmmss, hora, mmss, segundosRestantes } from '../../core/format';
import { Bahia, Historial, Reserva, Vehiculo } from '../../core/models';
import { ScannerService } from '../../core/scanner.service';
import { UiService } from '../../core/ui.service';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { VehIconComponent } from '../../shared/veh-icon.component';

/**
 * Pestaña Escanear (HU-07). Muestra, según el caso: reserva pendiente,
 * sesión activa o resumen de la sesión recién finalizada. Los botones abren la cámara directamente.
 */
@Component({
  selector: 'app-sesion',
  standalone: true,
  imports: [AppHeaderComponent, VehIconComponent, IonContent, IonButton, IonIcon, RouterLink],
  template: `
    <app-header></app-header>
    <ion-content>
      <div class="app-wrap">
        @switch (vista()) { @case ('finalizada') { @if (finalizada(); as f) {
          <!-- Sesión recién finalizada -->
          <h1 class="h1">Mi estacionamiento</h1>
          <div class="od-card centro">
            <span class="ok"><ion-icon name="checkmark-outline"></ion-icon></span>
            <span class="chip verde">Sesión finalizada</span>
            <b class="grande">Retiro confirmado</b>
            <p class="muted">Tu {{ nombreTipo(f.idBahia) }} fue retirada y la bahía {{ f.codigoIot }} vuelve a estar disponible.</p>
          </div>
          <div class="od-card">
            <div class="fila">
              <ion-icon class="azul" name="swap-horizontal-outline"></ion-icon>
              <b class="crece">Resumen de tu viaje</b>
              <span class="chip verde">Finalizada</span>
            </div>
            <div class="separa"></div>
            <b>{{ f.ubicacion }} · {{ f.codigoIot }}</b>
            <p class="muted veh">{{ f.vehiculo }}</p>
            <div class="par"><span>Inicio</span><b>{{ dia(f.fechaInicio) }}, {{ hh(f.fechaInicio) }}</b></div>
            <div class="par"><span>Fin</span><b>{{ f.fechaFin ? dia(f.fechaFin) + ', ' + hh(f.fechaFin) : '—' }}</b></div>
            <div class="par"><span>Permanencia</span><b>{{ dur(f.minutos) }}</b></div>
          </div>
          <div class="aviso verde"><ion-icon name="checkmark-circle-outline"></ion-icon> El dispositivo confirmó la apertura y el retiro.</div>
          <ion-button expand="block" class="principal" routerLink="/app/bahias" routerDirection="root">
            <ion-icon slot="start" name="home-outline"></ion-icon>Volver al inicio
          </ion-button>
          <p class="nota">Revisa esta sesión cuando quieras en Historial</p>
        } } @case ('activa') { @if (activa(); as a) {
          <!-- Sesión activa -->
          <h1 class="h1">Sesión activa</h1>
          <span class="chip verde punto estado">Sesión en curso</span>
          <p class="sub">Tu {{ nombreTipo(a.idBahia) }} está resguardada</p>
          <div class="od-card primera">
            <span class="rotulo">Bahía asignada</span>
            <b class="dato">{{ a.codigoIot }}</b>
            <span class="muted">{{ a.ubicacion }}</span>
          </div>
          <div class="od-card">
            <span class="rotulo">Tiempo de uso</span>
            <b class="dato reloj">{{ transcurrido() }}</b>
            <span class="muted">Inicio: {{ dia(a.fechaInicio).toLowerCase() }}, {{ hh(a.fechaInicio) }}</span>
            <span class="muted">Confirmación IoT: apertura recibida</span>
          </div>
          <ion-button expand="block" class="principal" [disabled]="procesando()" (click)="escanear('salida')">
            <ion-icon slot="start" name="scan-outline"></ion-icon>Escanear para retirar
          </ion-button>
          <p class="nota">El retiro se confirmará en esta pantalla · <button class="enlace" [disabled]="procesando()" (click)="escanear('salida', true)">Ingresar código</button></p>
        } } @case ('reserva') { @if (reserva(); as r) {
          <!-- Reserva pendiente -->
          <h1 class="h1">Mi estacionamiento</h1>
          <span class="chip ambar punto estado">Reserva pendiente</span>
          <p class="sub">Tu bahía está reservada. Inicia la sesión al llegar.</p>
          <div class="od-card primera">
            <div class="fila">
              <span class="tile"><ion-icon name="location-outline"></ion-icon></span>
              <div class="crece col">
                <b>{{ bahia()?.ubicacion ?? 'Bahía' }} · {{ bahia()?.codigoIot ?? '#' + r.idBahia }}</b>
                <span class="muted">{{ bahia()?.idTipoPermitido === 2 ? 'Estacionamiento de scooters' : 'Bicicletero' }}</span>
              </div>
            </div>
            <div class="separa"></div>
            <div class="fila">
              <span class="tile gris"><app-veh-icon [tipo]="bahia()?.idTipoPermitido ?? 1" [size]="20"></app-veh-icon></span>
              <div class="crece col">
                <span class="mini">VEHÍCULO</span>
                <b>{{ nombreVehiculo() || '—' }}</b>
              </div>
            </div>
            <div class="par valida"><span>Reserva válida hasta</span><b>{{ hh(r.fechaExpiracion) }}</b></div>
            <div class="par" [class.urgente]="restante() <= 120"><span>Tiempo restante</span><b>{{ cuenta() }}</b></div>
          </div>
          <div class="aviso">
            <span class="tile"><ion-icon name="qr-code-outline"></ion-icon></span>
            <div><b>Abre la bahía con tu teléfono</b>Escanea el código QR del rack.</div>
          </div>
          <ion-button expand="block" class="principal" [disabled]="procesando()" (click)="escanear('entrada')">
            <ion-icon slot="start" name="scan-outline"></ion-icon>Iniciar con QR
          </ion-button>
          <ion-button expand="block" class="sec" (click)="cancelar(r)">Cancelar reserva</ion-button>
          <p class="nota">Acércate a la bahía para comenzar · <button class="enlace" [disabled]="procesando()" (click)="escanear('entrada', true)">Ingresar código</button></p>
        } } @default {
          <h1 class="h1">Escanear bahía</h1>
          <div class="empty">
            <ion-icon name="qr-code-outline"></ion-icon>
            <p>{{ cargado() ? 'No tienes una reserva ni una sesión activa. Reserva una bahía para poder escanear.' : 'Cargando…' }}</p>
            @if (cargado()) { <ion-button routerLink="/app/bahias" routerDirection="root">Buscar bahía</ion-button> }
          </div>
        } }
      </div>
    </ion-content>
  `,
  styles: [`
    .estado { margin-top: 8px; }
    .primera { margin-top: 16px; }
    .od-card .rotulo { display: block; margin-bottom: 2px; }
    .dato { display: block; font-size: 22px; letter-spacing: .2px; }
    .reloj { font-variant-numeric: tabular-nums; }
    .od-card .muted { display: block; margin-top: 4px; }
    .col { display: grid; gap: 2px; } .col .muted { margin: 0; }
    .mini { font-size: 10.5px; letter-spacing: .6px; color: var(--od-muted); }
    .valida { margin-top: 10px; } .urgente b { color: var(--od-red); }
    .aviso { margin-top: 12px; align-items: center; }
    .principal { margin-top: 22px; } .sec { margin-top: 10px; }
    .centro { text-align: center; margin-top: 14px; display: grid; justify-items: center; gap: 8px; padding: 20px 16px; }
    .centro .muted { margin: 0; }
    .ok { width: 46px; height: 46px; border-radius: 50%; background: var(--od-green-soft); color: var(--od-green); display: grid; place-items: center; font-size: 24px; }
    .grande { font-size: 17px; }
    .azul { color: var(--od-blue); font-size: 18px; }
    .veh { margin: 2px 0 8px !important; }
    .aviso.verde { font-size: 12px; }
    .aviso.verde ion-icon { font-size: 18px; }
  `],
})
export class SesionPage implements OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private ui = inject(UiService);
  private scanner = inject(ScannerService);

  private timer?: ReturnType<typeof setInterval>;
  private ultimaCarga = 0;

  reserva = signal<Reserva | null>(null);
  activa = signal<Historial | null>(null);
  finalizada = signal<Historial | null>(null);
  /** true mientras se lee el QR o se espera la respuesta del backend (evita dobles toques). */
  procesando = signal(false);
  bahias = signal<Bahia[]>([]);
  vehiculos = signal<Vehiculo[]>([]);
  cargado = signal(false);
  private tic = signal(0); // fuerza el recálculo de los relojes cada segundo

  bahia = computed(() => this.bahias().find((b) => b.idBahia === this.reserva()?.idBahia) ?? null);
  nombreVehiculo = computed(() => this.vehiculos().find((v) => v.idVehiculo === this.reserva()?.idVehiculo)?.identificador ?? '');
  restante = computed(() => { this.tic(); const r = this.reserva(); return r ? segundosRestantes(r.fechaExpiracion) : 0; });
  cuenta = computed(() => mmss(this.restante()));
  transcurrido = computed(() => { this.tic(); const a = this.activa(); return a ? hhmmss(a.fechaInicio) : '00:00:00'; });
  /** Qué se muestra: el resumen de la sesión terminada, la sesión activa, la reserva o nada. */
  vista = computed(() => {
    if (this.finalizada()) return 'finalizada';
    if (this.activa()) return 'activa';
    return this.reserva() ? 'reserva' : 'vacio';
  });

  dia = etiquetaDia;
  hh = hora;
  dur = duracion;

  constructor() {
    addIcons({ qrCodeOutline, scanOutline, locationOutline, checkmarkOutline, checkmarkCircleOutline, homeOutline, swapHorizontalOutline });
  }

  ionViewWillEnter() {
    this.cargar();
    this.timer = setInterval(() => {
      this.tic.update((n) => n + 1);
      // Si la reserva llegó a 0, refresca (como máximo cada 5 s) para reflejar la expiración
      if (this.reserva() && this.restante() === 0 && Date.now() - this.ultimaCarga > 5000) this.cargar();
    }, 1000);
  }
  ionViewWillLeave() { this.detener(); this.finalizada.set(null); }
  ngOnDestroy() { this.detener(); }
  private detener() { if (this.timer) clearInterval(this.timer); }

  nombreTipo(idBahia: number) { return this.bahias().find((b) => b.idBahia === idBahia)?.idTipoPermitido === 2 ? 'scooter' : 'bicicleta'; }

  cargar(alTerminar?: (hist: Historial[]) => void) {
    this.ultimaCarga = Date.now();
    const id = this.auth.user()!.idUsuario;
    forkJoin({
      res: this.api.reservasPendientes(id),
      hist: this.api.historial(id),
      bahias: this.api.bahias(),
      veh: this.api.vehiculos(id),
    }).subscribe({
      next: ({ res, hist, bahias, veh }) => {
        this.activa.set(hist.find((h) => h.estadoTransaccion === 'ACTIVA') ?? null);
        this.reserva.set(res[0] ?? null);
        this.bahias.set(bahias);
        this.vehiculos.set(veh);
        this.cargado.set(true);
        alTerminar?.(hist);
      },
      error: (e) => { this.cargado.set(true); this.ui.error(e, 'No se pudo cargar tu sesión'); },
    });
  }

  /**
   * Abre directamente la cámara (o el ingreso manual) y hace check-in ('entrada') o check-out ('salida').
   * Si el usuario cierra el escáner sin leer nada, vuelve a la misma pantalla.
   */
  async escanear(modo: 'entrada' | 'salida', manual = false) {
    if (this.procesando()) return;
    this.procesando.set(true);
    let codigo: string | null;
    try { codigo = manual ? await this.scanner.pedirCodigo() : await this.scanner.escanear(); }
    catch (e) { this.procesando.set(false); this.ui.toast((e as Error).message || 'No se pudo abrir la cámara', 'danger'); return; }
    if (!codigo) { this.procesando.set(false); return; }

    this.api.bahiaPorCodigo(codigo).subscribe({
      next: (b) => (modo === 'salida' ? this.checkOut(b) : this.checkIn(b)),
      error: (e) => { this.procesando.set(false); this.ui.error(e, 'QR no válido: la bahía no existe'); },
    });
  }

  private checkIn(b: Bahia) {
    const r = this.reserva();
    if (!r) { this.procesando.set(false); return; }
    if (b.idBahia !== r.idBahia) {
      this.procesando.set(false);
      this.ui.toast(`Ese QR es de ${b.codigoIot}. Tu reserva es para ${this.bahia()?.codigoIot ?? 'otra bahía'}.`, 'warning');
      return;
    }
    this.api.iniciarSesion({ idReserva: r.idReserva, idBahia: b.idBahia, idVehiculo: r.idVehiculo }).subscribe({
      next: () => { this.procesando.set(false); this.ui.ok('Sesión iniciada: candado liberado'); this.cargar(); },
      error: (e) => { this.procesando.set(false); this.ui.error(e, 'No se pudo iniciar la sesión'); this.cargar(); },
    });
  }

  private checkOut(b: Bahia) {
    const a = this.activa();
    if (!a) { this.procesando.set(false); return; }
    if (b.idBahia !== a.idBahia) {
      this.procesando.set(false);
      this.ui.toast(`Ese QR es de ${b.codigoIot}. Tu sesión está en ${a.codigoIot}.`, 'warning');
      return;
    }
    this.api.finalizarSesion(a.idTransaccion).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cargar((hist) => this.finalizada.set(hist.find((h) => h.idTransaccion === a.idTransaccion) ?? { ...a, estadoTransaccion: 'FINALIZADA' }));
      },
      error: (e) => { this.procesando.set(false); this.ui.error(e, 'No se pudo finalizar la sesión'); },
    });
  }

  async cancelar(r: Reserva) {
    if (!(await this.ui.confirmar('Cancelar reserva', '¿Seguro? La bahía quedará disponible para otros usuarios.', 'Cancelar reserva', true))) return;
    this.api.cancelarReserva(r.idReserva).subscribe({
      next: () => { this.ui.ok('Reserva cancelada'); this.cargar(); },
      error: (e) => this.ui.error(e),
    });
  }
}
