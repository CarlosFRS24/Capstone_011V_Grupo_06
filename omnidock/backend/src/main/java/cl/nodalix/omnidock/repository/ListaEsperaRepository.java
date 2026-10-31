package cl.nodalix.omnidock.repository;

import cl.nodalix.omnidock.domain.ListaEspera;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ListaEsperaRepository extends JpaRepository<ListaEspera, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("select l from ListaEspera l where l.idEspera = :id")
    Optional<ListaEspera> findForUpdate(@Param("id") Long id);

    /** Fila de un tipo de vehículo, por orden de llegada. */
    List<ListaEspera> findByEstadoEsperaAndIdTipoVehiculoOrderByFechaRegistroAsc(String estado, Long idTipoVehiculo);
    List<ListaEspera> findByEstadoEsperaOrderByFechaRegistroAsc(String estado);
    List<ListaEspera> findByEstadoEsperaInOrderByFechaRegistroAsc(Collection<String> estados);
    List<ListaEspera> findByEstadoEsperaAndFechaLimiteOfertaBefore(String estado, Instant limite);
    List<ListaEspera> findByIdBahiaOfrecidaAndEstadoEspera(Long idBahia, String estado);
    boolean existsByIdBahiaOfrecidaAndEstadoEspera(Long idBahia, String estado);
    Optional<ListaEspera> findFirstByIdUsuarioAndEstadoEsperaIn(Long idUsuario, Collection<String> estados);
    long countByEstadoEsperaAndIdTipoVehiculoAndFechaRegistroBefore(String estado, Long idTipoVehiculo, Instant fecha);
}
