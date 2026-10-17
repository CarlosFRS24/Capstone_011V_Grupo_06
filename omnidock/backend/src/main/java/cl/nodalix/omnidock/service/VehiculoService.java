package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.domain.Estados;
import cl.nodalix.omnidock.domain.TipoVehiculo;
import cl.nodalix.omnidock.domain.Vehiculo;
import cl.nodalix.omnidock.dto.Dtos.*;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.repository.TipoVehiculoRepository;
import cl.nodalix.omnidock.repository.VehiculoRepository;
import cl.nodalix.omnidock.security.AuthUser;
import cl.nodalix.omnidock.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehiculoService {

    private final VehiculoRepository repo;
    private final TipoVehiculoRepository tipos;

    @Transactional
    public Vehiculo crear(VehiculoCreate req) {
        AuthUser me = CurrentUser.get();
        Long dueno = (me.isAdmin() && req.idUsuario() != null) ? req.idUsuario() : me.idUsuario();
        if (!tipos.existsById(req.idTipoVehiculo())) throw ApiException.badRequest("idTipoVehiculo inválido");
        Vehiculo v = new Vehiculo();
        v.setIdUsuario(dueno);
        v.setIdTipoVehiculo(req.idTipoVehiculo());
        v.setIdentificador(req.identificador());
        v.setEstadoVehiculo(Estados.VEH_ACTIVO);
        return repo.save(v);
    }

    @Transactional(readOnly = true)
    public List<VehiculoDto> listarPorUsuario(Long idUsuario) {
        CurrentUser.assertSelfOrAdmin(idUsuario);
        Map<Long, String> nombres = tipos.findAll().stream()
                .collect(Collectors.toMap(TipoVehiculo::getIdTipoVehiculo, TipoVehiculo::getNombreTipo, (a, b) -> a));
        return repo.findByIdUsuarioAndEstadoVehiculo(idUsuario, Estados.VEH_ACTIVO).stream()
                .map(v -> new VehiculoDto(v.getIdVehiculo(), v.getIdTipoVehiculo(), nombres.get(v.getIdTipoVehiculo()), v.getIdentificador()))
                .toList();
    }

    /** Borrado lógico: conserva el historial de TRANSACCION_USO. */
    @Transactional
    public void eliminar(Long idVehiculo) {
        Vehiculo v = repo.findById(idVehiculo).orElseThrow(() -> ApiException.notFound("Vehículo no encontrado"));
        CurrentUser.assertSelfOrAdmin(v.getIdUsuario());
        v.setEstadoVehiculo(Estados.VEH_INACTIVO);
    }
}
