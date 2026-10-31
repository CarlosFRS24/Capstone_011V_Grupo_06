import { Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline, banOutline, calendarOutline, checkmarkOutline, hourglassOutline, peopleOutline, personOutline,
  timeOutline, trendingUpOutline,
} from 'ionicons/icons';
import { ApiService } from '../../core/api.service';
import { fechaHora } from '../../core/format';
import { Bahia, Conteo, EST, EmbedToken, ResumenAnalitica, Usuario } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { AdminTopComponent } from '../../shared/admin-top.component';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
/** "2026-09-14" -> "14 sep" (sin pasar por Date para no correr el día por la zona horaria) */
const diaMes = (f?: string) => (f ? `${+f.slice(8, 10)} ${MESES[+f.slice(5, 7) - 1]}` : '—');

/** Colores y nombres de cada estado en las barras apiladas */
const ESTADOS_RESERVA: Record<string, [string, string]> = {
  CONCRETADA: ['Llegó (concretada)', 'var(--od-green)'], EXPIRADA: ['Venció sin llegar', 'var(--od-red)'],
  CANCELADA: ['Cancelada', '#94a3b8'], PENDIENTE: ['Pendiente', 'var(--od-amber)'],
};
const ESTADOS_ESPERA: Record<string, [string, string]> = {
  CONFIRMADA: ['Confirmó la bahía', 'var(--od-green)'], VENCIDA: ['No confirmó a tiempo', 'var(--od-red)'],
  CANCELADA: ['Salió de la lista', '#94a3b8'], ESPERANDO: ['Esperando', 'var(--od-amber)'], OFRECIDA: ['Con oferta', 'var(--od-blue)'],
};

// Tamaño del gráfico de evolución (unidades del viewBox; se escala al ancho de la tarjeta)
const W = 720, H = 220, IZQ = 40, DER = 26, ARR = 12, ABA = 26;

