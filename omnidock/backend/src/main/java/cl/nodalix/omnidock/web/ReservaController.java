package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.domain.Reserva;
import cl.nodalix.omnidock.dto.Dtos.ReservaCreate;
import cl.nodalix.omnidock.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reservas")
@RequiredArgsConstructor
public class ReservaController {
    private final ReservaService service;

    @PostMapping
    public ResponseEntity<Reserva> crear(@Valid @RequestBody ReservaCreate req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(req));
    }

    @GetMapping("/usuario/{idUsuario}")
    public List<Reserva> pendientes(@PathVariable Long idUsuario) { return service.pendientesDeUsuario(idUsuario); }

    @PutMapping("/{idReserva}/cancelar")
    public Map<String, Object> cancelar(@PathVariable Long idReserva) {
        Reserva r = service.cancelar(idReserva);
        return Map.of("idReserva", r.getIdReserva(), "estadoReserva", r.getEstadoReserva());
    }
}
