package cl.nodalix.omnidock.security;

import cl.nodalix.omnidock.domain.Estados;
import cl.nodalix.omnidock.repository.UsuarioRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/** Se instancia en SecurityConfig (no es @Component para evitar doble registro). */
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwt;
    private final UsuarioRepository usuarios;

    public JwtAuthFilter(JwtService jwt, UsuarioRepository usuarios) {
        this.jwt = jwt;
        this.usuarios = usuarios;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) {
            try {
                AuthUser t = jwt.parsear(h.substring(7));
                // DEF-03: se revisa el usuario en la base en cada request. Si fue bloqueado, desactivado
                // o eliminado después de emitir el token, el token deja de servir (queda sin autenticar -> 401).
                // El rol también se toma de la base, así un cambio de rol aplica de inmediato.
                usuarios.findById(t.idUsuario())
                        .filter(u -> Estados.USR_VIGENTE.equals(u.getEstadoSincronizacion()))
                        .ifPresent(u -> {
                            AuthUser actual = new AuthUser(u.getIdUsuario(), u.getIdRol());
                            var auth = new UsernamePasswordAuthenticationToken(actual, null,
                                    List.of(new SimpleGrantedAuthority(actual.isAdmin() ? "ROLE_ADMIN" : "ROLE_USUARIO")));
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        });
            } catch (JwtException | IllegalArgumentException e) {
                // token inválido o expirado: queda sin autenticar y el entry point responde 401
            }
        }
        chain.doFilter(req, res);
    }
}
