package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "BAHIA")
@Getter @Setter @NoArgsConstructor
public class Bahia {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idBahia;
    private String codigoIot;
    private String ubicacion;
    private Integer idEstado;
    private Long idTipoPermitido;
}
