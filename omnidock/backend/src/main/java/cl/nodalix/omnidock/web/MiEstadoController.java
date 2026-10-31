package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.dto.Dtos.FaltaDto;
import cl.nodalix.omnidock.dto.Dtos.MiEstadoDto;
import cl.nodalix.omnidock.security.CurrentUser;
import cl.nodalix.omnidock.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Un solo llamado que la app hace cada 30 s para saber faltas, bloqueo, horario,
 * su lugar en la lista de espera y cuántos avisos tiene sin leer.
 */
@RestController
@RequestMapping("/api/v1/mi-estado")
@RequiredArgsConstructor
public class MiEstadoController {
    private final FaltaService faltas;
    private final HorarioService horario;
    private final ListaEsperaService listaEspera;
    private final NotificacionService avisos;
    private final ReservaService reservas;

    @GetMapping
    public MiEstadoDto estado() {
        Long id = CurrentUser.get().idUsuario();
        long vigentes = faltas.vigentes(id);
        return new MiEstadoDto(vigentes, faltas.maxFaltas(), vigentes >= faltas.maxFaltas(), reservas.minutosExpiracion(),
                horario.info(), listaEspera.mia(id), avisos.noLeidas(id));
    }

    /** Mis faltas (vigentes y anuladas). */
    @GetMapping("/faltas")
    public List<FaltaDto> misFaltas() { return faltas.deUsuario(CurrentUser.get().idUsuario()); }
}
