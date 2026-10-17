package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "RESERVA")
@Getter @Setter @NoArgsConstructor
public class Reserva {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idReserva;
    private Long idUsuario;
    private Long idBahia;
    private Long idVehiculo;
    private Instant fechaSolicitud;
    private Instant fechaExpiracion;
    private String estadoReserva;
}
