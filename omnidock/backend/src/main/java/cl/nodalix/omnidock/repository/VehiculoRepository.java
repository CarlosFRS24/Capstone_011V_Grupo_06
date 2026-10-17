package cl.nodalix.omnidock.repository;

import cl.nodalix.omnidock.domain.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {
    List<Vehiculo> findByIdUsuarioAndEstadoVehiculo(Long idUsuario, String estadoVehiculo);
}
