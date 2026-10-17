package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.domain.TicketMantenimiento;
import cl.nodalix.omnidock.dto.Dtos.*;
import cl.nodalix.omnidock.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {
    private final TicketService service;

    @GetMapping
    public List<TicketMantenimiento> listar(@RequestParam(required = false) String estado) { return service.listar(estado); }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@Valid @RequestBody TicketCreate req) {
        TicketMantenimiento t = service.crear(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("idTicket", t.getIdTicket(), "mensaje", "Ticket registrado"));
    }

    @PutMapping("/{id}")
    public Map<String, Object> actualizar(@PathVariable Long id, @RequestBody TicketUpdate req) {
        TicketMantenimiento t = service.actualizar(id, req);
        return Map.of("idTicket", t.getIdTicket(), "mensaje", "Ticket actualizado");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
