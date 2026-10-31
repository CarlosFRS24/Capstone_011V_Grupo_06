package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

/** Una falta por cada reserva que venció sin check-in. */
@Entity
@Table(name = "FALTA_RESERVA")
@Getter @Setter @NoArgsConstructor
public class FaltaReserva {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idFalta;
    private Long idUsuario;
    private Long idReserva;
    private Instant fechaFalta;
    private String estadoFalta;
    private Instant fechaAnulacion;
    private Long anuladaPor;
}
