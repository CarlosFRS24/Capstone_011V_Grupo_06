package cl.nodalix.omnidock.web;

import cl.nodalix.omnidock.dto.Dtos.*;
import cl.nodalix.omnidock.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService service;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) { return service.login(req); }

    @GetMapping("/me")
    public UsuarioDto me() { return service.me(); }
}
