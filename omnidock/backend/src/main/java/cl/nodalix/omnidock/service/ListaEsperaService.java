package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.domain.*;
import cl.nodalix.omnidock.dto.Dtos.EsperaAdminDto;
import cl.nodalix.omnidock.dto.Dtos.EsperaDto;
import cl.nodalix.omnidock.dto.Dtos.UnirseEsperaRequest;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.repository.*;
import cl.nodalix.omnidock.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Lista de espera.
 * Si no hay bahías libres para el tipo de vehículo, el usuario se une a la lista (una vez a la vez).
 * Cuando una bahía queda DISPONIBLE se le guarda al primero de la fila (RESERVADA) por 15 minutos y se le avisa en la app.
 * Si confirma se crea su reserva normal (60 min para llegar). Si no confirma, sale de la lista sin falta y pasa el siguiente.
 * Al terminar el horario de reservas del día la lista se cierra.
 */
@Service
@RequiredArgsConstructor
public class ListaEsperaService {

    private static final List<String> ACTIVOS = List.of(Estados.ESP_ESPERANDO, Estados.ESP_OFRECIDA);

    private final ListaEsperaRepository repo;
    private final BahiaRepository bahias;
    private final ReservaRepository reservas;
    private final VehiculoRepository vehiculos;
    private final UsuarioRepository usuarios;
    private final HorarioService horario;
    private final FaltaService faltas;
    private final NotificacionService avisos;

    @Value("${omnidock.lista-espera.minutos-oferta:15}")
    private long minutosOferta;

    @Value("${omnidock.reserva.minutos-expiracion}")
    private long minutosExpiracion;

    // ------------------------------------------------------------------ acciones del usuario

    @Transactional
    public EsperaDto unirse(UnirseEsperaRequest req) {
        Long idUsuario = CurrentUser.get().idUsuario();
        Usuario u = usuarios.findById(idUsuario).orElseThrow(() -> ApiException.notFound("Usuario no existe"));
        if (!Estados.USR_VIGENTE.equals(u.getEstadoSincronizacion())) throw ApiException.forbidden("Usuario no vigente");
        faltas.validarNoBloqueado(idUsuario);
        horario.validarReservasAbiertas();

        Vehiculo v = vehiculos.findById(req.idVehiculo()).orElseThrow(() -> ApiException.notFound("Vehículo no encontrado"));
        if (!v.getIdUsuario().equals(idUsuario) || !Estados.VEH_ACTIVO.equals(v.getEstadoVehiculo()))
            throw ApiException.badRequest("El vehículo no pertenece al usuario o está inactivo");

        if (reservas.existsByIdUsuarioAndEstadoReserva(idUsuario, Estados.RES_PENDIENTE))
            throw ApiException.conflict("Ya tienes una reserva pendiente");
        if (repo.findFirstByIdUsuarioAndEstadoEsperaIn(idUsuario, ACTIVOS).isPresent())
            throw ApiException.conflict("Ya estás en la lista de espera");
        if (bahias.existsByIdTipoPermitidoAndIdEstado(v.getIdTipoVehiculo(), Estados.BAHIA_DISPONIBLE))
            throw ApiException.conflict("Hay bahías libres para tu vehículo; resérvala directamente");

        ListaEspera e = new ListaEspera();
        e.setIdUsuario(idUsuario);
        e.setIdVehiculo(v.getIdVehiculo());
        e.setIdTipoVehiculo(v.getIdTipoVehiculo());
        e.setFechaRegistro(Instant.now());
        e.setEstadoEspera(Estados.ESP_ESPERANDO);
        e = repo.save(e);
        return dto(e);
    }

    /** Salir de la lista. Si tenía una bahía ofrecida, se libera y pasa al siguiente. */
    @Transactional
    public void salir() {
        Long idUsuario = CurrentUser.get().idUsuario();
        ListaEspera e = repo.findFirstByIdUsuarioAndEstadoEsperaIn(idUsuario, ACTIVOS)
                .orElseThrow(() -> ApiException.notFound("No estás en la lista de espera"));
        cerrar(e.getIdEspera(), Estados.ESP_CANCELADA);
    }

