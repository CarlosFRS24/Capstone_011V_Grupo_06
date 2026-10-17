package cl.nodalix.omnidock.security;

import cl.nodalix.omnidock.domain.Estados;

/** Principal que se arma desde el JWT (sin consultar la BD en cada request). */
public record AuthUser(Long idUsuario, Integer idRol) {
    public boolean isAdmin() {
        return idRol != null && idRol == Estados.ROL_ADMIN;
    }
}
