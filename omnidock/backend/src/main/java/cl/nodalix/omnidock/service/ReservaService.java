package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.domain.*;
import cl.nodalix.omnidock.dto.Dtos.ReservaCreate;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.repository.*;
import cl.nodalix.omnidock.security.AuthUser;
import cl.nodalix.omnidock.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservas;
    private final BahiaRepository bahias;
    private final VehiculoRepository vehiculos;
    private final UsuarioRepository usuarios;
    private final HorarioService horario;
    private final FaltaService faltas;
    private final ListaEsperaService listaEspera;

    @Value("${omnidock.reserva.minutos-expiracion}")
    private long minutosExpiracion;

    public long minutosExpiracion() { return minutosExpiracion; }

    /**
     * RF-02 / RF-06: asigna bahía compatible con el vehículo. El FOR UPDATE sobre la bahía evita la doble asignación.
     * Solo en horario de reservas, no si tiene 3 faltas, y con 60 min para llegar (sin pasar del cierre).
     */
    @Transactional
    public Reserva crear(ReservaCreate req) {
        AuthUser me = CurrentUser.get();
        Long idUsuario = me.idUsuario();

        Usuario u = usuarios.findById(idUsuario).orElseThrow(() -> ApiException.notFound("Usuario no existe"));
        if (!Estados.USR_VIGENTE.equals(u.getEstadoSincronizacion())) throw ApiException.forbidden("Usuario no vigente");
        faltas.validarNoBloqueado(idUsuario);
        horario.validarReservasAbiertas();

        Vehiculo v = vehiculos.findById(req.idVehiculo()).orElseThrow(() -> ApiException.notFound("Vehículo no encontrado"));
        if (!v.getIdUsuario().equals(idUsuario) || !Estados.VEH_ACTIVO.equals(v.getEstadoVehiculo()))
            throw ApiException.badRequest("El vehículo no pertenece al usuario o está inactivo");

        if (reservas.existsByIdUsuarioAndEstadoReserva(idUsuario, Estados.RES_PENDIENTE))
            throw ApiException.conflict("Ya tienes una reserva pendiente");

        Bahia b = bahias.findForUpdate(req.idBahia()).orElseThrow(() -> ApiException.notFound("Bahía no encontrada"));
        if (b.getIdEstado() != Estados.BAHIA_DISPONIBLE) throw ApiException.conflict("La bahía no está disponible");
        if (!b.getIdTipoPermitido().equals(v.getIdTipoVehiculo()))
            throw ApiException.conflict("La bahía no es compatible con el tipo de tu vehículo");

        b.setIdEstado(Estados.BAHIA_RESERVADA);

        Reserva r = new Reserva();
        r.setIdUsuario(idUsuario);
        r.setIdBahia(b.getIdBahia());
        r.setIdVehiculo(v.getIdVehiculo());
        Instant ahora = Instant.now();
        r.setFechaSolicitud(ahora);
        r.setFechaExpiracion(horario.vencimiento(ahora, minutosExpiracion));
        r.setEstadoReserva(Estados.RES_PENDIENTE);
        r = reservas.save(r);
        listaEspera.salirPorReserva(idUsuario);
        return r;
    }

    @Transactional(readOnly = true)
    public List<Reserva> pendientesDeUsuario(Long idUsuario) {
        CurrentUser.assertSelfOrAdmin(idUsuario);
        return reservas.findByIdUsuarioAndEstadoReserva(idUsuario, Estados.RES_PENDIENTE);
    }

    @Transactional
    public Reserva cancelar(Long idReserva) {
        Reserva r = reservas.findForUpdate(idReserva).orElseThrow(() -> ApiException.notFound("Reserva no encontrada"));
        CurrentUser.assertSelfOrAdmin(r.getIdUsuario());
        if (!Estados.RES_PENDIENTE.equals(r.getEstadoReserva()))
            throw ApiException.conflict("Solo se pueden cancelar reservas PENDIENTES (actual: " + r.getEstadoReserva() + ")");
        r.setEstadoReserva(Estados.RES_CANCELADA);
        liberarBahia(r.getIdBahia());
        return r;
    }

    /** Pasa a EXPIRADA las reservas pendientes vencidas, registra la falta y libera su bahía. */
    @Scheduled(fixedDelayString = "${omnidock.reserva.intervalo-expiracion-ms}")
    @Transactional
    public void expirarVencidas() {
        for (Reserva r : reservas.findByEstadoReservaAndFechaExpiracionBefore(Estados.RES_PENDIENTE, Instant.now())) {
            r.setEstadoReserva(Estados.RES_EXPIRADA);
            faltas.registrar(r);
            liberarBahia(r.getIdBahia());
        }
    }

    /** La bahía vuelve a DISPONIBLE y, si hay alguien en la lista de espera, se le ofrece. */
    private void liberarBahia(Long idBahia) {
        bahias.findForUpdate(idBahia).ifPresent(b -> {
            if (b.getIdEstado() == Estados.BAHIA_RESERVADA) {
                b.setIdEstado(Estados.BAHIA_DISPONIBLE);
                listaEspera.bahiaLiberada(b);
            }
        });
    }
}
