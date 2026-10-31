package cl.nodalix.omnidock.repository;

import cl.nodalix.omnidock.domain.Reserva;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("select r from Reserva r where r.idReserva = :id")
    Optional<Reserva> findForUpdate(@Param("id") Long id);

    List<Reserva> findByIdUsuarioAndEstadoReserva(Long idUsuario, String estadoReserva);
    boolean existsByIdUsuarioAndEstadoReserva(Long idUsuario, String estadoReserva);
    boolean existsByIdBahiaAndEstadoReserva(Long idBahia, String estadoReserva);
    List<Reserva> findByEstadoReservaAndFechaExpiracionBefore(String estadoReserva, Instant limite);
    List<Reserva> findByIdBahiaAndEstadoReserva(Long idBahia, String estadoReserva);
}
