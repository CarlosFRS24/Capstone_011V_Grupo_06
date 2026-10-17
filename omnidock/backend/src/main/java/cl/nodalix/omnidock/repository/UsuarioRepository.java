package cl.nodalix.omnidock.repository;

import cl.nodalix.omnidock.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmailInstitucionalIgnoreCase(String email);
    boolean existsByEmailInstitucionalIgnoreCase(String email);
    boolean existsByRut(String rut);
}
