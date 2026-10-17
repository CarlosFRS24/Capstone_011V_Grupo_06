import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { IonButton, IonContent, IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, keypadOutline } from 'ionicons/icons';

/**
 * Lector de QR con la cámara del navegador (PC o celular en el navegador).
 * Usa getUserMedia + jsQR. Se abre como modal desde ScannerService.
 * Al cerrar devuelve: { codigo } si leyó un QR, { manual: true } si el usuario prefiere escribirlo,
 * { error } si no se pudo abrir la cámara, o nada si canceló.
 */
@Component({
  selector: 'app-qr-camara',
  standalone: true,
  imports: [IonContent, IonButton, IonIcon],
  template: `
    <ion-content class="qr-fondo">
      <div class="qr-wrap">
        <h2>Escanear QR del rack</h2>
        <p>{{ estado() }}</p>
        <div class="qr-visor">
          <video #video playsinline muted></video>
          <span class="qr-marco"></span>
        </div>
        <ion-button expand="block" fill="outline" color="light" (click)="cerrar({ manual: true })">
          <ion-icon slot="start" name="keypad-outline"></ion-icon>Ingresar código a mano
        </ion-button>
        <ion-button expand="block" fill="clear" color="light" (click)="cerrar()">
          <ion-icon slot="start" name="close-outline"></ion-icon>Cancelar
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .qr-fondo { --background: #0f1b2b; }
    .qr-wrap { max-width: 420px; margin: 0 auto; padding: 28px 20px; color: #fff; text-align: center; }
    h2 { margin: 0 0 6px; font-size: 19px; }
    p { margin: 0 0 16px; font-size: 13px; opacity: .8; min-height: 18px; }
    .qr-visor { position: relative; width: 100%; aspect-ratio: 1; border-radius: 14px; overflow: hidden; background: #000; margin-bottom: 18px; }
    video { width: 100%; height: 100%; object-fit: cover; }
    .qr-marco { position: absolute; inset: 16%; border: 3px solid #fff; border-radius: 12px; box-shadow: 0 0 0 999px rgba(0,0,0,.35); }
  `],
})
export class QrCamaraComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  private modal = inject(ModalController);

  estado = signal('Abriendo la cámara…');
  private stream?: MediaStream;
  private frame?: number;
  private canvas = document.createElement('canvas');
  private terminado = false;

  constructor() { addIcons({ closeOutline, keypadOutline }); }

  async ngAfterViewInit() {
    try {
      const { default: jsQR } = await import('jsqr');
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      if (this.terminado) { this.apagar(); return; }
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.estado.set('Coloca el código dentro del marco');

      const ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
      const leer = () => {
        if (this.terminado) return;
        if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth) {
          // Reducimos el cuadro para que la lectura sea rápida también en celulares
          const escala = Math.min(1, 640 / video.videoWidth);
          const w = Math.round(video.videoWidth * escala);
          const h = Math.round(video.videoHeight * escala);
          this.canvas.width = w;
          this.canvas.height = h;
          ctx.drawImage(video, 0, 0, w, h);
          const qr = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
          const codigo = qr?.data?.trim();
          if (codigo) { navigator.vibrate?.(80); this.cerrar({ codigo }); return; }
        }
        this.frame = requestAnimationFrame(leer);
      };
      this.frame = requestAnimationFrame(leer);
    } catch (e) {
      this.cerrar({ error: this.mensajeError(e) });
    }
  }

  cerrar(data?: { codigo?: string; manual?: boolean; error?: string }) {
    if (this.terminado) return;
    this.terminado = true;
    this.apagar();
    this.modal.dismiss(data);
  }

  ngOnDestroy() { this.terminado = true; this.apagar(); }

  private apagar() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
  }

  private mensajeError(e: unknown): string {
    const nombre = (e as { name?: string })?.name;
    if (nombre === 'NotAllowedError') return 'No diste permiso para usar la cámara';
    if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') return 'No se encontró una cámara';
    if (nombre === 'NotReadableError') return 'La cámara está siendo usada por otra aplicación';
    return 'No se pudo abrir la cámara';
  }
}
