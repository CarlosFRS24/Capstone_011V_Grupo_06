package cl.nodalix.omnidock.repository;

import cl.nodalix.omnidock.domain.TicketMantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;

public interface TicketMantenimientoRepository extends JpaRepository<TicketMantenimiento, Long> {
    List<TicketMantenimiento> findAllByOrderByFechaReporteDesc();
    List<TicketMantenimiento> findByEstadoTicketOrderByFechaReporteDesc(String estadoTicket);
    boolean existsByIdBahiaAndEstadoTicketIn(Long idBahia, Collection<String> estados);
}
