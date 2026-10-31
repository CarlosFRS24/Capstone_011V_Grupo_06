package cl.nodalix.omnidock.dto;

import cl.nodalix.omnidock.domain.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class Dtos {
    private Dtos() {}

    // ---- Auth / Usuario ----
    public record LoginRequest(@NotBlank String emailInstitucional, @NotBlank String passwordPrototipo) {}

    /** faltasVigentes solo viene en la lista de usuarios del panel. */
    public record UsuarioDto(Long idUsuario, String rut, String idDirectorioExterno, String nombreCompleto,
                             String emailInstitucional, Integer idRol, String estadoSincronizacion, Long faltasVigentes) {
        public static UsuarioDto from(Usuario u) {
            return from(u, null);
        }
        public static UsuarioDto from(Usuario u, Long faltasVigentes) {
            return new UsuarioDto(u.getIdUsuario(), u.getRut(), u.getIdDirectorioExterno(), u.getNombreCompleto(),
                    u.getEmailInstitucional(), u.getIdRol(), u.getEstadoSincronizacion(), faltasVigentes);
        }
    }

    public record LoginResponse(String token, UsuarioDto usuario) {}

    public record UsuarioCreate(@NotBlank @Size(max = 12) String rut, String idDirectorioExterno, @NotBlank String nombreCompleto,
                                @NotBlank @Email @Size(max = 100) String emailInstitucional, @NotBlank @Size(max = 255) String passwordPrototipo,
                                @NotNull Integer idRol, String estadoSincronizacion) {}

    public record UsuarioUpdate(String nombreCompleto, String emailInstitucional, String passwordPrototipo,
                                Integer idRol, String estadoSincronizacion) {}

    // ---- Bahías ----
    /** direccionMac es opcional: si viene, se crea también el DISPOSITIVO_IOT de la bahía. */
    public record BahiaRequest(String codigoIot, String ubicacion, Integer idEstado, Long idTipoPermitido, String direccionMac) {}

    // ---- Vehículos ----
    public record VehiculoCreate(Long idUsuario, @NotNull Long idTipoVehiculo, @NotBlank @Size(max = 50) String identificador) {}

    public record VehiculoDto(Long idVehiculo, Long idTipoVehiculo, String nombreTipo, String identificador) {}

    // ---- Reservas / Transacciones ----
    public record ReservaCreate(Long idUsuario, @NotNull Long idBahia, @NotNull Long idVehiculo) {}

    public record IniciarRequest(@NotNull Long idReserva, Long idUsuario, Long idBahia, Long idVehiculo) {}

    public record TransaccionDto(Long idTransaccion, Instant fechaInicio, Instant fechaFin, String estadoTransaccion) {}

    public record HistorialDto(Long idTransaccion, Long idReserva, Long idBahia, String codigoIot, String ubicacion,
                               Long idVehiculo, String vehiculo, Instant fechaInicio, Instant fechaFin,
                               Long minutos, String estadoTransaccion) {}

    // ---- Tickets ----
    public record TicketCreate(@NotNull Long idBahia, Long reportadoPor, @NotBlank @Size(max = 255) String descripcionFalla, String estadoTicket) {}

    public record TicketUpdate(String estadoTicket, Instant fechaResolucion, String descripcionFalla) {}

    // ---- IoT ----
    public record TelemetriaRequest(@NotBlank @Size(max = 20) String direccionMac, @NotBlank @Size(max = 50) String tipoEvento, @NotBlank @Size(max = 500) String payloadRecibido) {}

    // ---- Horario, faltas, lista de espera y avisos ----
    /** Horario de hoy. reservaDesde/reservaHasta/cierre vienen vacíos si hoy no abre. */
    public record HorarioDto(boolean activo, boolean reservasAbiertas, String reservaDesde, String reservaHasta,
                             String cierre, String mensaje) {}

    public record FaltaDto(Long idFalta, Long idReserva, String codigoIot, Instant fechaFalta, String estadoFalta,
                           Instant fechaAnulacion) {}

    public record UnirseEsperaRequest(@NotNull Long idVehiculo) {}

    /** posicion: 1 = el siguiente en recibir una bahía. Si estado = OFRECIDA viene la bahía y la hora límite. */
    public record EsperaDto(Long idEspera, String estadoEspera, Long idVehiculo, Long idTipoVehiculo, Integer posicion,
                            Instant fechaRegistro, Long idBahiaOfrecida, String codigoIot, String ubicacion,
                            Instant fechaLimiteOferta, Long idReserva) {}

    public record EsperaAdminDto(Long idEspera, Long idUsuario, String nombreCompleto, String vehiculo, Long idTipoVehiculo,
                                 String estadoEspera, Integer posicion, Instant fechaRegistro, String codigoIot,
                                 Instant fechaLimiteOferta) {}

    public record NotificacionDto(Long idNotificacion, String tipo, String mensaje, Instant fechaCreacion, boolean leida) {}

    /** Todo lo que la app consulta cada 30 s: faltas, bloqueo, horario, lista de espera y avisos sin leer. */
    public record MiEstadoDto(long faltasVigentes, int maxFaltas, boolean reservasBloqueadas, long minutosReserva,
                              HorarioDto horario, EsperaDto espera, long notificacionesNoLeidas) {}

    // ---- Analítica ----
    public record EmbedTokenResponse(String embedToken, Instant tokenExpiry, String reportId, String embedUrl) {}

    /** Gráficos propios del panel (el embebido de Power BI está bloqueado en la cuenta del instituto). */
    public record ConteoDto(String etiqueta, long valor) {}

    /** Un punto del gráfico de evolución: un día o una semana (fecha = lunes de esa semana). */
    public record PuntoSerieDto(String fecha, long reservas, long usos, long faltas) {}

    public record SectorTipoDto(String sector, String tipo, long bahias, long usos) {}

    public record BahiaTopDto(String codigoIot, String sector, long usos, Double minutosPromedio) {}

    /** Porcentajes de 0 a 100. Los promedios vienen vacíos si no hay datos en el período. */
    public record IndicadoresDto(long reservas, long usos, double pctConcretadas, long faltas, double pctFaltas,
                                 Double minutosUsoPromedio, Double minutosLlegadaPromedio, long usuariosActivos,
                                 long esperas, double pctEsperaConfirmada, Double minutosEsperaPromedio,
                                 long usuariosBloqueados) {}

    /** dias = 0 es todo el historial. agrupacion: DIA o SEMANA. desde/hasta: primer y último día con datos. */
    public record ResumenAnaliticaDto(int dias, String desde, String hasta, String agrupacion, IndicadoresDto indicadores,
                                      List<PuntoSerieDto> serie, List<ConteoDto> usoPorHora, List<ConteoDto> usoPorDia,
                                      List<SectorTipoDto> porSector, List<ConteoDto> estadosReserva,
                                      List<ConteoDto> listaEspera, List<BahiaTopDto> topBahias) {}
}
