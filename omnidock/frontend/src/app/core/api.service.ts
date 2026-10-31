import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  Bahia, EmbedToken, Espera, EsperaAdmin, Falta, Historial, MiEstado, Notificacion, Reserva, ResumenAnalitica, Ticket, TipoVehiculo,
  Transaccion, Usuario, Vehiculo,
} from './models';

type Msg = { mensaje: string };
const U = environment.apiUrl;

/** Cliente de la API REST v1 (ERS §5.6). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ---- Bahías ----
  bahias(f?: { idEstado?: number; idTipoPermitido?: number; ubicacion?: string }) {
    let params = new HttpParams();
    if (f?.idEstado) params = params.set('idEstado', f.idEstado);
    if (f?.idTipoPermitido) params = params.set('idTipoPermitido', f.idTipoPermitido);
    if (f?.ubicacion) params = params.set('ubicacion', f.ubicacion);
    return this.http.get<Bahia[]>(`${U}/bahias`, { params });
  }
  bahiaPorCodigo(codigo: string) { return this.http.get<Bahia>(`${U}/bahias/codigo/${encodeURIComponent(codigo)}`); }
  crearBahia(b: { codigoIot: string; ubicacion: string; idTipoPermitido: number; direccionMac?: string }) {
    return this.http.post<Msg & { idBahia: number }>(`${U}/bahias`, b);
  }
  actualizarBahia(id: number, b: Partial<Pick<Bahia, 'ubicacion' | 'idEstado' | 'idTipoPermitido'>>) {
    return this.http.put<Msg>(`${U}/bahias/${id}`, b);
  }
  eliminarBahia(id: number) { return this.http.delete<void>(`${U}/bahias/${id}`); }

  // ---- Vehículos ----
  tiposVehiculo() { return this.http.get<TipoVehiculo[]>(`${U}/catalogos/tipos-vehiculo`); }
  vehiculos(idUsuario: number) { return this.http.get<Vehiculo[]>(`${U}/vehiculos/usuario/${idUsuario}`); }
  crearVehiculo(v: { idTipoVehiculo: number; identificador: string }) { return this.http.post<Msg>(`${U}/vehiculos`, v); }
  eliminarVehiculo(id: number) { return this.http.delete<void>(`${U}/vehiculos/${id}`); }

  // ---- Reservas y transacciones ----
  reservasPendientes(idUsuario: number) { return this.http.get<Reserva[]>(`${U}/reservas/usuario/${idUsuario}`); }
  crearReserva(idBahia: number, idVehiculo: number) { return this.http.post<Reserva>(`${U}/reservas`, { idBahia, idVehiculo }); }
  cancelarReserva(id: number) { return this.http.put<{ idReserva: number; estadoReserva: string }>(`${U}/reservas/${id}/cancelar`, {}); }
  iniciarSesion(b: { idReserva: number; idBahia: number; idVehiculo: number }) { return this.http.post<Transaccion>(`${U}/transacciones/iniciar`, b); }
  finalizarSesion(id: number) { return this.http.post<Transaccion>(`${U}/transacciones/${id}/finalizar`, {}); }
  historial(idUsuario: number) { return this.http.get<Historial[]>(`${U}/transacciones/usuario/${idUsuario}`); }

  // ---- Tickets ----
  tickets(estado?: string) {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<Ticket[]>(`${U}/tickets`, { params });
  }
  crearTicket(idBahia: number, descripcionFalla: string) { return this.http.post<Msg>(`${U}/tickets`, { idBahia, descripcionFalla }); }
  actualizarTicket(id: number, estadoTicket: string) { return this.http.put<Msg>(`${U}/tickets/${id}`, { estadoTicket }); }

  // ---- Usuarios (admin) ----
  usuarios() { return this.http.get<Usuario[]>(`${U}/usuarios`); }
  crearUsuario(u: { rut: string; nombreCompleto: string; emailInstitucional: string; passwordPrototipo: string; idRol: number }) {
    return this.http.post<Msg>(`${U}/usuarios`, u);
  }
  actualizarUsuario(id: number, u: { idRol?: number; estadoSincronizacion?: string }) { return this.http.put<Msg>(`${U}/usuarios/${id}`, u); }
  eliminarUsuario(id: number) { return this.http.delete<void>(`${U}/usuarios/${id}`); }

  // Estado del usuario, lista de espera, avisos y faltas
  miEstado() { return this.http.get<MiEstado>(`${U}/mi-estado`); }
  misFaltas() { return this.http.get<Falta[]>(`${U}/mi-estado/faltas`); }
  unirseEspera(idVehiculo: number) { return this.http.post<Espera>(`${U}/lista-espera`, { idVehiculo }); }
  salirEspera() { return this.http.delete<void>(`${U}/lista-espera`); }
  confirmarEspera() { return this.http.post<Reserva>(`${U}/lista-espera/confirmar`, {}); }
  esperaActiva() { return this.http.get<EsperaAdmin[]>(`${U}/lista-espera/activa`); }
  notificaciones() { return this.http.get<Notificacion[]>(`${U}/notificaciones`); }
  marcarAvisosLeidos() { return this.http.put<{ marcadas: number }>(`${U}/notificaciones/leidas`, {}); }
  faltasUsuario(id: number) { return this.http.get<Falta[]>(`${U}/usuarios/${id}/faltas`); }
  desbloquearUsuario(id: number) { return this.http.put<Msg & { faltasAnuladas: number }>(`${U}/usuarios/${id}/desbloquear`, {}); }

  // ---- Analítica ----
  embedToken() { return this.http.get<EmbedToken>(`${U}/analitica/embed-token`); }
  /** datos de los gráficos de Analítica. dias = 7, 30, 90 o 0 (todo). */
  resumenAnalitica(dias: number) { return this.http.get<ResumenAnalitica>(`${U}/analitica/resumen`, { params: { dias } }); }
}
