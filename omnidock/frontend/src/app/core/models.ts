export interface Usuario {
  idUsuario: number;
  rut?: string;
  idDirectorioExterno?: string;
  nombreCompleto: string;
  emailInstitucional?: string;
  idRol: number;
  estadoSincronizacion: string;
}
export interface LoginResponse { token: string; usuario: Usuario; }

export interface Bahia {
  idBahia: number;
  codigoIot: string;
  ubicacion: string;
  idEstado: number;
  idTipoPermitido: number;
}
export interface TipoVehiculo { idTipoVehiculo: number; nombreTipo: string; }
export interface Vehiculo { idVehiculo: number; idTipoVehiculo: number; nombreTipo: string; identificador: string; }

export interface Reserva {
  idReserva: number; idUsuario: number; idBahia: number; idVehiculo: number;
  fechaSolicitud: string; fechaExpiracion: string; estadoReserva: string;
}
export interface Transaccion { idTransaccion: number; fechaInicio: string; fechaFin?: string; estadoTransaccion: string; }
export interface Historial {
  idTransaccion: number; idReserva: number; idBahia: number; codigoIot?: string; ubicacion?: string;
  idVehiculo: number; vehiculo?: string; fechaInicio: string; fechaFin?: string; minutos?: number; estadoTransaccion: string;
}
export interface Ticket {
  idTicket: number; idBahia: number; reportadoPor: number; descripcionFalla: string;
  fechaReporte: string; fechaResolucion?: string; estadoTicket: string;
}
export interface EmbedToken { embedToken?: string; tokenExpiry?: string; reportId?: string; embedUrl: string; }

// Catálogos (IDs según Insert_SQL)
export const ESTADO_BAHIA: Record<number, string> = { 1: 'Disponible', 2: 'Reservada', 3: 'Ocupada', 4: 'Fuera de servicio' };
export const EST = { DISPONIBLE: 1, RESERVADA: 2, OCUPADA: 3, FUERA_DE_SERVICIO: 4 } as const;
export const ROL: Record<number, string> = { 1: 'Administrador', 2: 'Usuario', 3: 'Colaborador' };
export const TIPO_VEHICULO: Record<number, string> = { 1: 'Bicicleta', 2: 'Scooter' };
export const ROL_ADMIN = 1;
