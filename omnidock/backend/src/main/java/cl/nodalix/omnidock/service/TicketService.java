package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.domain.*;
import cl.nodalix.omnidock.dto.Dtos.*;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.repository.*;
import cl.nodalix.omnidock.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TicketService {

    private static final List<String> ABIERTOS = List.of(Estados.TK_ABIERTO, Estados.TK_EN_REVISION);
    private static final Set<String> VALIDOS = Set.of(Estados.TK_ABIERTO, Estados.TK_EN_REVISION, Estados.TK_RESUELTO, Estados.TK_ANULADO);

    private final TicketMantenimientoRepository repo;
    private final BahiaRepository bahias;

    @Transactional(readOnly = true)
    public List<TicketMantenimiento> listar(String estado) {
        return (estado == null || estado.isBlank()) ? repo.findAllByOrderByFechaReporteDesc()
                : repo.findByEstadoTicketOrderByFechaReporteDesc(estado.toUpperCase());
    }

    /** HU-09: al abrir un ticket la bahía deja de ser asignable (FUERA_DE_SERVICIO). */
    @Transactional
    public TicketMantenimiento crear(TicketCreate req) {
        Bahia b = bahias.findForUpdate(req.idBahia()).orElseThrow(() -> ApiException.notFound("Bahía no encontrada"));
        TicketMantenimiento t = new TicketMantenimiento();
        t.setIdBahia(b.getIdBahia());
        t.setReportadoPor(CurrentUser.get().idUsuario());
        t.setDescripcionFalla(req.descripcionFalla());
        t.setFechaReporte(Instant.now());
        t.setEstadoTicket(Estados.TK_ABIERTO);
        // Si hay un usuario usando la bahía (OCUPADA) no se le quita: pasará a FUERA_DE_SERVICIO al hacer check-out.
        if (b.getIdEstado() == Estados.BAHIA_DISPONIBLE || b.getIdEstado() == Estados.BAHIA_RESERVADA)
            b.setIdEstado(Estados.BAHIA_FUERA_DE_SERVICIO);
        return repo.save(t);
    }

    @Transactional
    public TicketMantenimiento actualizar(Long id, TicketUpdate req) {
        TicketMantenimiento t = repo.findById(id).orElseThrow(() -> ApiException.notFound("Ticket no encontrado"));
        if (req.descripcionFalla() != null) t.setDescripcionFalla(req.descripcionFalla());
        if (req.estadoTicket() != null) {
            String nuevo = req.estadoTicket().toUpperCase();
            if (nuevo.equals("CERRADO")) nuevo = Estados.TK_RESUELTO; // alias del contrato del ERS
            if (!VALIDOS.contains(nuevo)) throw ApiException.badRequest("estadoTicket inválido: " + VALIDOS);
            t.setEstadoTicket(nuevo);
            if (nuevo.equals(Estados.TK_RESUELTO)) t.setFechaResolucion(req.fechaResolucion() != null ? req.fechaResolucion() : Instant.now());
            if (!ABIERTOS.contains(nuevo)) liberarBahiaSiCorresponde(t.getIdBahia());
        }
        return t;
    }

    /** Borrado lógico (ANULADO). */
    @Transactional
    public void eliminar(Long id) {
        TicketMantenimiento t = repo.findById(id).orElseThrow(() -> ApiException.notFound("Ticket no encontrado"));
        t.setEstadoTicket(Estados.TK_ANULADO);
        liberarBahiaSiCorresponde(t.getIdBahia());
    }

    private void liberarBahiaSiCorresponde(Long idBahia) {
        repo.flush();
        bahias.findForUpdate(idBahia).ifPresent(b -> {
            if (b.getIdEstado() == Estados.BAHIA_FUERA_DE_SERVICIO && !repo.existsByIdBahiaAndEstadoTicketIn(idBahia, ABIERTOS))
                b.setIdEstado(Estados.BAHIA_DISPONIBLE);
        });
    }
}
