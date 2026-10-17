import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular/standalone';

@Injectable({ providedIn: 'root' })
export class UiService {
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  async toast(message: string, color: 'success' | 'danger' | 'warning' | 'medium' = 'medium') {
    const t = await this.toastCtrl.create({ message, color, duration: 2800, position: 'top' });
    await t.present();
  }
  ok(msg: string) { return this.toast(msg, 'success'); }

  /** Muestra el mensaje que devuelve el backend ({error, mensaje}) o uno genérico. */
  error(e: unknown, fallback = 'Ocurrió un error inesperado') {
    return this.toast(this.mensaje(e, fallback), 'danger');
  }
  mensaje(e: unknown, fallback = 'Ocurrió un error inesperado'): string {
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0) return 'No hay conexión con el servidor';
      return e.error?.mensaje ?? fallback;
    }
    return fallback;
  }

  async confirmar(header: string, message: string, confirmText = 'Confirmar', danger = false): Promise<boolean> {
    return new Promise(async (resolve) => {
      const a = await this.alertCtrl.create({
        header, message,
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(false) },
          { text: confirmText, role: danger ? 'destructive' : 'confirm', handler: () => resolve(true) },
        ],
        backdropDismiss: false,
      });
      await a.present();
    });
  }
}
