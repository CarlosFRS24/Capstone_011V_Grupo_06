package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.domain.*;
import cl.nodalix.omnidock.dto.Dtos.FaltaDto;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.repository.BahiaRepository;
import cl.nodalix.omnidock.repository.FaltaReservaRepository;
import cl.nodalix.omnidock.repository.ReservaRepository;
import cl.nodalix.omnidock.repository.UsuarioRepository;
import cl.nodalix.omnidock.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Castigo por no llegar a la reserva.
 * Cada reserva que vence sin check-in deja una falta VIGENTE. Con 3 (configurable) el usuario no puede reservar
 * ni entrar a la lista de espera, pero sí entrar a la app y retirar su vehículo. El admin lo desbloquea anulando las faltas.
 */
@Service
@RequiredArgsConstructor
public class FaltaService {

    private final FaltaReservaRepository repo;
    private final ReservaRepository reservas;
    private final BahiaRepository bahias;
    private final UsuarioRepository usuarios;
    private final NotificacionService avisos;

    @Value("${omnidock.faltas.maximo:3}")
    private int maxFaltas;

    public int maxFaltas() { return maxFaltas; }

    public long vigentes(Long idUsuario) {
        return repo.countByIdUsuarioAndEstadoFalta(idUsuario, Estados.FALTA_VIGENTE);
    }

    public boolean bloqueado(Long idUsuario) {
        return vigentes(idUsuario) >= maxFaltas;
    }

    public void validarNoBloqueado(Long idUsuario) {
        if (bloqueado(idUsuario))
            throw ApiException.forbidden("Tienes " + maxFaltas + " faltas por no llegar a tus reservas. "
                    + "No puedes reservar hasta que la administración te desbloquee.");
    }

    /** Se llama cuando una reserva pasa a EXPIRADA (dentro de la misma transacción). */
    public void registrar(Reserva r) {
        if (repo.existsByIdReserva(r.getIdReserva())) return;
        FaltaReserva f = new FaltaReserva();
        f.setIdUsuario(r.getIdUsuario());
        f.setIdReserva(r.getIdReserva());
        f.setFechaFalta(Instant.now());
        f.setEstadoFalta(Estados.FALTA_VIGENTE);
        repo.save(f);
        repo.flush();

        long total = vigentes(r.getIdUsuario());
        String codigo = bahias.findById(r.getIdBahia()).map(Bahia::getCodigoIot).orElse("la bahía " + r.getIdBahia());
        avisos.crear(r.getIdUsuario(), Estados.NOTIF_FALTA,
                "No llegaste a tu reserva en " + codigo + ". Llevas " + total + " de " + maxFaltas + " faltas.");
        if (total >= maxFaltas) {
            avisos.crear(r.getIdUsuario(), Estados.NOTIF_BLOQUEO,
                    "Sumaste " + maxFaltas + " faltas y no puedes reservar. Acércate a la administración para que te desbloqueen.");
        }
    }

    @Transactional(readOnly = true)
    public List<FaltaDto> deUsuario(Long idUsuario) {
        CurrentUser.assertSelfOrAdmin(idUsuario);
        List<FaltaReserva> lista = repo.findByIdUsuarioOrderByFechaFaltaDesc(idUsuario);
        Map<Long, String> codigos = new HashMap<>();
        return lista.stream().map(f -> {
            String codigo = codigos.computeIfAbsent(f.getIdReserva(), id -> reservas.findById(id)
                    .flatMap(r -> bahias.findById(r.getIdBahia())).map(Bahia::getCodigoIot).orElse(null));
            return new FaltaDto(f.getIdFalta(), f.getIdReserva(), codigo, f.getFechaFalta(), f.getEstadoFalta(), f.getFechaAnulacion());
        }).toList();
    }

    /** Admin: anula todas las faltas vigentes del usuario. Devuelve cuántas anuló. */
    @Transactional
    public int desbloquear(Long idUsuario) {
        usuarios.findById(idUsuario).orElseThrow(() -> ApiException.notFound("Usuario no encontrado"));
        List<FaltaReserva> lista = repo.findByIdUsuarioAndEstadoFalta(idUsuario, Estados.FALTA_VIGENTE);
        if (lista.isEmpty()) throw ApiException.conflict("El usuario no tiene faltas vigentes");
        Instant ahora = Instant.now();
        Long admin = CurrentUser.get().idUsuario();
        for (FaltaReserva f : lista) {
            f.setEstadoFalta(Estados.FALTA_ANULADA);
            f.setFechaAnulacion(ahora);
            f.setAnuladaPor(admin);
        }
        avisos.crear(idUsuario, Estados.NOTIF_DESBLOQUEO, "La administración anuló tus faltas. Ya puedes volver a reservar.");
        return lista.size();
    }

    /** Faltas vigentes por usuario, para la lista de usuarios del panel. */
    @Transactional(readOnly = true)
    public Map<Long, Long> vigentesPorUsuario() {
        Map<Long, Long> m = new HashMap<>();
        for (Object[] fila : repo.contarPorUsuario(Estados.FALTA_VIGENTE)) {
            m.put(((Number) fila[0]).longValue(), ((Number) fila[1]).longValue());
        }
        return m;
    }
}