    /** Confirmar la bahía ofrecida: se crea la reserva normal. */
    @Transactional
    public Reserva confirmar() {
        Long idUsuario = CurrentUser.get().idUsuario();
        ListaEspera activa = repo.findFirstByIdUsuarioAndEstadoEsperaIn(idUsuario, ACTIVOS)
                .orElseThrow(() -> ApiException.notFound("No estás en la lista de espera"));
        ListaEspera e = repo.findForUpdate(activa.getIdEspera()).orElseThrow();
        if (!Estados.ESP_OFRECIDA.equals(e.getEstadoEspera()))
            throw ApiException.conflict("Todavía no tienes una bahía ofrecida");
        Instant ahora = Instant.now();
        if (e.getFechaLimiteOferta().isBefore(ahora))
            throw ApiException.conflict("Se acabaron los " + minutosOferta + " minutos para confirmar la bahía");

        Bahia b = bahias.findForUpdate(e.getIdBahiaOfrecida()).orElseThrow(() -> ApiException.notFound("Bahía no encontrada"));
        if (b.getIdEstado() != Estados.BAHIA_RESERVADA)
            throw ApiException.conflict("La bahía ofrecida ya no está disponible");

        Reserva r = new Reserva();
        r.setIdUsuario(idUsuario);
        r.setIdBahia(b.getIdBahia());
        r.setIdVehiculo(e.getIdVehiculo());
        r.setFechaSolicitud(ahora);
        r.setFechaExpiracion(horario.vencimiento(ahora, minutosExpiracion));
        r.setEstadoReserva(Estados.RES_PENDIENTE);
        r = reservas.save(r);

        e.setEstadoEspera(Estados.ESP_CONFIRMADA);
        e.setIdReserva(r.getIdReserva());
        e.setFechaCierre(ahora);
        return r;
    }

    @Transactional(readOnly = true)
    public EsperaDto mia(Long idUsuario) {
        return repo.findFirstByIdUsuarioAndEstadoEsperaIn(idUsuario, ACTIVOS).map(this::dto).orElse(null);
    }

