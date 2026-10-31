import { Component, inject, signal } from '@angular/core';
import { IonContent, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, banOutline, checkmarkCircleOutline, closeCircleOutline, notificationsOutline, timeOutline } from 'ionicons/icons';
import { ApiService } from '../../core/api.service';
import { EstadoService } from '../../core/estado.service';
import { etiquetaDia, hora } from '../../core/format';
import { Notificacion } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { AppHeaderComponent } from '../../shared/app-header.component';

const ICONO: Record<string, { icono: string; tono: string }> = {
  FALTA: { icono: 'alert-circle-outline', tono: 'roja' },
  BLOQUEO: { icono: 'ban-outline', tono: 'roja' },
  DESBLOQUEO: { icono: 'checkmark-circle-outline', tono: 'verde' },
  OFERTA_BAHIA: { icono: 'notifications-outline', tono: 'verde' },
  OFERTA_VENCIDA: { icono: 'time-outline', tono: 'gris' },
  LISTA_CERRADA: { icono: 'time-outline', tono: 'gris' },
  RESERVA_CANCELADA: { icono: 'close-circle-outline', tono: 'gris' },
};

/* Avisos del usuario (faltas, bloqueo, lista de espera, reservas canceladas por mantención). */
@Component({
  selector: 'app-avisos',
  standalone: true,
  imports: [AppHeaderComponent, IonContent, IonIcon, IonRefresher, IonRefresherContent],
  template: `
    <app-header title="Avisos" back="/app/bahias"></app-header>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>
      <div class="app-wrap">
        <h1 class="h1">Avisos</h1>
        <p class="sub">Tus faltas, la lista de espera y cambios en tus reservas.</p>
        @for (n of avisos(); track n.idNotificacion) {
          <div class="od-card fila aviso-item" [class.nuevo]="!n.leida">
            <span class="tile {{ tono(n.tipo) }}"><ion-icon [name]="icono(n.tipo)"></ion-icon></span>
            <div class="crece">
              <p>{{ n.mensaje }}</p>
              <span class="muted">{{ dia(n.fechaCreacion) }} · {{ hora(n.fechaCreacion) }}</span>
            </div>
          </div>
        } @empty {
          <div class="empty">
            <ion-icon name="notifications-outline"></ion-icon>
            <p>{{ cargado() ? 'No tienes avisos.' : 'Cargando…' }}</p>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .aviso-item { align-items: flex-start; margin-top: 12px; }
    .aviso-item p { margin: 0 0 4px; font-size: 13.5px; color: var(--od-ink); }
    .aviso-item.nuevo { border-color: var(--od-blue); }
  `],
})
export class AvisosPage {
  private api = inject(ApiService);
  private ui = inject(UiService);
  private estado = inject(EstadoService);

  avisos = signal<Notificacion[]>([]);
  cargado = signal(false);
  hora = hora;
  dia = etiquetaDia;

  constructor() { addIcons({ alertCircleOutline, banOutline, checkmarkCircleOutline, closeCircleOutline, notificationsOutline, timeOutline }); }

  ionViewWillEnter() { this.cargar(); }

  icono(t: string) { return ICONO[t]?.icono ?? 'notifications-outline'; }
  tono(t: string) { return ICONO[t]?.tono ?? ''; }

  private cargar() {
    this.api.notificaciones().subscribe({
      next: (n) => {
        this.avisos.set(n); this.cargado.set(true);
        // Al verlos quedan leídos (los nuevos siguen marcados en esta pantalla hasta salir)
        if (n.some((x) => !x.leida)) this.api.marcarAvisosLeidos().subscribe({ next: () => this.estado.refrescar() });
      },
      error: (e) => { this.cargado.set(true); this.ui.error(e, 'No se pudieron cargar los avisos'); },
    });
  }

  refrescar(ev: CustomEvent) { this.cargar(); setTimeout(() => (ev.target as HTMLIonRefresherElement).complete(), 500); }
}
