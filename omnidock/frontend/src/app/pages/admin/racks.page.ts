import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActionSheetController, AlertController, IonButton, IonContent, IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, ellipsisVertical, locationOutline, searchOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/api.service';
import { partirUbicacion } from '../../core/format';
import { Bahia, ESTADO_BAHIA, EST, TIPO_VEHICULO } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { AdminTopComponent } from '../../shared/admin-top.component';
import { VehIconComponent } from '../../shared/veh-icon.component';
import { BahiaFormComponent } from './bahia-form.component';

const TONO: Record<number, string> = { 1: 'verde', 2: 'ambar', 3: 'azul', 4: 'roja' };

/** Monitoreo de racks (HU-09): estado de cada bahía en vivo, filtros y acciones. */
@Component({
  selector: 'app-racks',
  standalone: true,
  imports: [AdminTopComponent, VehIconComponent, IonContent, IonIcon, IonButton],
  template: `
    <ion-content>
      <div class="adm">
        <app-admin-top titulo="Monitoreo de racks" bajada="Visualiza el estado operativo en tiempo real de todas las bahías del sistema."></app-admin-top>

        <div class="kpis">
          @for (e of estados; track e.id) {
            <button class="kpi {{ tono(e.id) }}" [class.sel]="fEstado() === e.id" (click)="toggleEstado(e.id)">
              <div><b>{{ conteo(e.id) }}</b><span>{{ e.plural }}</span></div>
            </button>
          }
        </div>

        <div class="filtros">
          <label class="campo busca">
            <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
            <input type="search" placeholder="Buscar por código, ubicación o tipo…" aria-label="Buscar" (input)="texto.set($any($event.target).value)" />
          </label>
          <label class="campo sel">
            <select aria-label="Estado" [value]="fEstado()" (change)="fEstado.set(+$any($event.target).value)">
              <option value="0">Todos los estados</option>
              @for (e of estados; track e.id) { <option [value]="e.id" [selected]="fEstado() === e.id">{{ e.nombre }}</option> }
            </select>
          </label>
          <label class="campo sel">
            <select aria-label="Tipo" (change)="fTipo.set(+$any($event.target).value)">
              <option value="0">Todos los tipos</option>
              @for (t of tipos; track t.id) { <option [value]="t.id">{{ t.nombre }}</option> }
            </select>
          </label>
          <label class="campo sel">
            <select aria-label="Sede" (change)="fSede.set($any($event.target).value)">
              <option value="">Todas las sedes</option>
              @for (s of sedes(); track s) { <option [value]="s">{{ s }}</option> }
            </select>
          </label>
          <ion-button (click)="nueva()"><ion-icon slot="start" name="add-outline"></ion-icon>Nuevo rack</ion-button>
        </div>
        <p class="vivo">En vivo · actualizado {{ actualizado() }}</p>

        <div class="grid">
          @for (b of visibles(); track b.idBahia) {
            <div class="rack {{ tono(b.idEstado) }}">
              <span class="pic"><app-veh-icon [tipo]="b.idTipoPermitido" [size]="46"></app-veh-icon></span>
              <div class="info">
                <b>{{ b.codigoIot }}</b>
                <span class="chip e{{ b.idEstado }}">{{ estado(b.idEstado) }}</span>
                <span class="dato"><ion-icon name="location-outline"></ion-icon>{{ sede(b.ubicacion)[0] }}</span>
                @if (sede(b.ubicacion)[1]) { <span class="dato"><ion-icon name="location-outline"></ion-icon>{{ sede(b.ubicacion)[1] }}</span> }
                <span class="dato">• {{ tipo(b.idTipoPermitido) }}</span>
              </div>
              <button class="mas" (click)="acciones(b)" [attr.aria-label]="'Acciones de ' + b.codigoIot"><ion-icon name="ellipsis-vertical"></ion-icon></button>
            </div>
          } @empty {
            <div class="empty" style="grid-column:1/-1"><p>{{ cargado() ? 'Sin bahías con estos filtros.' : 'Cargando…' }}</p></div>
          }
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 26px 24px; }
    .rack { display: flex; gap: 22px; background: #fff; border: 1px solid var(--od-line); border-left: 6px solid var(--od-line); border-radius: 12px; padding: 22px 12px 26px 40px; min-height: 180px; }
    .rack.verde { border-left-color: var(--od-green); } .rack.ambar { border-left-color: var(--od-amber); }
    .rack.azul { border-left-color: var(--od-blue); }   .rack.roja { border-left-color: var(--od-red); }
    .pic { color: #1a1a1a; padding-top: 2px; }
    .info { flex: 1; display: grid; gap: 9px; justify-items: start; align-content: start; }
    .info b { font-size: 14.5px; margin-top: 4px; }
    .info .chip { font-size: 12.5px; padding: 5px 16px; }
    .dato { font-size: 13px; color: var(--od-muted); display: flex; align-items: center; gap: 5px; }
    .dato ion-icon { font-size: 12px; }
    .mas { align-self: flex-start; }
  `],
})
export class RacksPage implements OnDestroy {
  private api = inject(ApiService);
  private ui = inject(UiService);
  private sheet = inject(ActionSheetController);
  private alertCtrl = inject(AlertController);
  private modalCtrl = inject(ModalController);

