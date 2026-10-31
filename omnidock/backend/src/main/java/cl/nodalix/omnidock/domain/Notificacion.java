package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

/** Avisos que el usuario ve dentro de la app. LEIDA es 'S' o 'N'. */
@Entity
@Table(name = "NOTIFICACION")
@Getter @Setter @NoArgsConstructor
public class Notificacion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idNotificacion;
    private Long idUsuario;
    private String tipo;
    private String mensaje;
    private Instant fechaCreacion;
    private Character leida;
}