    /** Panel admin: quiénes están esperando ahora, por orden de llegada. */
    @Transactional(readOnly = true)
    public List<EsperaAdminDto> activa() {
        List<ListaEspera> lista = repo.findByEstadoEsperaInOrderByFechaRegistroAsc(ACTIVOS);
        Map<Long, Usuario> us = usuarios.findAllById(lista.stream().map(ListaEspera::getIdUsuario).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Usuario::getIdUsuario, Function.identity()));
        Map<Long, Vehiculo> vs = vehiculos.findAllById(lista.stream().map(ListaEspera::getIdVehiculo).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Vehiculo::getIdVehiculo, Function.identity()));
        Map<Long, Bahia> bs = bahias.findAllById(lista.stream().map(ListaEspera::getIdBahiaOfrecida).filter(Objects::nonNull).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Bahia::getIdBahia, Function.identity()));
        Map<Long, Integer> pos = new HashMap<>();
        List<EsperaAdminDto> out = new ArrayList<>();
        for (ListaEspera e : lista) {
            Integer p = null;
            if (Estados.ESP_ESPERANDO.equals(e.getEstadoEspera())) {
                p = pos.merge(e.getIdTipoVehiculo(), 1, Integer::sum);
            }
            Usuario u = us.get(e.getIdUsuario());
            Vehiculo v = vs.get(e.getIdVehiculo());
            Bahia b = e.getIdBahiaOfrecida() == null ? null : bs.get(e.getIdBahiaOfrecida());
            out.add(new EsperaAdminDto(e.getIdEspera(), e.getIdUsuario(), u == null ? null : u.getNombreCompleto(),
                    v == null ? null : v.getIdentificador(), e.getIdTipoVehiculo(), e.getEstadoEspera(), p,
                    e.getFechaRegistro(), b == null ? null : b.getCodigoIot(), e.getFechaLimiteOferta()));
        }
        return out;
    }

    // ------------------------------------------------------------------ ganchos (usan la transacción del que llama)

    /**
     * Una bahía acaba de quedar DISPONIBLE (check-out, cancelación, vencimiento, ticket resuelto o admin).
     * Si hay alguien esperando ese tipo de vehículo, se le ofrece. La bahía debe venir bloqueada (findForUpdate).
     * @return true si se ofreció a alguien
     */
    public boolean bahiaLiberada(Bahia b) {
        if (b.getIdEstado() != Estados.BAHIA_DISPONIBLE) return false;
        if (!horario.reservasAbiertas(Instant.now())) return false;
        for (ListaEspera candidata : repo.findByEstadoEsperaAndIdTipoVehiculoOrderByFechaRegistroAsc(Estados.ESP_ESPERANDO, b.getIdTipoPermitido())) {
            ListaEspera e = repo.findForUpdate(candidata.getIdEspera()).orElse(null);
            if (e == null || !Estados.ESP_ESPERANDO.equals(e.getEstadoEspera())) continue;
            if (!sigueHabilitado(e)) continue;
            ofrecer(e, b);
            return true;
        }
        return false;
    }

    /**
     * Una bahía quedó FUERA_DE_SERVICIO (ticket, alerta IoT o admin). La reserva pendiente se cancela sin falta
     * y si estaba ofrecida a alguien de la lista, esa persona vuelve a esperar con su misma posición.
     */
    public void bahiaRetirada(Bahia b) {
        String codigo = b.getCodigoIot();
        for (Reserva r : reservas.findByIdBahiaAndEstadoReserva(b.getIdBahia(), Estados.RES_PENDIENTE)) {
            r.setEstadoReserva(Estados.RES_CANCELADA);
            avisos.crear(r.getIdUsuario(), Estados.NOTIF_RESERVA_CANCELADA,
                    "Tu reserva en " + codigo + " se canceló porque la bahía quedó fuera de servicio. "
                            + "No cuenta como falta; puedes reservar otra bahía.");
        }
        Set<Long> tipos = new HashSet<>();
        for (ListaEspera e : repo.findByIdBahiaOfrecidaAndEstadoEspera(b.getIdBahia(), Estados.ESP_OFRECIDA)) {
            e.setEstadoEspera(Estados.ESP_ESPERANDO);
            e.setIdBahiaOfrecida(null);
            e.setFechaOferta(null);
            e.setFechaLimiteOferta(null);
            tipos.add(e.getIdTipoVehiculo());
            avisos.crear(e.getIdUsuario(), Estados.NOTIF_OFERTA_VENCIDA,
                    "La bahía " + codigo + " que se te ofreció quedó fuera de servicio. Sigues en la lista de espera con tu misma posición.");
        }
        repo.flush();
        tipos.forEach(this::asignarLibres);
    }

    /** El usuario hizo una reserva normal: sale de la lista (y libera la bahía ofrecida, si tenía). */
    public void salirPorReserva(Long idUsuario) {
        repo.findFirstByIdUsuarioAndEstadoEsperaIn(idUsuario, ACTIVOS)
                .ifPresent(e -> cerrar(e.getIdEspera(), Estados.ESP_CANCELADA));
    }

    // ------------------------------------------------------------------ proceso automático

    /** Cada 30 s: vence ofertas no confirmadas, cierra la lista fuera de horario y ofrece bahías libres que hayan quedado. */
    @Scheduled(fixedDelayString = "${omnidock.reserva.intervalo-expiracion-ms}")
    @Transactional
    public void revisar() {
        Instant ahora = Instant.now();
        for (ListaEspera vencida : repo.findByEstadoEsperaAndFechaLimiteOfertaBefore(Estados.ESP_OFRECIDA, ahora)) {
            String codigo = bahias.findById(vencida.getIdBahiaOfrecida()).map(Bahia::getCodigoIot).orElse("ofrecida");
            if (cerrar(vencida.getIdEspera(), Estados.ESP_VENCIDA)) {
                avisos.crear(vencida.getIdUsuario(), Estados.NOTIF_OFERTA_VENCIDA,
                        "No confirmaste la bahía " + codigo + " a tiempo y saliste de la lista de espera. Puedes volver a unirte.");
            }
        }

        List<ListaEspera> esperando = repo.findByEstadoEsperaOrderByFechaRegistroAsc(Estados.ESP_ESPERANDO);
        if (esperando.isEmpty()) return;
        if (!horario.reservasAbiertas(ahora)) {
            for (ListaEspera e : esperando) {
                e.setEstadoEspera(Estados.ESP_VENCIDA);
                e.setFechaCierre(ahora);
                avisos.crear(e.getIdUsuario(), Estados.NOTIF_LISTA_CERRADA,
                        "Terminó el horario de reservas de hoy y la lista de espera se cerró.");
            }
            return;
        }
        esperando.stream().map(ListaEspera::getIdTipoVehiculo).distinct().forEach(this::asignarLibres);
    }

    // ------------------------------------------------------------------ apoyo

    /** Ofrece las bahías libres de un tipo a quienes esperan, mientras queden ambos. */
    private void asignarLibres(Long idTipo) {
        for (Bahia libre : bahias.findByIdTipoPermitidoAndIdEstadoOrderByIdBahia(idTipo, Estados.BAHIA_DISPONIBLE)) {
            Bahia b = bahias.findForUpdate(libre.getIdBahia()).orElse(null);
            if (b == null) continue;
            if (!bahiaLiberada(b)) return;   // ya no queda nadie esperando
        }
    }

    private void ofrecer(ListaEspera e, Bahia b) {
        Instant ahora = Instant.now();
        Instant limite = ahora.plus(minutosOferta, ChronoUnit.MINUTES);
        e.setEstadoEspera(Estados.ESP_OFRECIDA);
        e.setIdBahiaOfrecida(b.getIdBahia());
        e.setFechaOferta(ahora);
        e.setFechaLimiteOferta(limite);
        b.setIdEstado(Estados.BAHIA_RESERVADA);
        avisos.crear(e.getIdUsuario(), Estados.NOTIF_OFERTA,
                "Se liberó la bahía " + b.getCodigoIot() + " (" + b.getUbicacion() + "). Confírmala en la app antes de las "
                        + horario.horaLocal(limite) + " o pasará al siguiente de la lista.");
    }

    /** Si el usuario ya no puede reservar (bloqueado, inactivo o sin el vehículo), sale de la lista. */
    private boolean sigueHabilitado(ListaEspera e) {
        boolean ok = usuarios.findById(e.getIdUsuario()).map(u -> Estados.USR_VIGENTE.equals(u.getEstadoSincronizacion())).orElse(false)
                && vehiculos.findById(e.getIdVehiculo()).map(v -> Estados.VEH_ACTIVO.equals(v.getEstadoVehiculo())).orElse(false)
                && !faltas.bloqueado(e.getIdUsuario())
                && !reservas.existsByIdUsuarioAndEstadoReserva(e.getIdUsuario(), Estados.RES_PENDIENTE);
        if (!ok) {
            e.setEstadoEspera(Estados.ESP_CANCELADA);
            e.setFechaCierre(Instant.now());
        }
        return ok;
    }

    /** Cierra una entrada activa con el estado indicado. Si tenía bahía ofrecida, la libera y la ofrece al siguiente. */
    private boolean cerrar(Long idEspera, String estadoFinal) {
        ListaEspera e = repo.findForUpdate(idEspera).orElse(null);
        if (e == null || !ACTIVOS.contains(e.getEstadoEspera())) return false;
        Long idBahia = Estados.ESP_OFRECIDA.equals(e.getEstadoEspera()) ? e.getIdBahiaOfrecida() : null;
        e.setEstadoEspera(estadoFinal);
        e.setFechaCierre(Instant.now());
        repo.flush();
        if (idBahia != null) {
            bahias.findForUpdate(idBahia).ifPresent(b -> {
                if (b.getIdEstado() == Estados.BAHIA_RESERVADA
                        && !reservas.existsByIdBahiaAndEstadoReserva(b.getIdBahia(), Estados.RES_PENDIENTE)) {
                    b.setIdEstado(Estados.BAHIA_DISPONIBLE);
                    bahiaLiberada(b);
                }
            });
        }
        return true;
    }

    private EsperaDto dto(ListaEspera e) {
        Integer posicion = null;
        if (Estados.ESP_ESPERANDO.equals(e.getEstadoEspera())) {
            posicion = (int) repo.countByEstadoEsperaAndIdTipoVehiculoAndFechaRegistroBefore(
                    Estados.ESP_ESPERANDO, e.getIdTipoVehiculo(), e.getFechaRegistro()) + 1;
        }
        Bahia b = e.getIdBahiaOfrecida() == null ? null : bahias.findById(e.getIdBahiaOfrecida()).orElse(null);
        return new EsperaDto(e.getIdEspera(), e.getEstadoEspera(), e.getIdVehiculo(), e.getIdTipoVehiculo(), posicion,
                e.getFechaRegistro(), e.getIdBahiaOfrecida(), b == null ? null : b.getCodigoIot(),
                b == null ? null : b.getUbicacion(), e.getFechaLimiteOferta(), e.getIdReserva());
    }
}
