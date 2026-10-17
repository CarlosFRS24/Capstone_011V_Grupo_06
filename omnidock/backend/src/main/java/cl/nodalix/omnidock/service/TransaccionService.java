package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.domain.*;
import cl.nodalix.omnidock.dto.Dtos.*;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.repository.*;
import cl.nodalix.omnidock.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransaccionService {

    private final TransaccionUsoRepository txs;
    private final ReservaRepository reservas;
    private final BahiaRepository bahias;
    private final VehiculoRepository vehiculos;
    private final DispositivoIotRepository dispositivos;
    private final TicketMantenimientoRepository tickets;
    private final IotClient iot;

    /** Check-in (RF-07): valida reserva, abre el cerrojo en el simulador y deja la transacción ACTIVA. */
    @Transactional
    public TransaccionDto iniciar(IniciarRequest req) {
        Long idUsuario = CurrentUser.get().idUsuario();

        Reserva r = reservas.findForUpdate(req.idReserva()).orElseThrow(() -> ApiException.notFound("Reserva no encontrada"));
        if (!r.getIdUsuario().equals(idUsuario)) throw ApiException.forbidden("La reserva pertenece a otro usuario");
        if (!Estados.RES_PENDIENTE.equals(r.getEstadoReserva()))
            throw ApiException.conflict("La reserva no está pendiente (estado actual: " + r.getEstadoReserva() + ")");
        if (req.idBahia() != null && !req.idBahia().equals(r.getIdBahia()))
            throw ApiException.conflict("El QR escaneado no corresponde a la bahía reservada");
        if (req.idVehiculo() != null && !req.idVehiculo().equals(r.getIdVehiculo()))
            throw ApiException.conflict("El vehículo no corresponde a la reserva");
        if (r.getFechaExpiracion().isBefore(Instant.now()))
            throw ApiException.conflict("La reserva expiró, genera una nueva");

        Bahia b = bahias.findForUpdate(r.getIdBahia()).orElseThrow(() -> ApiException.notFound("Bahía no encontrada"));
        if (b.getIdEstado() != Estados.BAHIA_RESERVADA)
            throw ApiException.conflict("La bahía ya no está disponible para este check-in (puede estar fuera de servicio)");

        DispositivoIot d = dispositivos.findFirstByIdBahia(b.getIdBahia())
                .orElseThrow(() -> ApiException.conflict("La bahía no tiene dispositivo IoT asociado"));
        // Si el simulador falla se lanza 502 y TOdo se revierte (reserva sigue PENDIENTE)
        iot.enviarComando(d.getDireccionMac(), Estados.CMD_LIBERAR);

        r.setEstadoReserva(Estados.RES_CONCRETADA);
        b.setIdEstado(Estados.BAHIA_OCUPADA);

        TransaccionUso t = new TransaccionUso();
        t.setIdReserva(r.getIdReserva());
        t.setIdUsuario(idUsuario);
        t.setIdBahia(b.getIdBahia());
        t.setIdVehiculo(r.getIdVehiculo());
        t.setFechaInicio(Instant.now());
        t.setEstadoTransaccion(Estados.TX_ACTIVA);
        t = txs.save(t);
        return new TransaccionDto(t.getIdTransaccion(), t.getFechaInicio(), null, t.getEstadoTransaccion());
    }

    /** Check-out: bloquea el cerrojo, estampa FECHA_FIN y libera la bahía. */
    @Transactional
    public TransaccionDto finalizar(Long idTransaccion) {
        TransaccionUso t = txs.findForUpdate(idTransaccion).orElseThrow(() -> ApiException.notFound("Transacción no encontrada"));
        CurrentUser.assertSelfOrAdmin(t.getIdUsuario());
        if (!Estados.TX_ACTIVA.equals(t.getEstadoTransaccion()))
            throw ApiException.conflict("La transacción no está activa");

        Bahia b = bahias.findForUpdate(t.getIdBahia()).orElseThrow(() -> ApiException.notFound("Bahía no encontrada"));
        DispositivoIot d = dispositivos.findFirstByIdBahia(b.getIdBahia()).orElse(null);
        if (d != null) iot.enviarComando(d.getDireccionMac(), Estados.CMD_BLOQUEAR);

        t.setFechaFin(Instant.now());
        t.setEstadoTransaccion(Estados.TX_FINALIZADA);

        if (b.getIdEstado() == Estados.BAHIA_OCUPADA) {
            boolean ticketAbierto = tickets.existsByIdBahiaAndEstadoTicketIn(b.getIdBahia(),
                    List.of(Estados.TK_ABIERTO, Estados.TK_EN_REVISION));
            b.setIdEstado(ticketAbierto ? Estados.BAHIA_FUERA_DE_SERVICIO : Estados.BAHIA_DISPONIBLE);
        }
        return new TransaccionDto(t.getIdTransaccion(), t.getFechaInicio(), t.getFechaFin(), t.getEstadoTransaccion());
    }

    /** RF-08: historial personal con ubicación, vehículo y minutos de permanencia. */
    @Transactional(readOnly = true)
    public List<HistorialDto> historial(Long idUsuario) {
        CurrentUser.assertSelfOrAdmin(idUsuario);
        List<TransaccionUso> lista = txs.findByIdUsuarioOrderByFechaInicioDesc(idUsuario);
        Map<Long, Bahia> bm = bahias.findAllById(lista.stream().map(TransaccionUso::getIdBahia).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Bahia::getIdBahia, x -> x));
        Map<Long, Vehiculo> vm = vehiculos.findAllById(lista.stream().map(TransaccionUso::getIdVehiculo).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Vehiculo::getIdVehiculo, x -> x));
        return lista.stream().map(t -> {
            Bahia b = bm.get(t.getIdBahia());
            Vehiculo v = vm.get(t.getIdVehiculo());
            Long min = t.getFechaFin() == null ? null : Duration.between(t.getFechaInicio(), t.getFechaFin()).toMinutes();
            return new HistorialDto(t.getIdTransaccion(), t.getIdReserva(), t.getIdBahia(),
                    b == null ? null : b.getCodigoIot(), b == null ? null : b.getUbicacion(),
                    t.getIdVehiculo(), v == null ? null : v.getIdentificador(),
                    t.getFechaInicio(), t.getFechaFin(), min, t.getEstadoTransaccion());
        }).toList();
    }
}
