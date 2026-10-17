package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.domain.Bahia;
import cl.nodalix.omnidock.dto.Dtos.BahiaRequest;
import cl.nodalix.omnidock.service.BahiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bahias")
@RequiredArgsConstructor
public class BahiaController {
    private final BahiaService service;

    @GetMapping
    public List<Bahia> listar(@RequestParam(required = false) Integer idEstado,
                              @RequestParam(required = false) Long idTipoPermitido,
                              @RequestParam(required = false) String ubicacion) {
        return service.listar(idEstado, idTipoPermitido, ubicacion);
    }

    @GetMapping("/{id}")
    public Bahia obtener(@PathVariable Long id) { return service.obtener(id); }

    /** Para resolver el QR de un rack: el QR contiene el código IoT (ej. RACK-01). */
    @GetMapping("/codigo/{codigoIot}")
    public Bahia porCodigo(@PathVariable String codigoIot) { return service.porCodigo(codigoIot); }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@RequestBody BahiaRequest req) {
        Bahia b = service.crear(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("idBahia", b.getIdBahia(), "mensaje", "Bahía creada"));
    }

    @PutMapping("/{id}")
    public Map<String, Object> actualizar(@PathVariable Long id, @RequestBody BahiaRequest req) {
        Bahia b = service.actualizar(id, req);
        return Map.of("idBahia", b.getIdBahia(), "mensaje", "Bahía actualizada");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
