package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "LOG_EVENTO_IOT")
@Getter @Setter @NoArgsConstructor
public class LogEventoIot {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idLog;
    private Long idDispositivo;
    private String tipoEvento;
    private String payloadRecibido;
    private Instant fechaEvento;
}
