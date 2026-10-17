package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "TICKET_MANTENIMIENTO")
@Getter @Setter @NoArgsConstructor
public class TicketMantenimiento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idTicket;
    private Long idBahia;
    private Long reportadoPor;
    private String descripcionFalla;
    private Instant fechaReporte;
    private Instant fechaResolucion;
    private String estadoTicket;
}