@Component({
  selector: 'app-analitica',
  standalone: true,
  imports: [AdminTopComponent, IonContent, IonIcon, IonSpinner, NgTemplateOutlet],
  template: `
    <ion-content>
      <div class="adm">
        <app-admin-top titulo="Analítica de OmniDock" bajada="Visualiza los indicadores históricos y operacionales de la plataforma."></app-admin-top>

        <div class="panel">
          <div class="banda">
            <div><div class="nombre">Omni<span>Dock</span></div><div class="lema">Dashboard de uso y ocupación</div></div>
            <div class="act">Última actualización: {{ actualizado() }}</div>
          </div>

          <!-- Ahora: indicadores en vivo -->
          <h3 class="seccion">Ahora</h3>
          <div class="kpis">
            <div class="kpi azul"><span class="tile"><ion-icon name="trending-up-outline"></ion-icon></span><div><b>{{ ocupacion() }}%</b><span>Tasa de ocupación</span></div></div>
            <div class="kpi azul"><span class="tile"><ion-icon name="person-outline"></ion-icon></span><div><b>{{ vigentes() }}</b><span>Usuarios vigentes</span></div></div>
            <div class="kpi verde"><span class="tile verde"><ion-icon name="checkmark-outline"></ion-icon></span><div><b>{{ operativas() }}</b><span>Bahías operativas</span></div></div>
          </div>

          <!-- Histórico: gráficos propios con las vistas de BI -->
          <div class="cabeza">
            <div>
              <h3 class="seccion">Histórico</h3>
              @if (r(); as d) { <p class="rango">{{ d.desde ? 'Datos del ' + dm(d.desde) + ' al ' + dm(d.hasta) : 'Sin datos en este período' }}</p> }
            </div>
            <div class="periodos" role="group" aria-label="Período">
              @for (p of periodos; track p.dias) {
                <button [class.sel]="dias() === p.dias" (click)="cambiarPeriodo(p.dias)">{{ p.nombre }}</button>
              }
            </div>
          </div>

          @if (cargando()) {
            <div class="empty"><ion-spinner></ion-spinner><p>Cargando indicadores…</p></div>
          } @else {
           @if (r(); as d) {
            <div class="kpis">
              <div class="kpi azul"><span class="tile"><ion-icon name="calendar-outline"></ion-icon></span><div><b>{{ d.indicadores.reservas }}</b><span>Reservas · {{ d.indicadores.pctConcretadas }}% llegó</span></div></div>
              <div class="kpi roja"><span class="tile roja"><ion-icon name="alert-circle-outline"></ion-icon></span><div><b>{{ d.indicadores.faltas }}</b><span>Faltas · {{ d.indicadores.pctFaltas }}% de las reservas</span></div></div>
              <div class="kpi"><span class="tile gris"><ion-icon name="time-outline"></ion-icon></span><div><b>{{ min(d.indicadores.minutosUsoPromedio) }}</b><span>Uso promedio de una bahía</span></div></div>
              <div class="kpi"><span class="tile gris"><ion-icon name="hourglass-outline"></ion-icon></span><div><b>{{ min(d.indicadores.minutosLlegadaPromedio) }}</b><span>Llegada después de reservar</span></div></div>
              <div class="kpi ambar"><span class="tile ambar"><ion-icon name="people-outline"></ion-icon></span><div><b>{{ d.indicadores.esperas }}</b><span>En lista de espera · {{ d.indicadores.pctEsperaConfirmada }}% confirmó</span></div></div>
              <div class="kpi"><span class="tile roja"><ion-icon name="ban-outline"></ion-icon></span><div><b>{{ d.indicadores.usuariosBloqueados }}</b><span>Usuarios sin poder reservar hoy</span></div></div>
            </div>

            <div class="graficos">
              <!-- 1. Evolución -->
              <section class="graf ancho">
                <h4>Reservas, usos y faltas por {{ d.agrupacion === 'DIA' ? 'día' : 'semana' }}</h4>
                <div class="leyenda">
                  <span><i style="background:var(--od-blue)"></i>Reservas</span>
                  <span><i style="background:var(--od-green)"></i>Usos</span>
                  <span><i style="background:var(--od-red)"></i>Faltas</span>
                </div>
                @if (d.serie.length) {
                  <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="linea" role="img" aria-label="Evolución de reservas, usos y faltas">
                    @for (g of evo().grilla; track g.y) {
                      <line [attr.x1]="IZQ" [attr.x2]="W - DER" [attr.y1]="g.y" [attr.y2]="g.y" class="grilla"></line>
                      <text [attr.x]="IZQ - 6" [attr.y]="g.y + 4" text-anchor="end" class="eje">{{ g.v }}</text>
                    }
                    @for (e of evo().ejeX; track e.x) {
                      <text [attr.x]="e.x" [attr.y]="H - 6" text-anchor="middle" class="eje">{{ e.t }}</text>
                    }
                    <polyline [attr.points]="evo().reservas" class="l azul"></polyline>
                    <polyline [attr.points]="evo().usos" class="l verde"></polyline>
                    <polyline [attr.points]="evo().faltas" class="l roja"></polyline>
                    @for (p of evo().puntos; track p.x) {
                      <rect [attr.x]="p.x - p.ancho / 2" [attr.y]="ARR" [attr.width]="p.ancho" [attr.height]="H - ARR - ABA" class="zona">
                        <title>{{ p.titulo }}</title>
                      </rect>
                    }
                  </svg>
                } @else { <p class="vacio">Sin datos en este período.</p> }
              </section>

              <!-- 2. Por hora -->
              <section class="graf">
                <h4>Usos según hora de llegada</h4>
                <div class="barras">
                  @for (c of d.usoPorHora; track c.etiqueta) {
                    <div class="col" [title]="c.etiqueta + ':00 · ' + c.valor + ' usos'">
                      <div class="barra" [style.height.%]="alto(c.valor, d.usoPorHora)"></div>
                      <small>{{ c.etiqueta }}</small>
                    </div>
                  }
                </div>
              </section>

              <!-- 3. Por día de la semana -->
              <section class="graf">
                <h4>Usos por día de la semana</h4>
                <div class="barras">
                  @for (c of d.usoPorDia; track c.etiqueta) {
                    <div class="col" [title]="c.etiqueta + ' · ' + c.valor + ' usos'">
                      <span class="num">{{ c.valor }}</span>
                      <div class="barra verde" [style.height.%]="alto(c.valor, d.usoPorDia)"></div>
                      <small>{{ c.etiqueta }}</small>
                    </div>
                  }
                </div>
              </section>

              <!-- 4. Sector y tipo -->
              <section class="graf">
                <h4>Usos por sector y tipo de bahía</h4>
                @for (s of d.porSector; track s.sector + s.tipo) {
                  <div class="hbarra">
                    <div class="txt"><b>{{ s.sector }}</b> · {{ nombreTipo(s.tipo) }} <span>({{ s.bahias }} bahías)</span></div>
                    <div class="pista"><div class="relleno" [style.width.%]="ancho(s.usos)"></div></div>
                    <div class="txt der">{{ s.usos }} usos · {{ porBahia(s.usos, s.bahias) }} por bahía</div>
                  </div>
                } @empty { <p class="vacio">Sin bahías.</p> }
              </section>

              <!-- 5 y 6. Estados apilados -->
              <section class="graf">
                <h4>¿Qué pasó con las reservas?</h4>
                <ng-container *ngTemplateOutlet="apilada; context: { $implicit: d.estadosReserva, nombres: ESTADOS_RESERVA }"></ng-container>
                <h4 class="sep">¿Qué pasó con la lista de espera?</h4>
                <ng-container *ngTemplateOutlet="apilada; context: { $implicit: d.listaEspera, nombres: ESTADOS_ESPERA }"></ng-container>
                @if (d.indicadores.minutosEsperaPromedio != null) {
                  <p class="nota-graf">Espera promedio hasta que se le ofreció una bahía: <b>{{ min(d.indicadores.minutosEsperaPromedio) }}</b></p>
                }
              </section>

              <!-- 7. Top bahías -->
              <section class="graf ancho">
                <h4>Bahías más usadas</h4>
                @if (d.topBahias.length) {
                  <table class="top">
                    <thead><tr><th>Bahía</th><th>Sector</th><th>Usos</th><th>Uso promedio</th></tr></thead>
                    <tbody>
                      @for (b of d.topBahias; track b.codigoIot) {
                        <tr><td><b>{{ b.codigoIot }}</b></td><td>{{ b.sector }}</td><td>{{ b.usos }}</td><td>{{ min(b.minutosPromedio) }}</td></tr>
                      }
                    </tbody>
                  </table>
                } @else { <p class="vacio">Sin usos en este período.</p> }
              </section>
            </div>
           } @else {
            <div class="empty"><ion-icon name="alert-circle-outline"></ion-icon><p>No se pudieron cargar los indicadores.</p></div>
           }
          }

          <!-- Informe de Power BI: solo aparece si el backend tiene configurado el embebido (PBI_EMBED_URL o modo embedded) -->
          @if (hayPowerBi()) {
            <h3 class="seccion">Informe de Power BI</h3>
            <div class="reporte-caja">
              @if (urlPublicada(); as url) {
                <iframe class="reporte" [src]="url" title="Dashboard Power BI" allowfullscreen></iframe>
              }
              <div #contenedor class="reporte" [hidden]="!conToken()"></div>
            </div>
          } @else {
            <p class="pie">El análisis histórico completo se revisa en Power BI.</p>
          }
        </div>
      </div>

      <ng-template #apilada let-lista let-nombres="nombres">
        @if (total(lista) > 0) {
          <div class="apilada">
            @for (c of lista; track c.etiqueta) {
              @if (c.valor > 0) {
                <div [style.width.%]="100 * c.valor / total(lista)" [style.background]="nombres[c.etiqueta]?.[1]"
                     [title]="(nombres[c.etiqueta]?.[0] ?? c.etiqueta) + ': ' + c.valor"></div>
              }
            }
          </div>
          <div class="leyenda">
            @for (c of lista; track c.etiqueta) {
              @if (c.valor > 0) {
                <span><i [style.background]="nombres[c.etiqueta]?.[1]"></i>{{ nombres[c.etiqueta]?.[0] ?? c.etiqueta }}: <b>{{ c.valor }}</b> ({{ pct(c.valor, total(lista)) }}%)</span>
              }
            }
          </div>
        } @else { <p class="vacio">Sin registros en este período.</p> }
      </ng-template>
    </ion-content>
  `,
  styles: [`
    .panel { background: #fff; border: 1px solid var(--od-line); border-radius: 14px; overflow: hidden; padding-bottom: 8px; }
    .banda { background: var(--od-navy); color: #fff; padding: 18px 30px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .nombre { font-size: 27px; font-weight: 600; letter-spacing: -.5px; } .nombre span { color: #2f8bff; }
    .lema { font-size: 12.5px; margin-top: 4px; } .act { font-size: 11.5px; }
    .seccion { font-size: 15px; font-weight: 700; color: var(--od-ink); margin: 22px 28px 12px; }
    .kpis { padding: 0 28px; margin-bottom: 0; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
    .kpi span { line-height: 1.3; }
    .tile.ambar { background: var(--od-amber-soft); color: var(--od-amber); }
    .cabeza { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-right: 28px; }
    .cabeza .seccion { margin-bottom: 2px; }
    .rango { margin: 0 28px 12px; font-size: 12.5px; color: var(--od-muted); }
    .periodos { margin-left: 28px; display: inline-flex; border: 1px solid var(--od-line); border-radius: 10px; overflow: hidden; margin-bottom: 12px; }
    .periodos button { background: #fff; border: 0; padding: 8px 14px; font: inherit; font-size: 13px; color: var(--od-muted); cursor: pointer; }
    .periodos button + button { border-left: 1px solid var(--od-line); }
    .periodos button.sel { background: var(--od-blue); color: #fff; font-weight: 600; }
    .graficos { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; padding: 18px 28px 6px; }
    .graf { border: 1px solid var(--od-line); border-radius: 12px; padding: 16px 18px; min-width: 0; }
    .graf.ancho { grid-column: 1 / -1; }
    .graf h4 { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: var(--od-ink); }
    .graf h4.sep { margin-top: 22px; }
    .leyenda { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: var(--od-muted); margin: 8px 0 4px; }
    .leyenda i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
    .linea { width: 100%; height: auto; display: block; }
    .linea .grilla { stroke: var(--od-line); stroke-width: 1; }
    .linea .eje { font-size: 11px; fill: var(--od-muted); }
    .linea .l { fill: none; stroke-width: 2.2; stroke-linejoin: round; stroke-linecap: round; }
    .linea .l.azul { stroke: var(--od-blue); } .linea .l.verde { stroke: var(--od-green); } .linea .l.roja { stroke: var(--od-red); }
    .linea .zona { fill: transparent; } .linea .zona:hover { fill: rgba(11, 107, 255, .07); }
    .barras { display: flex; align-items: flex-end; gap: 4px; height: 180px; padding-top: 18px; }
    .col { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; min-width: 0; }
    .col .barra { width: 100%; max-width: 38px; background: var(--od-blue); border-radius: 4px 4px 0 0; min-height: 2px; }
    .col .barra.verde { background: var(--od-green); }
    .col small { font-size: 10.5px; color: var(--od-muted); }
    .col .num { font-size: 11px; color: var(--od-ink); font-weight: 600; }
    .hbarra { display: grid; gap: 4px; margin-bottom: 14px; font-size: 12.5px; color: var(--od-ink); }
    .hbarra span, .hbarra .der { color: var(--od-muted); }
    .pista { background: var(--od-bg); border-radius: 6px; height: 12px; overflow: hidden; }
    .relleno { background: var(--od-blue); height: 100%; border-radius: 6px; }
    .apilada { display: flex; height: 22px; border-radius: 6px; overflow: hidden; background: var(--od-bg); }
    .nota-graf { font-size: 12.5px; color: var(--od-muted); margin: 12px 0 0; }
    .vacio { font-size: 13px; color: var(--od-muted); margin: 8px 0; }
    table.top { width: 100%; border-collapse: collapse; font-size: 13px; }
    .top th { text-align: left; font-weight: 600; color: var(--od-muted); font-size: 12px; padding: 6px 8px; }
    .top td { padding: 10px 8px; border-top: 1px solid var(--od-line); color: var(--od-ink); }
    .pie { font-size: 12px; color: var(--od-muted); margin: 14px 28px 14px; }
    .reporte-caja { margin: 0 28px 20px; border: 1px solid var(--od-line); border-radius: 12px; min-height: 420px; overflow: hidden; display: grid; }
    .reporte { width: 100%; height: 560px; border: 0; display: block; }
    .reporte[hidden] { display: none; }
  `],
})
export class AnaliticaPage implements OnDestroy {
  private api = inject(ApiService);
  private ui = inject(UiService);
  private san = inject(DomSanitizer);

