package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.domain.DispositivoIot;
import cl.nodalix.omnidock.domain.Estados;
import cl.nodalix.omnidock.domain.LogEventoIot;
import cl.nodalix.omnidock.dto.Dtos.TelemetriaRequest;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.repository.BahiaRepository;
import cl.nodalix.omnidock.repository.DispositivoIotRepository;
import cl.nodalix.omnidock.repository.LogEventoIotRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class IotService {

    private final DispositivoIotRepository dispositivos;
    private final LogEventoIotRepository logs;
    private final BahiaRepository bahias;
    private final ObjectMapper mapper;
    private final ListaEsperaService listaEspera;

    /** Ingesta de telemetría (RF-03): registra el evento y, si es ALERTA_FALLA, pasa la bahía a FUERA_DE_SERVICIO. */
    @Transactional
    public LogEventoIot registrar(TelemetriaRequest req) {
        DispositivoIot d = dispositivos.findByDireccionMac(req.direccionMac())
                .orElseThrow(() -> ApiException.notFound("Dispositivo no registrado: " + req.direccionMac()));

        JsonNode payload;
        try {
            payload = mapper.readTree(req.payloadRecibido());
        } catch (Exception e) {
            throw ApiException.badRequest("payloadRecibido no es un JSON válido");
        }

        LogEventoIot log = new LogEventoIot();
        log.setIdDispositivo(d.getIdDispositivo());
        log.setTipoEvento(req.tipoEvento());
        log.setPayloadRecibido(req.payloadRecibido());
        log.setFechaEvento(Instant.now());
        log = logs.save(log);

        d.setUltimoPing(Instant.now());
        if (payload.hasNonNull("estadoConexion")) {
            d.setEstadoConexion(payload.get("estadoConexion").asText().toUpperCase());
        }
        if ("ALERTA_FALLA".equalsIgnoreCase(req.tipoEvento()) && d.getIdBahia() != null) {
            bahias.findForUpdate(d.getIdBahia()).ifPresent(b -> {
                // Si está ocupada no se le quita al usuario (igual que con los tickets); queda fuera de servicio igual.
                if (b.getIdEstado() != Estados.BAHIA_FUERA_DE_SERVICIO) {
                    b.setIdEstado(Estados.BAHIA_FUERA_DE_SERVICIO);
                    listaEspera.bahiaRetirada(b);   // cancela la reserva pendiente sin falta
                }
            });
        }
        return log;
    }
}
