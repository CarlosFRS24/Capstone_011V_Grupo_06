package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.dto.Dtos.TelemetriaRequest;
import cl.nodalix.omnidock.repository.DispositivoIotRepository;
import cl.nodalix.omnidock.service.IotService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Simulador de hardware (solo con perfil "mock"). Es el "servidor del simulador" del contrato 1.2-B.
 * Para separarlo después basta mover esta clase a otro proyecto y apuntar IOT_BASE_URL hacia él.
 */
@RestController
@RequestMapping("/api/mock-iot")
@Profile("mock")
@RequiredArgsConstructor
public class MockIotController {

    private final DispositivoIotRepository dispositivos;
    private final IotService iotService;

    @PostMapping("/comando")
    public ResponseEntity<Map<String, Object>> comando(@RequestBody Map<String, String> body) {
        String mac = body.get("direccionMac");
        String cmd = body.get("comando");
        if (mac == null || dispositivos.findByDireccionMac(mac).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "ERROR", "mensaje", "Dispositivo desconocido"));
        }
        return switch (String.valueOf(cmd)) {
            case "LIBERAR_CERROJO" -> ResponseEntity.ok(Map.of("status", "EJECUTADO", "mensaje", "Cerrojo liberado exitosamente en el hardware"));
            case "BLOQUEAR_CERROJO" -> ResponseEntity.ok(Map.of("status", "EJECUTADO", "mensaje", "Cerrojo bloqueado exitosamente en el hardware"));
            default -> ResponseEntity.badRequest().body(Map.of("status", "ERROR", "mensaje", "Comando no soportado: " + cmd));
        };
    }

    /** Para la demo: dispara telemetría desde el "hardware". Ej: POST /api/mock-iot/simular?mac=AA:BB:..&evento=ALERTA_FALLA */
    @PostMapping("/simular")
    public Map<String, Object> simular(@RequestParam String mac, @RequestParam(defaultValue = "LECTURA_SENSOR") String evento) {
        String payload = "ALERTA_FALLA".equals(evento)
                ? "{\"candadoCerrado\": false, \"bateria\": 12, \"estadoConexion\": \"ONLINE\", \"falla\": true}"
                : "{\"candadoCerrado\": true, \"bateria\": 80, \"estadoConexion\": \"ONLINE\"}";
        var log = iotService.registrar(new TelemetriaRequest(mac, evento, payload));
        return Map.of("idLog", log.getIdLog(), "mensaje", "Telemetría simulada registrada");
    }
}
