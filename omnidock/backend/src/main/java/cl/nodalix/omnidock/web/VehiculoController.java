package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.domain.Vehiculo;
import cl.nodalix.omnidock.domain.TipoVehiculo;
import cl.nodalix.omnidock.dto.Dtos.*;
import cl.nodalix.omnidock.repository.TipoVehiculoRepository;
import cl.nodalix.omnidock.service.VehiculoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class VehiculoController {
    private final VehiculoService service;
    private final TipoVehiculoRepository tipos;

    @PostMapping("/api/v1/vehiculos")
    public ResponseEntity<Map<String, Object>> crear(@Valid @RequestBody VehiculoCreate req) {
        Vehiculo v = service.crear(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("idVehiculo", v.getIdVehiculo(), "mensaje", "Vehículo registrado exitosamente"));
    }

    @GetMapping("/api/v1/vehiculos/usuario/{idUsuario}")
    public List<VehiculoDto> listar(@PathVariable Long idUsuario) { return service.listarPorUsuario(idUsuario); }

    @DeleteMapping("/api/v1/vehiculos/{idVehiculo}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idVehiculo) {
        service.eliminar(idVehiculo);
        return ResponseEntity.noContent().build();
    }

    /** Catálogo para el selector "tipo de vehículo" al registrar un vehículo en la app. */
    @GetMapping("/api/v1/catalogos/tipos-vehiculo")
    public List<TipoVehiculo> tiposVehiculo() { return tipos.findAll(); }
}
