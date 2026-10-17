import { Component, computed, inject, signal } from '@angular/core';
import { ActionSheetController, IonButton, IonContent, IonIcon, IonRefresher, IonRefresherContent, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { banOutline, checkmarkCircleOutline, ellipsisVertical, personAddOutline, personOutline, searchOutline } from 'ionicons/icons';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { iniciales } from '../../core/format';
import { ROL, Usuario } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { AdminTopComponent } from '../../shared/admin-top.component';
import { UsuarioFormComponent } from './usuario-form.component';

const ESTADO: Record<string, { nombre: string; clase: string }> = {
  VIGENTE: { nombre: 'Vigente', clase: 'verde' },
  BLOQUEADO: { nombre: 'Bloqueado', clase: 'roja' },
  INACTIVO: { nombre: 'Inactivo', clase: '' },
};

/** Gestión de usuarios (HU-10): resumen, filtros, alta, cambio de rol, bloqueo y desactivación. */
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [AdminTopComponent, IonContent, IonIcon, IonButton, IonRefresher, IonRefresherContent],
  template: `
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>
      <div class="adm">
        <app-admin-top titulo="Gestión de usuarios" bajada="Administra perfiles, roles y permisos de los usuarios institucionales."></app-admin-top>

        <div class="kpis">
          <div class="kpi azul"><span class="tile"><ion-icon name="person-outline"></ion-icon></span><div><b>{{ usuarios().length }}</b><span>Usuarios totales</span></div></div>
          <div class="kpi verde"><span class="tile verde"><ion-icon name="checkmark-circle-outline"></ion-icon></span><div><b>{{ cuenta('VIGENTE') }}</b><span>Vigentes</span></div></div>
          <div class="kpi roja"><span class="tile roja"><ion-icon name="ban-outline"></ion-icon></span><div><b>{{ cuenta('BLOQUEADO') }}</b><span>Bloqueados</span></div></div>
        </div>

        <div class="filtros">
          <label class="campo busca">
            <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
            <input type="search" placeholder="Buscar por nombre o correo…" aria-label="Buscar" (input)="texto.set($any($event.target).value)" />
          </label>
          <label class="campo sel">
            <select aria-label="Rol" (change)="fRol.set(+$any($event.target).value)">
              <option value="0">Todos los roles</option>
              @for (r of roles; track r.id) { <option [value]="r.id">{{ r.nombre }}</option> }
            </select>
          </label>
          <label class="campo sel">
            <select aria-label="Estado" (change)="fEstado.set($any($event.target).value)">
              <option value="">Todos los estados</option>
              @for (e of estados; track e.id) { <option [value]="e.id">{{ e.nombre }}</option> }
            </select>
          </label>
          <ion-button (click)="nuevo()" aria-label="Nuevo usuario"><ion-icon slot="icon-only" name="person-add-outline"></ion-icon></ion-button>
        </div>

        <div class="tabla-caja">
          <table class="tabla">
            <thead><tr><th>Nombre</th><th>Correo institucional</th><th>RUT</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (u of visibles(); track u.idUsuario) {
                <tr>
                  <td><span class="quien"><span class="avatar suave">{{ ini(u.nombreCompleto) }}</span>{{ u.nombreCompleto }}</span></td>
                  <td class="gris">{{ u.emailInstitucional }}</td>
                  <td class="gris">{{ u.rut }}</td>
                  <td>{{ rol(u.idRol) }}</td>
                  <td><span class="chip {{ claseEstado(u.estadoSincronizacion) }}">{{ nombreEstado(u.estadoSincronizacion) }}</span></td>
                  <td><button class="mas" (click)="acciones(u)" [attr.aria-label]="'Acciones de ' + u.nombreCompleto"><ion-icon name="ellipsis-vertical"></ion-icon></button></td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="gris" style="text-align:center">{{ cargado() ? 'Sin resultados.' : 'Cargando…' }}</td></tr>
              }
            </tbody>
          </table>
          <div class="tabla-pie">Mostrando {{ visibles().length }} de {{ usuarios().length }} usuarios</div>
        </div>
      </div>
    </ion-content>
  `,
})
export class UsuariosPage {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private ui = inject(UiService);
  private sheet = inject(ActionSheetController);
  private modalCtrl = inject(ModalController);

