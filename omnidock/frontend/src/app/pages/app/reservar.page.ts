import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonFooter, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, informationCircleOutline, locationOutline } from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Bahia, ESTADO_BAHIA, EST, TIPO_VEHICULO, Vehiculo } from '../../core/models';
import { PreferenciasService } from '../../core/preferencias.service';
import { UiService } from '../../core/ui.service';
import { AppHeaderComponent } from '../../shared/app-header.component';
import { VehIconComponent } from '../../shared/veh-icon.component';

/** Detalle de reserva: confirma bahía y vehículo antes de reservar (HU-02 y HU-06). */
@Component({
  selector: 'app-reservar',
  standalone: true,
  imports: [AppHeaderComponent, VehIconComponent, IonContent, IonFooter, IonButton, IonIcon, IonSpinner],
  template: `
    <app-header title="Detalle de reserva" back="/app/bahias"></app-header>
    <ion-content>
      <div class="app-wrap">
        <h1 class="h1">Confirma tu reserva</h1>
        <p class="sub">Revisa la bahía y el vehículo antes de continuar.</p>

        @if (bahia(); as b) {
          <div class="od-card detalle">
            <div class="fila">
              <span class="tile"><ion-icon name="location-outline"></ion-icon></span>
              <div class="crece">
                <b class="sede">{{ b.ubicacion }}</b>
                <b class="codigo">Bahía {{ b.codigoIot }}</b>
                <span class="muted">{{ b.idTipoPermitido === 1 ? 'Bicicletero' : 'Estacionamiento de scooters' }}</span>
              </div>
              <span class="chip punto e{{ b.idEstado }}">{{ estado(b.idEstado) }}</span>
            </div>
            <div class="pie muted"><app-veh-icon [tipo]="b.idTipoPermitido" [size]="16"></app-veh-icon> Solo para {{ tipo(b.idTipoPermitido).toLowerCase() }}s</div>
          </div>

          <p class="rotulo vr">Vehículo para esta reserva</p>
          @if (compatibles().length) {
            <label class="campo">
              <app-veh-icon [tipo]="b.idTipoPermitido" [size]="18"></app-veh-icon>
              <select aria-label="Vehículo para esta reserva" [value]="elegido()?.idVehiculo" (change)="elegir(+$any($event.target).value)">
                @for (v of compatibles(); track v.idVehiculo) {
                  <option [value]="v.idVehiculo" [selected]="v.idVehiculo === elegido()?.idVehiculo">{{ v.identificador }}</option>
                }
              </select>
            </label>
          } @else {
            <div class="campo sin">No tienes un vehículo compatible con esta bahía</div>
          }

          <div class="od-card info fila">
            <span class="tile"><ion-icon name="information-circle-outline"></ion-icon></span>
            <div class="crece">
              <b>La reserva es obligatoria</b>
              <span class="muted">Al reservar, el espacio quedará asociado a tu vehículo antes de iniciar el uso.</span>
            </div>
          </div>
        } @else {
          <div class="empty"><p>{{ cargado() ? 'No se encontró la bahía.' : 'Cargando…' }}</p></div>
        }
      </div>
    </ion-content>

    <ion-footer class="ion-no-border">
      <div class="pie-fijo">
        <ion-button expand="block" [disabled]="!bahia() || enviando()" (click)="reservar()">
          @if (enviando()) { <ion-spinner name="dots"></ion-spinner> }
          @else { Reservar bahía <ion-icon slot="end" name="arrow-forward-outline"></ion-icon> }
        </ion-button>
        <p class="nota">Tendrás {{ minutos }} minutos para llegar y escanear</p>
      </div>
    </ion-footer>
  `,
  styles: [`
    .detalle { margin-top: 18px; padding: 0; }
    .detalle .fila { padding: 16px; align-items: flex-start; position: relative; }
    .detalle .chip { position: absolute; top: 14px; right: 14px; }
    .sede { padding-right: 96px; }
    .detalle .crece { display: grid; gap: 3px; }
    .sede { font-size: 13.5px; } .codigo { font-size: 17px; }
    .detalle .pie { border-top: 1px solid var(--od-line); padding: 10px 16px; display: flex; align-items: center; gap: 8px; }
    .vr { margin-top: 18px; }
    .sin { color: var(--od-muted); font-size: 13px; }
    .info { margin-top: 14px; align-items: flex-start; }
    .info .crece { display: grid; gap: 4px; }
    .info b { font-size: 13.5px; }
    .pie-fijo { background: #fff; border-top: 1px solid var(--od-line); padding: 10px 18px 14px; }
    .pie-fijo > * { max-width: 484px; margin-inline: auto; }
    .pie-fijo ion-button { display: block; }
  `],
})
export class ReservarPage {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private ui = inject(UiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private prefs = inject(PreferenciasService);

  minutos = environment.reservaMinutos;
  bahia = signal<Bahia | null>(null);
  vehiculos = signal<Vehiculo[]>([]);
  cargado = signal(false);
  enviando = signal(false);
  private idElegido = signal<number | null>(null);

  compatibles = computed(() => this.vehiculos().filter((v) => v.idTipoVehiculo === this.bahia()?.idTipoPermitido));
  elegido = computed<Vehiculo | null>(() => {
    const lista = this.compatibles();
    return lista.find((v) => v.idVehiculo === this.idElegido()) ?? lista.find((v) => v.idVehiculo === this.prefs.idVehiculo()) ?? lista[0] ?? null;
  });

  constructor() { addIcons({ locationOutline, informationCircleOutline, arrowForwardOutline }); }

  ionViewWillEnter() {
    const idBahia = Number(this.route.snapshot.paramMap.get('idBahia'));
    this.idElegido.set(null);
    this.enviando.set(false);
    forkJoin({ b: this.api.bahias(), v: this.api.vehiculos(this.auth.user()!.idUsuario) }).subscribe({
      next: ({ b, v }) => { this.bahia.set(b.find((x) => x.idBahia === idBahia) ?? null); this.vehiculos.set(v); this.cargado.set(true); },
      error: (e) => { this.cargado.set(true); this.ui.error(e, 'No se pudo cargar la bahía'); },
    });
  }

  tipo(id: number) { return TIPO_VEHICULO[id] ?? 'vehículo'; }
  estado(id: number) { return ESTADO_BAHIA[id] ?? '—'; }
  elegir(id: number) { this.idElegido.set(id); }

  reservar() {
    const b = this.bahia();
    if (!b || this.enviando()) return;
    const veh = this.elegido();
    if (!veh) {
      // HU-02: sin vehículo compatible no se asigna la bahía y se avisa arriba
      this.ui.toast(`Esta bahía es para ${this.tipo(b.idTipoPermitido).toLowerCase()}. Registra un vehículo compatible en la pestaña Vehículos.`, 'warning');
      return;
    }
    if (b.idEstado !== EST.DISPONIBLE) {
      this.ui.toast(`La bahía ${b.codigoIot} ya no está disponible.`, 'warning');
      return;
    }
    this.enviando.set(true);
    this.api.crearReserva(b.idBahia, veh.idVehiculo).subscribe({
      next: () => {
        this.prefs.elegir(veh.idVehiculo);
        this.ui.ok('Reserva creada');
        this.router.navigateByUrl('/app/sesion', { replaceUrl: true });
      },
      error: (e) => { this.enviando.set(false); this.ui.error(e, 'No se pudo reservar'); },
    });
  }
}
