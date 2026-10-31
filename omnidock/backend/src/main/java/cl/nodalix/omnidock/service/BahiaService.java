package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.domain.Bahia;
import cl.nodalix.omnidock.domain.DispositivoIot;
import cl.nodalix.omnidock.domain.Estados;
import cl.nodalix.omnidock.dto.Dtos.BahiaRequest;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.repository.BahiaRepository;
import cl.nodalix.omnidock.repository.DispositivoIotRepository;
import cl.nodalix.omnidock.repository.ListaEsperaRepository;
import cl.nodalix.omnidock.repository.ReservaRepository;
import cl.nodalix.omnidock.repository.TicketMantenimientoRepository;
import cl.nodalix.omnidock.repository.TipoVehiculoRepository;
import cl.nodalix.omnidock.repository.TransaccionUsoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BahiaService {

    private final BahiaRepository repo;
    private final DispositivoIotRepository dispositivos;
    private final TipoVehiculoRepository tipos;
    private final ReservaRepository reservas;
    private final TransaccionUsoRepository transacciones;
    private final TicketMantenimientoRepository tickets;
    private final ListaEsperaRepository listaEsperaRepo;
    private final ListaEsperaService listaEspera;

    @Transactional(readOnly = true)
    public List<Bahia> listar(Integer idEstado, Long idTipoPermitido, String ubicacion) {
        Specification<Bahia> spec = (r, q, cb) -> cb.conjunction();
        if (idEstado != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("idEstado"), idEstado));
        if (idTipoPermitido != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("idTipoPermitido"), idTipoPermitido));
        if (ubicacion != null && !ubicacion.isBlank()) {
            String patron = "%" + ubicacion.trim().toLowerCase() + "%";
            spec = spec.and((r, q, cb) -> cb.like(cb.lower(r.get("ubicacion")), patron));
        }
        return repo.findAll(spec, Sort.by("idBahia"));
    }

    @Transactional(readOnly = true)
    public Bahia obtener(Long id) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("Bahía no encontrada"));
    }

    @Transactional(readOnly = true)
    public Bahia porCodigo(String codigoIot) {
        return repo.findByCodigoIot(codigoIot).orElseThrow(() -> ApiException.notFound("No existe una bahía con código " + codigoIot));
    }

    @Transactional
    public Bahia crear(BahiaRequest req) {
        if (req.codigoIot() == null || req.codigoIot().isBlank()) throw ApiException.badRequest("codigoIot es obligatorio");
        if (req.ubicacion() == null || req.ubicacion().isBlank()) throw ApiException.badRequest("ubicacion es obligatoria");
        if (req.idTipoPermitido() == null || !tipos.existsById(req.idTipoPermitido()))
            throw ApiException.badRequest("idTipoPermitido inválido");
        if (repo.existsByCodigoIot(req.codigoIot())) throw ApiException.conflict("Ya existe una bahía con ese codigoIot");
        int estado = req.idEstado() == null ? Estados.BAHIA_DISPONIBLE : req.idEstado();
        validarEstado(estado);

        Bahia b = new Bahia();
        b.setCodigoIot(req.codigoIot());
        b.setUbicacion(req.ubicacion());
        b.setIdEstado(estado);
        b.setIdTipoPermitido(req.idTipoPermitido());
        b = repo.save(b);

        if (req.direccionMac() != null && !req.direccionMac().isBlank()) {
            if (dispositivos.findByDireccionMac(req.direccionMac()).isPresent())
                throw ApiException.conflict("Ya existe un dispositivo con esa MAC");
            DispositivoIot d = new DispositivoIot();
            d.setIdBahia(b.getIdBahia());
            d.setDireccionMac(req.direccionMac());
            d.setEstadoConexion("OFFLINE");
            dispositivos.save(d);
        }
        listaEspera.bahiaLiberada(b);   // una bahía nueva libre se ofrece a la lista de espera
        return b;
    }

    @Transactional
    public Bahia actualizar(Long id, BahiaRequest req) {
        Bahia b = repo.findForUpdate(id).orElseThrow(() -> ApiException.notFound("Bahía no encontrada"));
        if (req.ubicacion() != null) b.setUbicacion(req.ubicacion());
        if (req.idTipoPermitido() != null) {
            if (!tipos.existsById(req.idTipoPermitido())) throw ApiException.badRequest("idTipoPermitido inválido");
            b.setIdTipoPermitido(req.idTipoPermitido());
        }
        if (req.idEstado() != null) {
            validarEstado(req.idEstado());
            int anterior = b.getIdEstado();
            if (req.idEstado() == Estados.BAHIA_DISPONIBLE) validarPuedeQuedarDisponible(b.getIdBahia());
            b.setIdEstado(req.idEstado());
            // lista de espera: ofrecer la bahía o cancelar lo que estaba sobre ella
            if (req.idEstado() == Estados.BAHIA_FUERA_DE_SERVICIO && anterior != Estados.BAHIA_FUERA_DE_SERVICIO) listaEspera.bahiaRetirada(b);
            if (req.idEstado() == Estados.BAHIA_DISPONIBLE && anterior != Estados.BAHIA_DISPONIBLE) listaEspera.bahiaLiberada(b);
        }
        return b;
    }

    /** Borrado lógico: la bahía queda FUERA_DE_SERVICIO (no asignable) para conservar el historial. */
    @Transactional
    public void eliminar(Long id) {
        Bahia b = repo.findForUpdate(id).orElseThrow(() -> ApiException.notFound("Bahía no encontrada"));
        b.setIdEstado(Estados.BAHIA_FUERA_DE_SERVICIO);
        listaEspera.bahiaRetirada(b);   // cancela la reserva u oferta sin falta
    }

    /**
     * DEF-04: una bahía no puede quedar DISPONIBLE a mano si todavía tiene una reserva pendiente,
     * un uso activo o un ticket de mantención abierto. Primero hay que cerrar eso (cancelar la reserva,
     * hacer el check-out o resolver el ticket) y el sistema la libera solo.
     */
    private void validarPuedeQuedarDisponible(Long idBahia) {
        if (reservas.existsByIdBahiaAndEstadoReserva(idBahia, Estados.RES_PENDIENTE))
            throw ApiException.conflict("La bahía tiene una reserva pendiente; cancélala antes de dejarla disponible");
        if (listaEsperaRepo.existsByIdBahiaOfrecidaAndEstadoEspera(idBahia, Estados.ESP_OFRECIDA))
            throw ApiException.conflict("La bahía está ofrecida a alguien de la lista de espera; espera a que confirme o venzan sus 15 minutos");
        if (transacciones.existsByIdBahiaAndEstadoTransaccion(idBahia, Estados.TX_ACTIVA))
            throw ApiException.conflict("La bahía está en uso; debe terminar la sesión antes de dejarla disponible");
        if (tickets.existsByIdBahiaAndEstadoTicketIn(idBahia, List.of(Estados.TK_ABIERTO, Estados.TK_EN_REVISION)))
            throw ApiException.conflict("La bahía tiene un ticket de mantención abierto; resuélvelo antes de dejarla disponible");
    }

    private void validarEstado(int e) {
        if (e < Estados.BAHIA_DISPONIBLE || e > Estados.BAHIA_FUERA_DE_SERVICIO) throw ApiException.badRequest("idEstado inválido");
    }
}