  roles = Object.entries(ROL).map(([id, nombre]) => ({ id: +id, nombre }));
  estados = Object.entries(ESTADO).map(([id, e]) => ({ id, nombre: e.nombre }));
  usuarios = signal<Usuario[]>([]);
  texto = signal('');
  fRol = signal(0);
  fEstado = signal('');
  cargado = signal(false);
  visibles = computed(() => {
    const q = this.texto().trim().toLowerCase();
    return this.usuarios().filter((u) =>
      (!this.fRol() || u.idRol === this.fRol()) &&
      (!this.fEstado() || u.estadoSincronizacion === this.fEstado()) &&
      (!q || u.nombreCompleto.toLowerCase().includes(q) || (u.emailInstitucional ?? '').toLowerCase().includes(q) || (u.rut ?? '').toLowerCase().includes(q)));
  });

  constructor() { addIcons({ personOutline, personAddOutline, checkmarkCircleOutline, banOutline, searchOutline, ellipsisVertical }); }
  ionViewWillEnter() { this.cargar(); }

  ini = iniciales;
  rol(id: number) { return ROL[id] ?? '—'; }
  claseEstado(e: string) { return ESTADO[e]?.clase ?? ''; }
  nombreEstado(e: string) { return ESTADO[e]?.nombre ?? e; }
  cuenta(e: string) { return this.usuarios().filter((u) => u.estadoSincronizacion === e).length; }

  cargar() {
    this.api.usuarios().subscribe({
      next: (u) => { this.usuarios.set(u); this.cargado.set(true); },
      error: (e) => { this.cargado.set(true); this.ui.error(e, 'No se pudieron cargar los usuarios'); },
    });
  }
  refrescar(ev: CustomEvent) { this.cargar(); setTimeout(() => (ev.target as HTMLIonRefresherElement).complete(), 500); }

  async nuevo() {
    const m = await this.modalCtrl.create({ component: UsuarioFormComponent });
    await m.present();
    if ((await m.onDidDismiss()).role === 'confirm') { this.ui.ok('Usuario creado'); this.cargar(); }
  }

  async acciones(u: Usuario) {
    const esYo = u.idUsuario === this.auth.user()?.idUsuario;
    const botones: { text: string; role?: string; handler?: () => void }[] = Object.entries(ROL)
      .filter(([id]) => +id !== u.idRol)
      .map(([id, nombre]) => ({ text: `Cambiar rol a ${nombre}`, handler: () => this.actualizar(u, { idRol: +id }, 'Rol actualizado') }));
    if (!esYo) {
      if (u.estadoSincronizacion === 'VIGENTE') botones.push({ text: 'Bloquear acceso', handler: () => this.actualizar(u, { estadoSincronizacion: 'BLOQUEADO' }, 'Usuario bloqueado') });
      else botones.push({ text: 'Habilitar acceso', handler: () => this.actualizar(u, { estadoSincronizacion: 'VIGENTE' }, 'Usuario habilitado') });
      if (u.estadoSincronizacion !== 'INACTIVO') botones.push({ text: 'Desactivar usuario', role: 'destructive', handler: () => this.desactivar(u) });
    }
    botones.push({ text: 'Cerrar', role: 'cancel' });
    const s = await this.sheet.create({ header: u.nombreCompleto, buttons: botones });
    await s.present();
  }

  private actualizar(u: Usuario, cambios: { idRol?: number; estadoSincronizacion?: string }, msg: string) {
    this.api.actualizarUsuario(u.idUsuario, cambios).subscribe({
      next: () => { this.ui.ok(msg); this.cargar(); },
      error: (e) => this.ui.error(e),
    });
  }

  private async desactivar(u: Usuario) {
    if (!(await this.ui.confirmar('Desactivar usuario', `${u.nombreCompleto} no podrá volver a ingresar. Su historial se conserva.`, 'Desactivar', true))) return;
    this.api.eliminarUsuario(u.idUsuario).subscribe({
      next: () => { this.ui.ok('Usuario desactivado'); this.cargar(); },
      error: (e) => this.ui.error(e),
    });
  }
}
