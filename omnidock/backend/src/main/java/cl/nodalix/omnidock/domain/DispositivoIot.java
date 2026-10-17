package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "DISPOSITIVO_IOT")
@Getter @Setter @NoArgsConstructor
public class DispositivoIot {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDispositivo;
    private Long idBahia;
    private String direccionMac;
    private String estadoConexion;
    private Instant ultimoPing;
}
