package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.domain.Usuario;
import cl.nodalix.omnidock.dto.Dtos.*;
import cl.nodalix.omnidock.service.FaltaService;
import cl.nodalix.omnidock.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {
    private final UsuarioService service;
    private final FaltaService faltas;

    @GetMapping
    public List<UsuarioDto> listar() { return service.listar(); }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@Valid @RequestBody UsuarioCreate req) {
        Usuario u = service.crear(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("idUsuario", u.getIdUsuario(), "mensaje", "Usuario creado"));
    }

    @PutMapping("/{id}")
    public Map<String, Object> actualizar(@PathVariable Long id, @RequestBody UsuarioUpdate req) {
        Usuario u = service.actualizar(id, req);
        return Map.of("idUsuario", u.getIdUsuario(), "mensaje", "Usuario actualizado");
    }

    /** Faltas del usuario (vigentes y anuladas). */
    @GetMapping("/{id}/faltas")
    public List<FaltaDto> faltas(@PathVariable Long id) { return faltas.deUsuario(id); }

    /** Anula las faltas vigentes para que vuelva a poder reservar. */
    @PutMapping("/{id}/desbloquear")
    public Map<String, Object> desbloquear(@PathVariable Long id) {
        int n = faltas.desbloquear(id);
        return Map.of("idUsuario", id, "faltasAnuladas", n, "mensaje", "Usuario desbloqueado para reservar");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
