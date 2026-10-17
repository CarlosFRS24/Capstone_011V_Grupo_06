package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.domain.Estados;
import cl.nodalix.omnidock.domain.Usuario;
import cl.nodalix.omnidock.dto.Dtos.*;
import cl.nodalix.omnidock.exception.ApiException;
import cl.nodalix.omnidock.repository.UsuarioRepository;
import cl.nodalix.omnidock.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private static final Set<String> ESTADOS = Set.of(Estados.USR_VIGENTE, Estados.USR_BLOQUEADO, Estados.USR_INACTIVO);
    private final UsuarioRepository repo;

    @Transactional(readOnly = true)
    public List<UsuarioDto> listar() {
        return repo.findAll().stream().map(UsuarioDto::from).toList();
    }

    @Transactional
    public Usuario crear(UsuarioCreate req) {
        validarRol(req.idRol());
        String estado = req.estadoSincronizacion() == null ? Estados.USR_VIGENTE : req.estadoSincronizacion();
        validarEstado(estado);
        if (repo.existsByRut(req.rut())) throw ApiException.conflict("Ya existe un usuario con ese RUT");
        if (repo.existsByEmailInstitucionalIgnoreCase(req.emailInstitucional()))
            throw ApiException.conflict("Ya existe un usuario con ese email");
        Usuario u = new Usuario();
        u.setRut(req.rut());
        u.setIdDirectorioExterno(req.idDirectorioExterno());
        u.setNombreCompleto(req.nombreCompleto());
        u.setEmailInstitucional(req.emailInstitucional());
        u.setPasswordPrototipo(req.passwordPrototipo());
        u.setIdRol(req.idRol());
        u.setEstadoSincronizacion(estado);
        return repo.save(u);
    }

    @Transactional
    public Usuario actualizar(Long id, UsuarioUpdate req) {
        Usuario u = repo.findById(id).orElseThrow(() -> ApiException.notFound("Usuario no encontrado"));
        if (req.idRol() != null) { validarRol(req.idRol()); u.setIdRol(req.idRol()); }
        if (req.estadoSincronizacion() != null) {
            validarEstado(req.estadoSincronizacion());
            if (!Estados.USR_VIGENTE.equals(req.estadoSincronizacion()) && id.equals(CurrentUser.get().idUsuario()))
                throw ApiException.conflict("No puedes bloquear o desactivar tu propio usuario");
            u.setEstadoSincronizacion(req.estadoSincronizacion());
        }
        if (req.nombreCompleto() != null) u.setNombreCompleto(req.nombreCompleto());
        if (req.emailInstitucional() != null) u.setEmailInstitucional(req.emailInstitucional());
        if (req.passwordPrototipo() != null) u.setPasswordPrototipo(req.passwordPrototipo());
        return u;
    }

    /** Borrado lógico (RF-04). */
    @Transactional
    public void eliminar(Long id) {
        if (id.equals(CurrentUser.get().idUsuario())) throw ApiException.conflict("No puedes desactivar tu propio usuario");
        Usuario u = repo.findById(id).orElseThrow(() -> ApiException.notFound("Usuario no encontrado"));
        u.setEstadoSincronizacion(Estados.USR_INACTIVO);
    }

    private void validarRol(Integer idRol) {
        if (idRol == null || idRol < 1 || idRol > 3) throw ApiException.badRequest("idRol inválido (1=Admin, 2=Usuario, 3=Colaborador)");
    }

    private void validarEstado(String e) {
        if (!ESTADOS.contains(e)) throw ApiException.badRequest("estadoSincronizacion inválido: " + ESTADOS);
    }
}
