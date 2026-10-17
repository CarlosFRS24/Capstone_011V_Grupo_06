package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.domain.LogEventoIot;
import cl.nodalix.omnidock.dto.Dtos.TelemetriaRequest;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.service.IotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/iot")
@RequiredArgsConstructor
public class IotController {
    private final IotService service;

    @Value("${omnidock.iot.api-key}")
    private String apiKey;

    /** Endpoint público para dispositivos: se protege con la cabecera X-IOT-KEY. */
    @PostMapping("/telemetria")
    public ResponseEntity<Map<String, Object>> telemetria(@RequestHeader(value = "X-IOT-KEY", required = false) String key,
                                                          @Valid @RequestBody TelemetriaRequest req) {
        if (key == null || !key.equals(apiKey)) throw new ApiException(HttpStatus.UNAUTHORIZED, "API key de dispositivo inválida");
        LogEventoIot log = service.registrar(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("idLog", log.getIdLog(), "mensaje", "Evento IoT registrado correctamente"));
    }
}
