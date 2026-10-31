import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { hora } from './format';
import { MiEstado } from './models';
import { UiService } from './ui.service';

/*
  Estado del usuario que la app consulta cada cierto tiempo (faltas, horario, lista de espera y avisos).
  Si mientras espera se le ofrece una bahía, muestra una alerta para confirmarla al tiro.
 */
@Injectable({ providedIn: 'root' })
export class EstadoService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private ui = inject(UiService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  readonly estado = signal<MiEstado | null>(null);
  private timer?: ReturnType<typeof setInterval>;
  private ofertaAvisada?: number;   // idEspera de la última oferta que ya mostramos

  iniciar() {
    if (this.timer) return;
    this.refrescar();
    this.timer = setInterval(() => this.refrescar(), environment.pollEstadoMs);
  }

  detener() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.estado.set(null);
    this.ofertaAvisada = undefined;
  }

  refrescar() {
    if (!this.auth.isLogged()) {   // cerró sesión: se limpia y el timer queda sin hacer nada
      this.estado.set(null);
      this.ofertaAvisada = undefined;
      return;
    }
    this.api.miEstado().subscribe({
      next: (e) => {
        this.estado.set(e);
        const esp = e.espera;
        if (esp?.estadoEspera === 'OFRECIDA' && this.ofertaAvisada !== esp.idEspera) {
          this.ofertaAvisada = esp.idEspera;
          this.avisarOferta(esp.codigoIot ?? '', esp.fechaLimiteOferta);
        }
      },
      error: () => { /* sin conexión: se reintenta en el siguiente ciclo */ },
    });
  }

  private async avisarOferta(codigo: string, limite?: string) {
    const a = await this.alertCtrl.create({
      header: '¡Se liberó una bahía!',
      message: `La bahía ${codigo} quedó guardada para ti hasta las ${hora(limite)}. ¿La reservas?`,
      buttons: [
        { text: 'Ahora no', role: 'cancel' },
        { text: 'Reservar', role: 'confirm', handler: () => { this.confirmarOferta(); } },
      ],
    });
    await a.present();
  }

  /** Confirma la bahía ofrecida por la lista de espera y lleva a la pantalla de la reserva. */
  confirmarOferta(): Promise<boolean> {
    return new Promise((resolve) => {
      this.api.confirmarEspera().subscribe({
        next: () => {
          this.ui.ok('Reserva creada');
          this.refrescar();
          this.router.navigateByUrl('/app/sesion');
          resolve(true);
        },
        error: (e) => { this.ui.error(e, 'No se pudo confirmar la bahía'); this.refrescar(); resolve(false); },
      });
    });
  }
}
