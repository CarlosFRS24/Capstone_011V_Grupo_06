package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "VEHICULO")
@Getter @Setter @NoArgsConstructor
public class Vehiculo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idVehiculo;
    private Long idUsuario;
    private Long idTipoVehiculo;
    private String identificador;
    private String estadoVehiculo;
}
