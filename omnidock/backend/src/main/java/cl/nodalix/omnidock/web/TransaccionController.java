package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.dto.Dtos.*;
import cl.nodalix.omnidock.service.TransaccionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transacciones")
@RequiredArgsConstructor
public class TransaccionController {
    private final TransaccionService service;

    @PostMapping("/iniciar")
    public TransaccionDto iniciar(@Valid @RequestBody IniciarRequest req) { return service.iniciar(req); }

    @PostMapping("/{idTransaccion}/finalizar")
    public TransaccionDto finalizar(@PathVariable Long idTransaccion) { return service.finalizar(idTransaccion); }

    @GetMapping("/usuario/{idUsuario}")
    public List<HistorialDto> historial(@PathVariable Long idUsuario) { return service.historial(idUsuario); }
}
