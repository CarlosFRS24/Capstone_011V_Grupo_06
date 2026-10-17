package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.dto.Dtos.EmbedTokenResponse;
import cl.nodalix.omnidock.service.AnaliticaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analitica")
@RequiredArgsConstructor
public class AnaliticaController {
    private final AnaliticaService service;

    @GetMapping("/embed-token")
    public EmbedTokenResponse embedToken() { return service.embedToken(); }
}
