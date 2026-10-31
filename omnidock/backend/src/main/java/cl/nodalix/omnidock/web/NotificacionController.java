package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.dto.Dtos.NotificacionDto;
import cl.nodalix.omnidock.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Avisos dentro de la app (los últimos 30). */
@RestController
@RequestMapping("/api/v1/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {
    private final NotificacionService service;

    @GetMapping
    public List<NotificacionDto> mias() { return service.mias(); }

    @PutMapping("/{id}/leida")
    public ResponseEntity<Void> leida(@PathVariable Long id) {
        service.marcarLeida(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/leidas")
    public Map<String, Object> todasLeidas() { return Map.of("marcadas", service.marcarTodasLeidas()); }
}
