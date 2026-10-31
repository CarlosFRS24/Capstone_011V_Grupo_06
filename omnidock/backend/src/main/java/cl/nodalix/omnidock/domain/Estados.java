package cl.nodalix.omnidock.domain;

/** Constantes de catálogos y estados. */
public final class Estados {
    private Estados() {}

    // ESTADO_BAHIA según Insert_SQL: 1 DISPONIBLE, 2 RESERVADA, 3 OCUPADA, 4 FUERA_DE_SERVICIO.
    // FUERA_DE_SERVICIO es el estado de "mantención" (falla o ticket abierto).
    public static final int BAHIA_DISPONIBLE = 1;
    public static final int BAHIA_RESERVADA = 2;
    public static final int BAHIA_OCUPADA = 3;
    public static final int BAHIA_FUERA_DE_SERVICIO = 4;

    // ROL (ID_ROL)
    public static final int ROL_ADMIN = 1;
    public static final int ROL_USUARIO = 2;
    public static final int ROL_COLABORADOR = 3;

    public static final String USR_VIGENTE = "VIGENTE";
    public static final String USR_BLOQUEADO = "BLOQUEADO";
    public static final String USR_INACTIVO = "INACTIVO";

    public static final String VEH_ACTIVO = "ACTIVO";
    public static final String VEH_INACTIVO = "INACTIVO";

    public static final String RES_PENDIENTE = "PENDIENTE";
    public static final String RES_CONCRETADA = "CONCRETADA";
    public static final String RES_CANCELADA = "CANCELADA";
    public static final String RES_EXPIRADA = "EXPIRADA";

    public static final String TX_ACTIVA = "ACTIVA";
    public static final String TX_FINALIZADA = "FINALIZADA";

    public static final String TK_ABIERTO = "ABIERTO";
    public static final String TK_EN_REVISION = "EN_REVISION";
    public static final String TK_RESUELTO = "RESUELTO";
    public static final String TK_ANULADO = "ANULADO";

    // Faltas, lista de espera y avisos
    public static final String FALTA_VIGENTE = "VIGENTE";
    public static final String FALTA_ANULADA = "ANULADA";

    public static final String ESP_ESPERANDO = "ESPERANDO";
    public static final String ESP_OFRECIDA = "OFRECIDA";
    public static final String ESP_CONFIRMADA = "CONFIRMADA";
    public static final String ESP_VENCIDA = "VENCIDA";
    public static final String ESP_CANCELADA = "CANCELADA";

    public static final String NOTIF_FALTA = "FALTA";
    public static final String NOTIF_BLOQUEO = "BLOQUEO";
    public static final String NOTIF_DESBLOQUEO = "DESBLOQUEO";
    public static final String NOTIF_OFERTA = "OFERTA_BAHIA";
    public static final String NOTIF_OFERTA_VENCIDA = "OFERTA_VENCIDA";
    public static final String NOTIF_LISTA_CERRADA = "LISTA_CERRADA";
    public static final String NOTIF_RESERVA_CANCELADA = "RESERVA_CANCELADA";

    public static final String CMD_LIBERAR = "LIBERAR_CERROJO";
    public static final String CMD_BLOQUEAR = "BLOQUEAR_CERROJO";
}
