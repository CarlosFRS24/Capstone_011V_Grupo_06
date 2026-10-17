package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.domain.Usuario;
import cl.nodalix.omnidock.dto.Dtos.*;
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
