package cl.nodalix.omnidock.security;

import cl.nodalix.omnidock.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {
    private CurrentUser() {}

    public static AuthUser get() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !(a.getPrincipal() instanceof AuthUser u)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        return u;
    }

    /** Un usuario solo puede ver/operar sus propios recursos; el admin puede todo. */
    public static void assertSelfOrAdmin(Long idUsuario) {
        AuthUser u = get();
        if (!u.isAdmin() && !u.idUsuario().equals(idUsuario)) {
            throw ApiException.forbidden("No puedes acceder a recursos de otro usuario");
        }
    }
}
