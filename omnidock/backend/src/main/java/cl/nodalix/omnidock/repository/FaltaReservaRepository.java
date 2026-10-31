package cl.nodalix.omnidock.repository;

import cl.nodalix.omnidock.domain.FaltaReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface FaltaReservaRepository extends JpaRepository<FaltaReserva, Long> {
    long countByIdUsuarioAndEstadoFalta(Long idUsuario, String estadoFalta);
    List<FaltaReserva> findByIdUsuarioAndEstadoFalta(Long idUsuario, String estadoFalta);
    List<FaltaReserva> findByIdUsuarioOrderByFechaFaltaDesc(Long idUsuario);
    boolean existsByIdReserva(Long idReserva);

    /** Faltas vigentes de todos los usuarios: [idUsuario, cantidad]. Para la lista de usuarios del panel. */
    @Query("select f.idUsuario, count(f) from FaltaReserva f where f.estadoFalta = :estado group by f.idUsuario")
    List<Object[]> contarPorUsuario(@Param("estado") String estado);
}
