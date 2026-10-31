package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.domain.Notificacion;
import cl.nodalix.omnidock.dto.Dtos.NotificacionDto;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.repository.NotificacionRepository;
import cl.nodalix.omnidock.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/** Avisos dentro de la app (la app los consulta cada 30 s). */
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private static final Character SI = 'S';
    private static final Character NO = 'N';

    private final NotificacionRepository repo;

    /** Se llama desde otros servicios, dentro de su misma transacción. */
    public void crear(Long idUsuario, String tipo, String mensaje) {
        Notificacion n = new Notificacion();
        n.setIdUsuario(idUsuario);
        n.setTipo(tipo);
        n.setMensaje(mensaje.length() > 300 ? mensaje.substring(0, 300) : mensaje);
        n.setFechaCreacion(Instant.now());
        n.setLeida(NO);
        repo.save(n);
    }

    @Transactional(readOnly = true)
    public List<NotificacionDto> mias() {
        return repo.findTop30ByIdUsuarioOrderByFechaCreacionDesc(CurrentUser.get().idUsuario()).stream()
                .map(n -> new NotificacionDto(n.getIdNotificacion(), n.getTipo(), n.getMensaje(), n.getFechaCreacion(), SI.equals(n.getLeida())))
                .toList();
    }

    @Transactional(readOnly = true)
    public long noLeidas(Long idUsuario) {
        return repo.countByIdUsuarioAndLeida(idUsuario, NO);
    }

    @Transactional
    public void marcarLeida(Long idNotificacion) {
        Notificacion n = repo.findById(idNotificacion).orElseThrow(() -> ApiException.notFound("Aviso no encontrado"));
        CurrentUser.assertSelfOrAdmin(n.getIdUsuario());
        n.setLeida(SI);
    }

    @Transactional
    public int marcarTodasLeidas() {
        List<Notificacion> lista = repo.findByIdUsuarioAndLeida(CurrentUser.get().idUsuario(), NO);
        lista.forEach(n -> n.setLeida(SI));
        return lista.size();
    }
}
