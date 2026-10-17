package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "TIPO_VEHICULO")
@Getter @Setter @NoArgsConstructor
public class TipoVehiculo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idTipoVehiculo;
    private String nombreTipo;
}
