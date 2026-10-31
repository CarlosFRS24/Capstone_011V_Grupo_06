package cl.nodalix.omnidock.repository;

import cl.nodalix.omnidock.domain.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findTop30ByIdUsuarioOrderByFechaCreacionDesc(Long idUsuario);
    List<Notificacion> findByIdUsuarioAndLeida(Long idUsuario, Character leida);
    long countByIdUsuarioAndLeida(Long idUsuario, Character leida);
}
