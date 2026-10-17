package cl.nodalix.omnidock.dto;

import cl.nodalix.omnidock.domain.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class Dtos {
    private Dtos() {}

    // ---- Auth / Usuario ----
    public record LoginRequest(@NotBlank String emailInstitucional, @NotBlank String passwordPrototipo) {}

    public record UsuarioDto(Long idUsuario, String rut, String idDirectorioExterno, String nombreCompleto,
                             String emailInstitucional, Integer idRol, String estadoSincronizacion) {
        public static UsuarioDto from(Usuario u) {
            return new UsuarioDto(u.getIdUsuario(), u.getRut(), u.getIdDirectorioExterno(), u.getNombreCompleto(),
                    u.getEmailInstitucional(), u.getIdRol(), u.getEstadoSincronizacion());
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

    // ---- Analítica ----
    public record EmbedTokenResponse(String embedToken, Instant tokenExpiry, String reportId, String embedUrl) {}
}
