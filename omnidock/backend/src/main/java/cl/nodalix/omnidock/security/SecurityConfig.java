package cl.nodalix.omnidock.security;

import cl.nodalix.omnidock.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtService jwt, UsuarioRepository usuarios,
                                    @Value("${omnidock.cors.origins}") List<String> origins) throws Exception {
        http
            .csrf(c -> c.disable())
            .cors(c -> c.configurationSource(corsSource(origins)))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                // públicos
                .requestMatchers("/api/v1/auth/login", "/api/v1/iot/telemetria", "/api/mock-iot/**",
                        "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                // solo administrador (RBAC)
                .requestMatchers(HttpMethod.POST, "/api/v1/bahias").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/bahias/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/bahias/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/usuarios", "/api/v1/usuarios/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/lista-espera/activa").hasRole("ADMIN")
                .requestMatchers("/api/v1/analitica/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/tickets", "/api/v1/tickets/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/tickets/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/tickets/**").hasRole("ADMIN")
                // todo lo demás: cualquier usuario autenticado (la propiedad del recurso se valida en los servicios)
                .anyRequest().authenticated())
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> json(res, 401, "UNAUTHORIZED", "No autenticado o token inválido/expirado"))
                .accessDeniedHandler((req, res, ex) -> json(res, 403, "FORBIDDEN", "Sin permisos para esta operación")))
            .addFilterBefore(new JwtAuthFilter(jwt, usuarios), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static void json(HttpServletResponse res, int status, String error, String msg) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"error\":\"" + error + "\",\"mensaje\":\"" + msg + "\"}");
    }

    private static CorsConfigurationSource corsSource(List<String> origins) {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOriginPatterns(origins);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
