package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.dto.Dtos.EmbedTokenResponse;
import cl.nodalix.omnidock.dto.Dtos.ResumenAnaliticaDto;
import cl.nodalix.omnidock.service.AnaliticaService;
import cl.nodalix.omnidock.service.ResumenAnaliticaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analitica")
@RequiredArgsConstructor
public class AnaliticaController {
    private final AnaliticaService service;
    private final ResumenAnaliticaService resumen;

    /** Informe de Power BI embebido. Es opcional: solo responde si se configura PBI_EMBED_URL o el modo embedded. */
    @GetMapping("/embed-token")
    public EmbedTokenResponse embedToken() { return service.embedToken(); }

    /** Datos de los gráficos del panel. dias = 7, 30, 90 o 0 (todo el historial). Solo admin. */
    @GetMapping("/resumen")
    public ResumenAnaliticaDto resumen(@RequestParam(defaultValue = "0") int dias) { return resumen.resumen(dias); }
}
