import { Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { addIcons } from 'ionicons';
import { analyticsOutline, checkmarkOutline, personOutline, trendingUpOutline } from 'ionicons/icons';
import { ApiService } from '../../core/api.service';
import { fechaHora } from '../../core/format';
import { Bahia, EST, EmbedToken, Usuario } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { AdminTopComponent } from '../../shared/admin-top.component';

@Component({
  selector: 'app-analitica',
  standalone: true,
  imports: [AdminTopComponent, IonContent, IonIcon, IonSpinner, IonButton],
  template: `
    <ion-content>
      <div class="adm">
        <app-admin-top titulo="Analítica de OmniDock" bajada="Visualiza los indicadores históricos y operacionales de la plataforma."></app-admin-top>

        <div class="panel">
          <div class="banda">
            <div><div class="nombre">Omni<span>Dock</span></div><div class="lema">Dashboard de uso y ocupación</div></div>
            <div class="act">Última actualización: {{ actualizado() }}</div>
          </div>

          <!-- Indicadores en vivo, calculados con la API. El detalle histórico viene del reporte de Power BI. -->
          <div class="kpis">
            <div class="kpi azul"><span class="tile"><ion-icon name="trending-up-outline"></ion-icon></span><div><b>{{ ocupacion() }}%</b><span>Tasa de ocupación</span></div></div>
            <div class="kpi azul"><span class="tile"><ion-icon name="person-outline"></ion-icon></span><div><b>{{ vigentes() }}</b><span>Usuarios vigentes</span></div></div>
            <div class="kpi verde"><span class="tile verde"><ion-icon name="checkmark-outline"></ion-icon></span><div><b>{{ operativas() }}</b><span>Bahías operativas</span></div></div>
          </div>

          <div class="reporte-caja">
            @if (cargando()) {
              <div class="empty"><ion-spinner></ion-spinner><p>Cargando dashboard…</p></div>
            } @else if (error()) {
              <div class="empty">
                <ion-icon name="analytics-outline"></ion-icon>
                <p>{{ error() }}</p>
                <ion-button (click)="cargar()">Reintentar</ion-button>
              </div>
            }
            @if (urlPublicada(); as url) {
              <iframe class="reporte" [src]="url" title="Dashboard Power BI" allowfullscreen></iframe>
            }
            <div #contenedor class="reporte" [hidden]="!conToken()"></div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .panel { background: #fff; border: 1px solid var(--od-line); border-radius: 14px; overflow: hidden; }
    .banda { background: var(--od-navy); color: #fff; padding: 18px 30px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .nombre { font-size: 27px; font-weight: 600; letter-spacing: -.5px; } .nombre span { color: #2f8bff; }
    .lema { font-size: 12.5px; margin-top: 4px; } .act { font-size: 11.5px; }
    .kpis { padding: 22px 28px 0; margin-bottom: 0; }
    .reporte-caja { margin: 22px 28px 28px; border: 1px solid var(--od-line); border-radius: 12px; min-height: 420px; overflow: hidden; display: grid; }
    .reporte { width: 100%; height: 560px; border: 0; display: block; }
    .reporte[hidden] { display: none; }
  `],
})
export class AnaliticaPage implements OnDestroy {
  private api = inject(ApiService);
  private ui = inject(UiService);
  private san = inject(DomSanitizer);

  @ViewChild('contenedor') contenedor?: ElementRef<HTMLDivElement>;

  cargando = signal(true);
  bahias = signal<Bahia[]>([]);
  usuarios = signal<Usuario[]>([]);
  actualizado = signal('—');
  /** Porcentaje de bahías reservadas u ocupadas ahora. */
  ocupacion = computed(() => {
    const b = this.bahias();
    return b.length ? Math.round((100 * b.filter((x) => x.idEstado === EST.RESERVADA || x.idEstado === EST.OCUPADA).length) / b.length) : 0;
  });
  operativas = computed(() => this.bahias().filter((b) => b.idEstado !== EST.FUERA_DE_SERVICIO).length);
  vigentes = computed(() => this.usuarios().filter((u) => u.estadoSincronizacion === 'VIGENTE').length);
  error = signal('');
  urlPublicada = signal<SafeResourceUrl | null>(null);
  conToken = signal(false);
  // Servicio de powerbi-client (se carga bajo demanda para no pesar en el resto de la app)
  private pbi: { reset(el: HTMLElement): void } | null = null;

  constructor() { addIcons({ analyticsOutline, trendingUpOutline, personOutline, checkmarkOutline }); }

  ionViewWillEnter() { this.cargar(); this.cargarIndicadores(); }

  private cargarIndicadores() {
    forkJoin({ b: this.api.bahias(), u: this.api.usuarios() }).subscribe({
      next: ({ b, u }) => {
        this.bahias.set(b); this.usuarios.set(u);
        this.actualizado.set(fechaHora(new Date().toISOString()));
      },
      error: (e) => this.ui.error(e, 'No se pudieron cargar los indicadores'),
    });
  }
  ngOnDestroy() { this.limpiar(); }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.limpiar();
    this.api.embedToken().subscribe({
      next: (r) => this.mostrar(r),
      error: (e) => { this.cargando.set(false); this.error.set(this.ui.mensaje(e, 'No se pudo obtener el dashboard')); },
    });
  }

  private async mostrar(r: EmbedToken) {
    if (!r.embedToken) {
      // Modo "publicado": la URL ya trae el acceso, se muestra en un iframe
      this.urlPublicada.set(this.san.bypassSecurityTrustResourceUrl(r.embedUrl));
      this.cargando.set(false);
      return;
    }
    // Modo "embedded": token de Azure AD + powerbi-client
    try {
      const pbi = await import('powerbi-client');
      const servicio = new pbi.service.Service(pbi.factories.hpmFactory, pbi.factories.wpmpFactory, pbi.factories.routerFactory);
      this.conToken.set(true);
      this.cargando.set(false);
      await new Promise((res) => setTimeout(res)); // espera a que el contenedor sea visible
      servicio.embed(this.contenedor!.nativeElement, {
        type: 'report',
        id: r.reportId,
        embedUrl: r.embedUrl,
        accessToken: r.embedToken,
        tokenType: pbi.models.TokenType.Embed,
        settings: { panes: { filters: { visible: false } } },
      });
      this.pbi = servicio;
    } catch {
      this.cargando.set(false);
      this.error.set('No se pudo renderizar el reporte de Power BI');
    }
  }

  private limpiar() {
    if (this.pbi && this.contenedor) this.pbi.reset(this.contenedor.nativeElement);
    this.pbi = null;
    this.urlPublicada.set(null);
    this.conToken.set(false);
  }
}
