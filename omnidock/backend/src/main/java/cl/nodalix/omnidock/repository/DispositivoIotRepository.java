package cl.nodalix.omnidock.repository;

import cl.nodalix.omnidock.domain.DispositivoIot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DispositivoIotRepository extends JpaRepository<DispositivoIot, Long> {
    Optional<DispositivoIot> findByDireccionMac(String direccionMac);
    Optional<DispositivoIot> findFirstByIdBahia(Long idBahia);
}
