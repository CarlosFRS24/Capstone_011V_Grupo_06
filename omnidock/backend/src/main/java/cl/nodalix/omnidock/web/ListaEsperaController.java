package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.domain.Reserva;
import cl.nodalix.omnidock.dto.Dtos.EsperaAdminDto;
import cl.nodalix.omnidock.dto.Dtos.EsperaDto;
import cl.nodalix.omnidock.dto.Dtos.UnirseEsperaRequest;
import cl.nodalix.omnidock.security.CurrentUser;
import cl.nodalix.omnidock.service.ListaEsperaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Lista de espera cuando no hay bahías libres. */
@RestController
@RequestMapping("/api/v1/lista-espera")
@RequiredArgsConstructor
public class ListaEsperaController {
    private final ListaEsperaService service;

    /** Unirse con un vehículo. 409 si hay bahías libres para ese tipo o ya está en la lista. */
    @PostMapping
    public ResponseEntity<EsperaDto> unirse(@Valid @RequestBody UnirseEsperaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.unirse(req));
    }

    /** Mi lugar en la lista (204 si no estoy). */
    @GetMapping("/mia")
    public ResponseEntity<EsperaDto> mia() {
        EsperaDto e = service.mia(CurrentUser.get().idUsuario());
        return e == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(e);
    }

    /** Salir de la lista (si tenía una bahía ofrecida, pasa al siguiente). */
    @DeleteMapping
    public ResponseEntity<Void> salir() {
        service.salir();
        return ResponseEntity.noContent().build();
    }

    /** Confirmar la bahía ofrecida: devuelve la reserva creada (60 min para llegar). */
    @PostMapping("/confirmar")
    public ResponseEntity<Reserva> confirmar() {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.confirmar());
    }

    /** Admin: quiénes esperan ahora. */
    @GetMapping("/activa")
    public List<EsperaAdminDto> activa() { return service.activa(); }
}
