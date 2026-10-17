package cl.nodalix.omnidock.repository;

import cl.nodalix.omnidock.domain.TransaccionUso;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface TransaccionUsoRepository extends JpaRepository<TransaccionUso, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("select t from TransaccionUso t where t.idTransaccion = :id")
    Optional<TransaccionUso> findForUpdate(@Param("id") Long id);

    List<TransaccionUso> findByIdUsuarioOrderByFechaInicioDesc(Long idUsuario);
    boolean existsByIdBahiaAndEstadoTransaccion(Long idBahia, String estadoTransaccion);
}
