package cl.nodalix.omnidock.repository;

import cl.nodalix.omnidock.domain.Bahia;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface BahiaRepository extends JpaRepository<Bahia, Long>, JpaSpecificationExecutor<Bahia> {

    /** SELECT ... FOR UPDATE WAIT 3: serializa la asignación de una misma bahía (evita doble reserva). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("select b from Bahia b where b.idBahia = :id")
    Optional<Bahia> findForUpdate(@Param("id") Long id);

    Optional<Bahia> findByCodigoIot(String codigoIot);
    boolean existsByCodigoIot(String codigoIot);
}
