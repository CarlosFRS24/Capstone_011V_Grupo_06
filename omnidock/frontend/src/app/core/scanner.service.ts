import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  BarcodeFormat, BarcodeScanner, GoogleBarcodeScannerModuleInstallState,
} from '@capacitor-mlkit/barcode-scanning';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular/standalone';
import { QrCamaraComponent } from '../shared/qr-camara.component';

/**
 * Lectura del QR del rack. El QR contiene el código IoT de la bahía (ej. "RACK-BICI-01").
 *  - App instalada (Android/iOS): escáner nativo de ML Kit.
 *  - Navegador: cámara del PC o del celular con getUserMedia + jsQR (requiere localhost o https).
 *  - Si no hay cámara o el usuario lo prefiere: ingreso manual del código.
 */
@Injectable({ providedIn: 'root' })
export class ScannerService {
  private alertCtrl = inject(AlertController);
  private modalCtrl = inject(ModalController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  /** true si se puede intentar usar una cámara (app nativa, o navegador en contexto seguro). */
  get hayCamara(): boolean {
    if (Capacitor.isNativePlatform()) return true;
    return window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;
  }

  /** Devuelve el código leído, o null si el usuario canceló. */
  async escanear(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) return this.escanearNativo();
    if (this.hayCamara) return this.escanearWeb();
    return this.pedirCodigo();
  }

  // ---------- App nativa (ML Kit) ----------

  private async escanearNativo(): Promise<string | null> {
    const { supported } = await BarcodeScanner.isSupported();
    if (!supported) return this.pedirCodigo();

    if (Capacitor.getPlatform() === 'android') {
      // En Android, scan() usa el escáner de Google Play Services: no pide permiso de cámara,
      // pero necesita un módulo que se descarga la primera vez.
      await this.asegurarModuloGoogle();
    } else {
      const perm = await BarcodeScanner.requestPermissions();
      if (perm.camera !== 'granted' && perm.camera !== 'limited') {
        throw new Error('Debes permitir el uso de la cámara en los ajustes del teléfono');
      }
    }

    try {
      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
      return barcodes[0]?.rawValue?.trim() || null;
    } catch (e) {
      // Cerrar el escáner sin leer nada no es un error
      if (/cancel/i.test((e as Error)?.message ?? '')) return null;
      throw e;
    }
  }

  /** Descarga el módulo del escáner de Google si falta y espera a que quede instalado. */
  private async asegurarModuloGoogle(): Promise<void> {
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (available) return;

    const loading = await this.loadingCtrl.create({ message: 'Preparando el escáner (solo la primera vez)…' });
    await loading.present();
    try {
      await new Promise<void>(async (resolve, reject) => {
        const limite = setTimeout(() => fin(new Error('La descarga del escáner tardó demasiado. Revisa tu conexión.')), 90000);
        const handle = await BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', (ev) => {
          if (ev.progress != null) loading.message = `Preparando el escáner… ${ev.progress}%`;
          if (ev.state === GoogleBarcodeScannerModuleInstallState.COMPLETED) fin();
          if (ev.state === GoogleBarcodeScannerModuleInstallState.FAILED
            || ev.state === GoogleBarcodeScannerModuleInstallState.CANCELED) {
            fin(new Error('No se pudo instalar el escáner de Google'));
          }
        });
        function fin(err?: Error) {
          clearTimeout(limite);
          handle.remove();
          err ? reject(err) : resolve();
        }
        try { await BarcodeScanner.installGoogleBarcodeScannerModule(); }
        catch (e) {
          // Si ya estaba instalándose o quedó instalado entre medio, seguimos esperando el evento
          const { available: ya } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
          if (ya) fin(); else if (!/already/i.test((e as Error)?.message ?? '')) fin(e as Error);
        }
      });
    } finally {
      await loading.dismiss();
    }
  }

  // ---------- Navegador ----------

  private async escanearWeb(): Promise<string | null> {
    const modal = await this.modalCtrl.create({ component: QrCamaraComponent });
    await modal.present();
    const { data } = await modal.onWillDismiss<{ codigo?: string; manual?: boolean; error?: string }>();
    if (data?.codigo) return data.codigo;
    if (data?.error) {
      const t = await this.toastCtrl.create({ message: `${data.error}. Ingresa el código a mano.`, color: 'warning', duration: 2800, position: 'top' });
      await t.present();
      return this.pedirCodigo();
    }
    if (data?.manual) return this.pedirCodigo();
    return null;
  }

  /** Ingreso manual del código, para cuando no hay cámara o el QR no se puede leer. */
  async pedirCodigo(): Promise<string | null> {
    return new Promise(async (resolve) => {
      const a = await this.alertCtrl.create({
        header: 'Ingresar código',
        message: 'Escribe el código que aparece en el rack (ej. RACK-BICI-01).',
        inputs: [{ name: 'codigo', type: 'text', placeholder: 'RACK-BICI-01' }],
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(null) },
          { text: 'Leer', handler: (d) => resolve((d.codigo ?? '').trim() || null) },
        ],
        backdropDismiss: false,
      });
      await a.present();
    });
  }
}
