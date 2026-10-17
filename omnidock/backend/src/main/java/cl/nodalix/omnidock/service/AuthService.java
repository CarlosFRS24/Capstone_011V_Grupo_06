package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.domain.Estados;
import cl.nodalix.omnidock.domain.Usuario;
import cl.nodalix.omnidock.dto.Dtos.*;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.repository.UsuarioRepository;
import cl.nodalix.omnidock.security.CurrentUser;
import cl.nodalix.omnidock.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarios;
    private final JwtService jwt;
    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    @Transactional
    public LoginResponse login(LoginRequest req) {
        Usuario u = usuarios.findByEmailInstitucionalIgnoreCase(req.emailInstitucional().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));
        if (!passwordOk(u.getPasswordPrototipo(), req.passwordPrototipo())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
        }
        if (!Estados.USR_VIGENTE.equals(u.getEstadoSincronizacion())) {
            throw ApiException.forbidden("Usuario " + u.getEstadoSincronizacion().toLowerCase() + ": acceso denegado");
        }
        u.setFechaUltimoAcceso(java.time.Instant.now());
        return new LoginResponse(jwt.generar(u), UsuarioDto.from(u));
    }

    @Transactional(readOnly = true)
    public UsuarioDto me() {
        return usuarios.findById(CurrentUser.get().idUsuario()).map(UsuarioDto::from)
                .orElseThrow(() -> ApiException.notFound("Usuario no existe"));
    }

    /** Prototipo: la clave puede estar en texto plano (PASSWORD_PROTOTIPO) o como hash BCrypt. */
    private boolean passwordOk(String stored, String given) {
        if (stored == null || given == null) return false;
        if (stored.startsWith("$2")) return bcrypt.matches(given, stored);
        return MessageDigest.isEqual(stored.getBytes(StandardCharsets.UTF_8), given.getBytes(StandardCharsets.UTF_8));
    }
}
