package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.dto.Dtos.HorarioDto;
import cl.nodalix.omnidock.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;

/**
 * Horario de la sede (hora de Chile).
 * Clases: lunes a viernes 08:00-22:30 y sábado 08:00-16:00; domingo cerrado.
 * Se puede reservar desde las 07:00 hasta 1 hora antes del cierre, así la ventana de 60 min nunca pasa del cierre.
 * Con omnidock.horario.activo=false no se valida (útil para probar o presentar fuera de horario).
 */
@Service
public class HorarioService {

    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    private final boolean activo;
    private final ZoneId zona;
    private final LocalTime aperturaReservas;
    private final LocalTime cierreSemana;
    private final LocalTime cierreSabado;
    private final long minutosAntesCierre;

    public HorarioService(@Value("${omnidock.horario.activo:true}") boolean activo,
                          @Value("${omnidock.horario.zona:America/Santiago}") String zona,
                          @Value("${omnidock.horario.apertura-reservas:07:00}") String apertura,
                          @Value("${omnidock.horario.cierre-semana:22:30}") String cierreSemana,
                          @Value("${omnidock.horario.cierre-sabado:16:00}") String cierreSabado,
                          @Value("${omnidock.horario.minutos-antes-cierre:60}") long minutosAntesCierre) {
        this.activo = activo;
        this.zona = ZoneId.of(zona);
        this.aperturaReservas = LocalTime.parse(apertura);
        this.cierreSemana = LocalTime.parse(cierreSemana);
        this.cierreSabado = LocalTime.parse(cierreSabado);
        this.minutosAntesCierre = minutosAntesCierre;
    }

    /** Hora de cierre de la sede ese día; null si no abre (domingo). */
    public LocalTime cierre(LocalDate dia) {
        return switch (dia.getDayOfWeek()) {
            case SUNDAY -> null;
            case SATURDAY -> cierreSabado;
            default -> cierreSemana;
        };
    }

    /** ¿Se puede reservar (o entrar a la lista de espera) en este momento? */
    public boolean reservasAbiertas(Instant ahora) {
        if (!activo) return true;
        ZonedDateTime local = ahora.atZone(zona);
        LocalTime cierre = cierre(local.toLocalDate());
        if (cierre == null) return false;
        LocalTime t = local.toLocalTime();
        return !t.isBefore(aperturaReservas) && t.isBefore(cierre.minusMinutes(minutosAntesCierre));
    }

    public void validarReservasAbiertas() {
        if (!reservasAbiertas(Instant.now())) throw ApiException.conflict(mensaje());
    }

    /** Vencimiento de una reserva hecha en 'desde': desde + minutos, pero nunca después del cierre de la sede. */
    public Instant vencimiento(Instant desde, long minutos) {
        Instant fin = desde.plus(Duration.ofMinutes(minutos));
        if (!activo) return fin;
        ZonedDateTime local = desde.atZone(zona);
        LocalTime cierre = cierre(local.toLocalDate());
        if (cierre == null) return fin;
        Instant hc = local.toLocalDate().atTime(cierre).atZone(zona).toInstant();
        // Si la reserva se hizo antes del cierre y la ventana lo pasa, se corta al cierre
        if (hc.isAfter(desde) && fin.isAfter(hc)) return hc;
        return fin;
    }

    /** Hora local (Chile) en formato HH:mm, para los mensajes. */
    public String horaLocal(Instant t) {
        return t.atZone(zona).toLocalTime().format(HHMM);
    }

    public String mensaje() {
        return "Las reservas se pueden hacer de lunes a viernes de " + aperturaReservas.format(HHMM) + " a "
                + cierreSemana.minusMinutes(minutosAntesCierre).format(HHMM) + " y el sábado de "
                + aperturaReservas.format(HHMM) + " a " + cierreSabado.minusMinutes(minutosAntesCierre).format(HHMM) + ".";
    }

    /** Lo que la app necesita para mostrar el horario de hoy. */
    public HorarioDto info() {
        Instant ahora = Instant.now();
        LocalDate hoy = ahora.atZone(zona).toLocalDate();
        LocalTime cierre = cierre(hoy);
        return new HorarioDto(activo, reservasAbiertas(ahora),
                cierre == null ? null : aperturaReservas.format(HHMM),
                cierre == null ? null : cierre.minusMinutes(minutosAntesCierre).format(HHMM),
                cierre == null ? null : cierre.format(HHMM),
                mensaje());
    }
}
