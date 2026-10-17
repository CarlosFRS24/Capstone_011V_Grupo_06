import { Component, computed, inject, signal } from '@angular/core';
import { ActionSheetController, IonButton, IonContent, IonIcon, IonRefresher, IonRefresherContent, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, ellipsisVertical, searchOutline } from 'ionicons/icons';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { fechaHora } from '../../core/format';
import { Bahia, Ticket } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { AdminTopComponent } from '../../shared/admin-top.component';
import { TicketFormComponent } from './ticket-form.component';

const ESTADOS = ['ABIERTO', 'EN_REVISION', 'RESUELTO', 'ANULADO'] as const;
const NOMBRE: Record<string, string> = { ABIERTO: 'Abierto', EN_REVISION: 'En revisión', RESUELTO: 'Resuelto', ANULADO: 'Anulado' };
const CLASE: Record<string, string> = { ABIERTO: 'azul', EN_REVISION: 'ambar', RESUELTO: 'verde', ANULADO: '' };

/** Tickets de mantenimiento (HU-09): resumen, filtros, alta y cambio de estado. */
@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [AdminTopComponent, IonContent, IonIcon, IonButton, IonRefresher, IonRefresherContent],
  template: `
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>
      <div class="adm">
        <app-admin-top titulo="Tickets de mantenimiento" bajada="Gestiona incidencias y solicitudes de mantenimiento del sistema."></app-admin-top>

        <div class="kpis">
          <div class="kpi"><div><b>{{ tickets().length }}</b><span>Total</span></div></div>
          <div class="kpi azul"><div><b>{{ cuenta('ABIERTO') }}</b><span>Abiertos</span></div></div>
          <div class="kpi ambar"><div><b>{{ cuenta('EN_REVISION') }}</b><span>Revisión</span></div></div>
          <div class="kpi verde"><div><b>{{ cuenta('RESUELTO') }}</b><span>Resueltos</span></div></div>
        </div>

        <div class="filtros">
          <label class="campo busca">
            <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
            <input type="search" placeholder="Buscar por ID, rack o descripción…" aria-label="Buscar" (input)="texto.set($any($event.target).value)" />
          </label>
          <label class="campo sel">
            <select aria-label="Estado" (change)="filtro.set($any($event.target).value)">
              <option value="">Todos los estados</option>
              @for (e of estados; track e) { <option [value]="e">{{ nombre(e) }}</option> }
            </select>
          </label>
          <ion-button (click)="nuevo()"><ion-icon slot="start" name="add-outline"></ion-icon>Nuevo ticket</ion-button>
        </div>

        <div class="tabla-caja">
          <table class="tabla">
            <thead><tr><th>ID</th><th>Rack</th><th>Descripción</th><th>Estado</th><th>Fecha de ingreso</th><th>Fecha de resolución</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (t of visibles(); track t.idTicket) {
                <tr>
                  <td>#{{ id(t.idTicket) }}</td>
                  <td>{{ codigo(t.idBahia) }}</td>
                  <td>{{ t.descripcionFalla }}</td>
                  <td><span class="chip {{ clase(t.estadoTicket) }}">{{ nombre(t.estadoTicket) }}</span></td>
                  <td class="gris">{{ fecha(t.fechaReporte) }}</td>
                  <td class="gris">{{ fecha(t.fechaResolucion) }}</td>
                  <td><button class="mas" (click)="acciones(t)" [attr.aria-label]="'Acciones del ticket ' + t.idTicket"><ion-icon name="ellipsis-vertical"></ion-icon></button></td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="gris" style="text-align:center">{{ cargado() ? 'No hay tickets con estos filtros.' : 'Cargando…' }}</td></tr>
              }
            </tbody>
          </table>
          <div class="tabla-pie">Mostrando {{ visibles().length }} de {{ tickets().length }} tickets</div>
        </div>
      </div>
    </ion-content>
  `,
})
export class TicketsPage {
  private api = inject(ApiService);
  private ui = inject(UiService);
  private sheet = inject(ActionSheetController);
  private modalCtrl = inject(ModalController);

  estados = ESTADOS;
  tickets = signal<Ticket[]>([]);
  bahias = signal<Bahia[]>([]);
  filtro = signal<string>('');
  texto = signal('');
  cargado = signal(false);
  visibles = computed(() => {
    const q = this.texto().trim().toLowerCase();
    return this.tickets().filter((t) =>
      (!this.filtro() || t.estadoTicket === this.filtro()) &&
      (!q || this.id(t.idTicket).includes(q) || this.codigo(t.idBahia).toLowerCase().includes(q) || t.descripcionFalla.toLowerCase().includes(q)));
  });

  constructor() { addIcons({ addOutline, searchOutline, ellipsisVertical }); }
  ionViewWillEnter() { this.cargar(); }

  nombre(e: string) { return NOMBRE[e] ?? e; }
  clase(e: string) { return CLASE[e] ?? ''; }
  id(n: number) { return String(n).padStart(4, '0'); }
  fecha = fechaHora;
  cuenta(e: string) { return this.tickets().filter((t) => t.estadoTicket === e).length; }
  codigo(idBahia: number) { return this.bahias().find((b) => b.idBahia === idBahia)?.codigoIot ?? `Bahía #${idBahia}`; }

  cargar() {
    forkJoin({ t: this.api.tickets(), b: this.api.bahias() }).subscribe({
      next: ({ t, b }) => {
        this.tickets.set([...t].sort((x, y) => y.idTicket - x.idTicket));
        this.bahias.set(b);
        this.cargado.set(true);
      },
      error: (e) => { this.cargado.set(true); this.ui.error(e, 'No se pudieron cargar los tickets'); },
    });
  }
  refrescar(ev: CustomEvent) { this.cargar(); setTimeout(() => (ev.target as HTMLIonRefresherElement).complete(), 500); }

  async nuevo() {
    const m = await this.modalCtrl.create({ component: TicketFormComponent, componentProps: { bahias: this.bahias() } });
    await m.present();
    if ((await m.onDidDismiss()).role === 'confirm') { this.ui.ok('Ticket creado'); this.cargar(); }
  }

  async acciones(t: Ticket) {
    const botones = ESTADOS.filter((e) => e !== t.estadoTicket).map((e) => ({
      text: `Pasar a ${NOMBRE[e]}`,
      role: e === 'ANULADO' ? 'destructive' : undefined,
      handler: () => this.cambiar(t, e),
    }));
    const s = await this.sheet.create({
      header: `Ticket #${this.id(t.idTicket)}`,
      subHeader: 'Al resolver o anular, la bahía vuelve a estar disponible si no tiene otros tickets abiertos.',
      buttons: [...botones, { text: 'Cerrar', role: 'cancel' }],
    });
    await s.present();
  }

  private cambiar(t: Ticket, estado: string) {
    this.api.actualizarTicket(t.idTicket, estado).subscribe({
      next: () => { this.ui.ok('Ticket actualizado'); this.cargar(); },
      error: (e) => this.ui.error(e),
    });
  }
}
