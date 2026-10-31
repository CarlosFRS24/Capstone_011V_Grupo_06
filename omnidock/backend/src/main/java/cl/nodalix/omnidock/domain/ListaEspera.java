package cl.nodalix.omnidock.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

/** Usuarios esperando una bahía de su tipo de vehículo. */
@Entity
@Table(name = "LISTA_ESPERA")
@Getter @Setter @NoArgsConstructor
public class ListaEspera {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idEspera;
    private Long idUsuario;
    private Long idVehiculo;
    private Long idTipoVehiculo;
    private Instant fechaRegistro;
    private String estadoEspera;
    private Long idBahiaOfrecida;
    private Instant fechaOferta;
    private Instant fechaLimiteOferta;
    private Long idReserva;
    private Instant fechaCierre;
}
