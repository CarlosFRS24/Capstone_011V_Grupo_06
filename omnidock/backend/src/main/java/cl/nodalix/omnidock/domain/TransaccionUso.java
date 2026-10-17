package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "TRANSACCION_USO")
@Getter @Setter @NoArgsConstructor
public class TransaccionUso {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idTransaccion;
    private Long idReserva;
    private Long idUsuario;
    private Long idBahia;
    private Long idVehiculo;
    private Instant fechaInicio;
    private Instant fechaFin;
    private String estadoTransaccion;
}