  private timer?: ReturnType<typeof setInterval>;
  bahias = signal<Bahia[]>([]);
  fEstado = signal<number>(0);
  fTipo = signal<number>(0);
  fSede = signal('');
  texto = signal('');
  cargado = signal(false);
  actualizado = signal('—');

  estados = [
    { id: 1, nombre: 'Disponible', plural: 'Disponibles' },
    { id: 2, nombre: 'Reservada', plural: 'Reservadas' },
    { id: 3, nombre: 'Ocupada', plural: 'Ocupadas' },
    { id: 4, nombre: 'Fuera de servicio', plural: 'Fuera de servicio' },
  ];
  tipos = Object.entries(TIPO_VEHICULO).map(([id, nombre]) => ({ id: +id, nombre }));
  sedes = computed(() => [...new Set(this.bahias().map((b) => partirUbicacion(b.ubicacion)[0]))].sort());
  visibles = computed(() => {
    const q = this.texto().trim().toLowerCase();
    return this.bahias().filter((b) =>
      (!this.fEstado() || b.idEstado === this.fEstado()) &&
      (!this.fTipo() || b.idTipoPermitido === this.fTipo()) &&
      (!this.fSede() || partirUbicacion(b.ubicacion)[0] === this.fSede()) &&
      (!q || b.codigoIot.toLowerCase().includes(q) || b.ubicacion.toLowerCase().includes(q) || this.tipo(b.idTipoPermitido).toLowerCase().includes(q)));
  });

  constructor() { addIcons({ addOutline, searchOutline, locationOutline, ellipsisVertical }); }

  ionViewWillEnter() {
    this.cargar(true);
    this.timer = setInterval(() => this.cargar(false), environment.pollAdminMs); // RNF: cambios visibles en <= 3 s
  }
  ionViewWillLeave() { this.detener(); }
  ngOnDestroy() { this.detener(); }
  private detener() { if (this.timer) clearInterval(this.timer); }

  conteo(id: number) { return this.bahias().filter((b) => b.idEstado === id).length; }
  toggleEstado(id: number) { this.fEstado.set(this.fEstado() === id ? 0 : id); }
  tipo(id: number) { return TIPO_VEHICULO[id] ?? '—'; }
  estado(id: number) { return ESTADO_BAHIA[id] ?? '—'; }
  tono(id: number) { return TONO[id] ?? ''; }
  sede(u: string) { return partirUbicacion(u); }

  cargar(mostrarError: boolean) {
    this.api.bahias().subscribe({
      next: (b) => { this.bahias.set(b); this.cargado.set(true); this.actualizado.set(new Date().toLocaleTimeString('es-CL', { hour12: false })); },
      error: (e) => { if (mostrarError) this.ui.error(e, 'No se pudieron cargar las bahías'); },
    });
  }

  async nueva() {
    const m = await this.modalCtrl.create({ component: BahiaFormComponent });
    await m.present();
    if ((await m.onDidDismiss()).role === 'confirm') { this.ui.ok('Rack creado'); this.cargar(false); }
  }

  async acciones(b: Bahia) {
    const botones: { text: string; role?: string; handler?: () => void }[] = [
      { text: 'Reportar falla (crear ticket)', handler: () => this.crearTicket(b) },
    ];
    if (b.idEstado === EST.DISPONIBLE) botones.push({ text: 'Marcar fuera de servicio', handler: () => this.cambiarEstado(b, EST.FUERA_DE_SERVICIO) });
    if (b.idEstado === EST.FUERA_DE_SERVICIO) botones.push({ text: 'Marcar disponible', handler: () => this.cambiarEstado(b, EST.DISPONIBLE) });
    botones.push({ text: 'Cerrar', role: 'cancel' });
    const s = await this.sheet.create({ header: `${b.codigoIot} · ${this.estado(b.idEstado)}`, buttons: botones });
    await s.present();
  }

  private cambiarEstado(b: Bahia, idEstado: number) {
    this.api.actualizarBahia(b.idBahia, { idEstado }).subscribe({
      next: () => { this.ui.ok('Estado actualizado'); this.cargar(false); },
      error: (e) => this.ui.error(e),
    });
  }

  private async crearTicket(b: Bahia) {
    const a = await this.alertCtrl.create({
      header: `Ticket · ${b.codigoIot}`,
      message: 'Describe la falla. La bahía quedará fuera de servicio.',
      inputs: [{ name: 'desc', type: 'textarea', placeholder: 'Ej: candado trabado', attributes: { maxlength: 255 } }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear ticket',
          handler: (d) => {
            const desc = (d.desc ?? '').trim();
            if (!desc) { this.ui.toast('Escribe una descripción', 'warning'); return false; }
            this.api.crearTicket(b.idBahia, desc).subscribe({
              next: () => { this.ui.ok('Ticket creado'); this.cargar(false); },
              error: (e) => this.ui.error(e),
            });
            return true;
          },
        },
      ],
    });
    await a.present();
  }
}