  @ViewChild('contenedor') contenedor?: ElementRef<HTMLDivElement>;

  readonly W = W; readonly H = H; readonly IZQ = IZQ; readonly DER = DER; readonly ARR = ARR; readonly ABA = ABA;
  readonly ESTADOS_RESERVA = ESTADOS_RESERVA; readonly ESTADOS_ESPERA = ESTADOS_ESPERA;
  readonly periodos = [{ dias: 7, nombre: '7 días' }, { dias: 30, nombre: '30 días' }, { dias: 90, nombre: '90 días' }, { dias: 0, nombre: 'Todo' }];
  dm = diaMes;

  // En vivo
  bahias = signal<Bahia[]>([]);
  usuarios = signal<Usuario[]>([]);
  actualizado = signal('—');
  ocupacion = computed(() => {
    const b = this.bahias();
    return b.length ? Math.round((100 * b.filter((x) => x.idEstado === EST.RESERVADA || x.idEstado === EST.OCUPADA).length) / b.length) : 0;
  });
  operativas = computed(() => this.bahias().filter((b) => b.idEstado !== EST.FUERA_DE_SERVICIO).length);
  vigentes = computed(() => this.usuarios().filter((u) => u.estadoSincronizacion === 'VIGENTE').length);

  // Histórico. Parte en "Todo" porque los datos de ejemplo son de junio a septiembre
  dias = signal(0);
  cargando = signal(true);
  r = signal<ResumenAnalitica | null>(null);

