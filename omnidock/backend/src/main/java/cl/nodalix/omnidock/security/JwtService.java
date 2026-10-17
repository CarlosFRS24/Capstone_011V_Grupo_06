package cl.nodalix.omnidock.security;

import cl.nodalix.omnidock.domain.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expMinutos;

    public JwtService(@Value("${omnidock.jwt.secret}") String secret,
                      @Value("${omnidock.jwt.expiration-minutes}") long expMinutos) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); // mínimo 32 bytes
        this.expMinutos = expMinutos;
    }

    public String generar(Usuario u) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(u.getIdUsuario()))
                .claim("idRol", u.getIdRol())
                .claim("email", u.getEmailInstitucional())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expMinutos, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public AuthUser parsear(String token) {
        Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        return new AuthUser(Long.parseLong(c.getSubject()), c.get("idRol", Integer.class));
    }
}
