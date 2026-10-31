export interface Usuario {
  idUsuario: number;
  rut?: string;
  idDirectorioExterno?: string;
  nombreCompleto: string;
  emailInstitucional?: string;
  idRol: number;
  estadoSincronizacion: string;
  faltasVigentes?: number;   // Solo en la lista de usuarios del panel
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
// Horario, faltas, lista de espera y avisos
export interface Horario {
  activo: boolean; reservasAbiertas: boolean; reservaDesde?: string; reservaHasta?: string; cierre?: string; mensaje: string;
}
export interface Espera {
  idEspera: number; estadoEspera: 'ESPERANDO' | 'OFRECIDA' | string; idVehiculo: number; idTipoVehiculo: number;
  posicion?: number; fechaRegistro: string; idBahiaOfrecida?: number; codigoIot?: string; ubicacion?: string;
  fechaLimiteOferta?: string; idReserva?: number;
}
export interface EsperaAdmin {
  idEspera: number; idUsuario: number; nombreCompleto?: string; vehiculo?: string; idTipoVehiculo: number;
  estadoEspera: string; posicion?: number; fechaRegistro: string; codigoIot?: string; fechaLimiteOferta?: string;
}
export interface MiEstado {
  faltasVigentes: number; maxFaltas: number; reservasBloqueadas: boolean; minutosReserva: number;
  horario: Horario; espera?: Espera; notificacionesNoLeidas: number;
}
export interface Notificacion { idNotificacion: number; tipo: string; mensaje: string; fechaCreacion: string; leida: boolean; }
export interface Falta { idFalta: number; idReserva: number; codigoIot?: string; fechaFalta: string; estadoFalta: string; fechaAnulacion?: string; }

export interface EmbedToken { embedToken?: string; tokenExpiry?: string; reportId?: string; embedUrl: string; }

// Datos de los gráficos propios de Analítica (GET /analitica/resumen)
export interface Conteo { etiqueta: string; valor: number; }
export interface PuntoSerie { fecha: string; reservas: number; usos: number; faltas: number; }
export interface SectorTipo { sector: string; tipo: string; bahias: number; usos: number; }
export interface BahiaTop { codigoIot: string; sector: string; usos: number; minutosPromedio?: number; }
export interface Indicadores {
  reservas: number; usos: number; pctConcretadas: number; faltas: number; pctFaltas: number;
  minutosUsoPromedio?: number; minutosLlegadaPromedio?: number; usuariosActivos: number;
  esperas: number; pctEsperaConfirmada: number; minutosEsperaPromedio?: number; usuariosBloqueados: number;
}
export interface ResumenAnalitica {
  dias: number; desde?: string; hasta?: string; agrupacion: 'DIA' | 'SEMANA'; indicadores: Indicadores;
  serie: PuntoSerie[]; usoPorHora: Conteo[]; usoPorDia: Conteo[]; porSector: SectorTipo[];
  estadosReserva: Conteo[]; listaEspera: Conteo[]; topBahias: BahiaTop[];
}

// Catálogos (IDs según Insert_SQL)
export const ESTADO_BAHIA: Record<number, string> = { 1: 'Disponible', 2: 'Reservada', 3: 'Ocupada', 4: 'Fuera de servicio' };
export const EST = { DISPONIBLE: 1, RESERVADA: 2, OCUPADA: 3, FUERA_DE_SERVICIO: 4 } as const;
export const ROL: Record<number, string> = { 1: 'Administrador', 2: 'Usuario', 3: 'Colaborador' };
export const TIPO_VEHICULO: Record<number, string> = { 1: 'Bicicleta', 2: 'Scooter' };
export const ROL_ADMIN = 1;