  /** Puntos y ejes del gráfico de evolución, ya escalados al viewBox */
  evo = computed(() => {
    const s = this.r()?.serie ?? [];
    const max = Math.max(1, ...s.map((p) => Math.max(p.reservas, p.usos, p.faltas)));
    const tope = this.redondearTope(max);
    const n = s.length;
    const paso = n > 1 ? (W - IZQ - DER) / (n - 1) : 0;
    const x = (i: number) => (n > 1 ? IZQ + i * paso : (IZQ + W - DER) / 2);
    const y = (v: number) => ARR + (H - ARR - ABA) * (1 - v / tope);
    const linea = (k: 'reservas' | 'usos' | 'faltas') => s.map((p, i) => `${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ');
    const cadaX = Math.max(1, Math.ceil(n / 8));
    const semana = this.r()?.agrupacion === 'SEMANA';
    return {
      reservas: linea('reservas'), usos: linea('usos'), faltas: linea('faltas'),
      grilla: [0, 0.5, 1].map((f) => ({ v: Math.round(tope * f), y: y(tope * f) })),
      ejeX: s.map((p, i) => ({ x: x(i), t: diaMes(p.fecha) })).filter((_, i) => i % cadaX === 0),
      puntos: s.map((p, i) => ({
        x: x(i), ancho: Math.max(paso, 8),
        titulo: `${semana ? 'Semana del ' : ''}${diaMes(p.fecha)}: ${p.reservas} reservas, ${p.usos} usos, ${p.faltas} faltas`,
      })),
    };
  });

  /** Mayor número de usos entre sector y tipo, para el ancho de las barras horizontales */
  private maxSector = computed(() => Math.max(1, ...(this.r()?.porSector ?? []).map((s) => s.usos)));

  // Power BI (opcional)
  hayPowerBi = signal(false);
  urlPublicada = signal<SafeResourceUrl | null>(null);
  conToken = signal(false);
  private pbi: { reset(el: HTMLElement): void } | null = null;

  constructor() {
    addIcons({ trendingUpOutline, personOutline, checkmarkOutline, calendarOutline, alertCircleOutline, timeOutline,
      hourglassOutline, peopleOutline, banOutline });
  }

  ionViewWillEnter() {
    this.cargarIndicadores();
    this.cargarResumen();
    this.cargarPowerBi();
  }

  ngOnDestroy() { this.limpiar(); }

  cambiarPeriodo(d: number) {
    if (d === this.dias()) return;
    this.dias.set(d);
    this.cargarResumen();
  }

  private cargarIndicadores() {
    forkJoin({ b: this.api.bahias(), u: this.api.usuarios() }).subscribe({
      next: ({ b, u }) => {
        this.bahias.set(b); this.usuarios.set(u);
        this.actualizado.set(fechaHora(new Date().toISOString()));
      },
      error: (e) => this.ui.error(e, 'No se pudieron cargar los indicadores'),
    });
  }

  private cargarResumen() {
    this.cargando.set(true);
    this.api.resumenAnalitica(this.dias()).subscribe({
      next: (r) => { this.r.set(r); this.cargando.set(false); },
      error: (e) => { this.r.set(null); this.cargando.set(false); this.ui.error(e, 'No se pudieron cargar los gráficos'); },
    });
  }

  // --- ayudas para la plantilla ---
  nombreTipo(t: string) { return t ? t.charAt(0) + t.slice(1).toLowerCase() : ''; }
  min(v?: number | null) { return v == null ? '—' : `${Math.round(v)} min`; }
  total(l: Conteo[]) { return l.reduce((a, c) => a + c.valor, 0); }
  pct(v: number, t: number) { return t ? Math.round((1000 * v) / t) / 10 : 0; }
  alto(v: number, l: Conteo[]) { const m = Math.max(1, ...l.map((c) => c.valor)); return (100 * v) / m; }
  ancho(v: number) { return (100 * v) / this.maxSector(); }
  porBahia(usos: number, bahias: number) { return bahias ? Math.round((10 * usos) / bahias) / 10 : 0; }

  /** Tope "redondo" del eje Y: 7 -> 10, 34 -> 40, 180 -> 200 */
  private redondearTope(max: number) {
    const base = Math.pow(10, Math.floor(Math.log10(max)));
    for (const f of [1, 2, 2.5, 4, 5, 10]) if (f * base >= max) return f * base;
    return 10 * base;
  }

  // --- Power BI: solo se muestra si el backend lo tiene configurado; si no, no se avisa nada ---
  private cargarPowerBi() {
    this.limpiar();
    this.api.embedToken().subscribe({
      next: (r) => this.mostrar(r),
      error: () => this.hayPowerBi.set(false),
    });
  }

  private async mostrar(r: EmbedToken) {
    this.hayPowerBi.set(true);
    if (!r.embedToken) {
      // Modo "publicado": la URL ya trae el acceso, se muestra en un iframe
      this.urlPublicada.set(this.san.bypassSecurityTrustResourceUrl(r.embedUrl));
      return;
    }
    // Modo "embedded": token de Azure AD + powerbi-client
    try {
      const pbi = await import('powerbi-client');
      const servicio = new pbi.service.Service(pbi.factories.hpmFactory, pbi.factories.wpmpFactory, pbi.factories.routerFactory);
      this.conToken.set(true);
      await new Promise((res) => setTimeout(res)); // espera a que el contenedor exista y sea visible
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
      this.hayPowerBi.set(false);
    }
  }

  private limpiar() {
    if (this.pbi && this.contenedor) this.pbi.reset(this.contenedor.nativeElement);
    this.pbi = null;
    this.urlPublicada.set(null);
    this.conToken.set(false);
  }
}
