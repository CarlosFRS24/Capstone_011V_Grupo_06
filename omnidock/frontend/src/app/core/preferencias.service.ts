import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Vehiculo } from './models';

/** Recuerda en el dispositivo el vehículo que el usuario eligió para sus próximas reservas. */
@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  private auth = inject(AuthService);
  /** Cambia cada vez que se elige un vehículo, para que las pantallas se actualicen. */
  readonly version = signal(0);

  private clave() { return `omnidock.vehiculo.${this.auth.user()?.idUsuario ?? 0}`; }

  idVehiculo(): number | null {
    this.version();
    const v = Number(localStorage.getItem(this.clave()));
    return Number.isFinite(v) && v > 0 ? v : null;
  }

  elegir(idVehiculo: number) {
    localStorage.setItem(this.clave(), String(idVehiculo));
    this.version.update((n) => n + 1);
  }

  /** El vehículo elegido si sigue existiendo; si no, el primero de la lista. */
  seleccionado(lista: Vehiculo[]): Vehiculo | null {
    const id = this.idVehiculo();
    return lista.find((v) => v.idVehiculo === id) ?? lista[0] ?? null;
  }
}
