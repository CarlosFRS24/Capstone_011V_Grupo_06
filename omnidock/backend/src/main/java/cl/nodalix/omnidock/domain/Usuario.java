package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "USUARIO")
@Getter @Setter @NoArgsConstructor
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUsuario;
    private String rut;
    private String idDirectorioExterno;
    private String nombreCompleto;
    private String emailInstitucional;
    private String passwordPrototipo;
    private Integer idRol;
    private String estadoSincronizacion;
    private Instant fechaUltimoAcceso;
}
