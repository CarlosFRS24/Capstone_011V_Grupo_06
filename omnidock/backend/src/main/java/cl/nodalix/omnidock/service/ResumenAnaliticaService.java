package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.dto.Dtos.BahiaTopDto;
import cl.nodalix.omnidock.dto.Dtos.ConteoDto;
import cl.nodalix.omnidock.dto.Dtos.IndicadoresDto;
import cl.nodalix.omnidock.dto.Dtos.PuntoSerieDto;
import cl.nodalix.omnidock.dto.Dtos.ResumenAnaliticaDto;
import cl.nodalix.omnidock.dto.Dtos.SectorTipoDto;
import cl.nodalix.omnidock.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * RF-11: datos para los gráficos propios de la pantalla Analítica del panel.
 * Lee las mismas vistas en estrella que usa Power BI (04_vistas_bi.sql), así los números coinciden con el informe.
 * Se hizo porque la cuenta del instituto no permite embeber el informe de Power BI en la web.
 */
@Service
@RequiredArgsConstructor
public class ResumenAnaliticaService {

    /** Períodos que acepta el panel. 0 = todo el historial. */
    private static final Set<Integer> PERIODOS = Set.of(0, 7, 30, 90);
    private static final String[] DIAS = {"Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"};

    private final NamedParameterJdbcTemplate jdbc;

    @Value("${omnidock.horario.zona:America/Santiago}") private String zona;
    @Value("${omnidock.faltas.maximo:3}") private int maxFaltas;

    @Transactional(readOnly = true)
    public ResumenAnaliticaDto resumen(int dias) {
        if (!PERIODOS.contains(dias))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Período no válido: use 7, 30, 90 o 0 (todo)");

        // Las vistas ya traen FECHA en hora de Chile, así que el filtro se arma con la fecha local de hoy
        LocalDate hoy = LocalDate.now(ZoneId.of(zona));
        LocalDate desde = dias == 0 ? LocalDate.of(2000, 1, 1) : hoy.minusDays(dias - 1L);
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("desde", Date.valueOf(desde))
                .addValue("hasta", Date.valueOf(hoy));
        String rango = " FECHA BETWEEN :desde AND :hasta ";
        // Hasta 30 días se ve día a día; más que eso, por semana (lunes de cada semana)
        String agrupacion = (dias > 0 && dias <= 30) ? "DIA" : "SEMANA";
        String balde = "DIA".equals(agrupacion) ? "FECHA" : "TRUNC(FECHA, 'IW')";

        // 1. Reservas por estado, con el primer y último día con datos
        Map<String, Long> estados = new LinkedHashMap<>();
        for (String e : List.of("CONCRETADA", "EXPIRADA", "CANCELADA", "PENDIENTE")) estados.put(e, 0L);
        jdbc.query("SELECT ESTADO_RESERVA, COUNT(*) N FROM V_HECHO_RESERVA WHERE" + rango + "GROUP BY ESTADO_RESERVA", p,
                rs -> { estados.put(rs.getString(1), rs.getLong(2)); });
        long reservas = estados.values().stream().mapToLong(Long::longValue).sum();

        Map<String, Object> r = jdbc.queryForMap(
                "SELECT TO_CHAR(MIN(FECHA), 'YYYY-MM-DD') DESDE, TO_CHAR(MAX(FECHA), 'YYYY-MM-DD') HASTA, "
                + "AVG(MINUTOS_HASTA_CHECKIN) LLEGADA FROM V_HECHO_RESERVA WHERE" + rango, p);

        // 2. Usos de bahía
        Map<String, Object> u = jdbc.queryForMap(
                "SELECT COUNT(*) USOS, COUNT(DISTINCT ID_USUARIO) USUARIOS, "
                + "AVG(CASE WHEN ESTADO_TRANSACCION = 'FINALIZADA' THEN MINUTOS_USO END) MINUTOS "
                + "FROM V_HECHO_USO WHERE" + rango, p);

        // 3. Faltas del período y usuarios bloqueados hoy (3 o más faltas vigentes)
        long faltas = cuenta("SELECT COUNT(*) FROM V_HECHO_FALTA WHERE" + rango, p);
        long bloqueados = cuenta("SELECT COUNT(*) FROM (SELECT ID_USUARIO FROM FALTA_RESERVA WHERE ESTADO_FALTA = 'VIGENTE' "
                + "GROUP BY ID_USUARIO HAVING COUNT(*) >= :max)", new MapSqlParameterSource("max", maxFaltas));

        // 4. Lista de espera por estado
        Map<String, Long> espera = new LinkedHashMap<>();
        for (String e : List.of("CONFIRMADA", "VENCIDA", "CANCELADA", "ESPERANDO", "OFRECIDA")) espera.put(e, 0L);
        jdbc.query("SELECT ESTADO_ESPERA, COUNT(*) FROM V_HECHO_LISTA_ESPERA WHERE" + rango + "GROUP BY ESTADO_ESPERA", p,
                rs -> { espera.put(rs.getString(1), rs.getLong(2)); });
        long esperas = espera.values().stream().mapToLong(Long::longValue).sum();
        Double minutosEspera = numero(jdbc.queryForObject(
                "SELECT AVG(MINUTOS_ESPERA) FROM V_HECHO_LISTA_ESPERA WHERE" + rango, p, Object.class));

        // 5. Evolución: reservas, usos y faltas por día o semana
        TreeMap<String, long[]> serie = new TreeMap<>();
        String[] vistas = {"V_HECHO_RESERVA", "V_HECHO_USO", "V_HECHO_FALTA"};
        for (int i = 0; i < vistas.length; i++) {
            final int col = i;
            jdbc.query("SELECT TO_CHAR(" + balde + ", 'YYYY-MM-DD') B, COUNT(*) FROM " + vistas[i] + " WHERE" + rango
                    + "GROUP BY " + balde, p, rs -> { serie.computeIfAbsent(rs.getString(1), k -> new long[3])[col] = rs.getLong(2); });
        }
        // Los días o semanas sin movimiento van en 0 para que el gráfico no salte de una fecha a otra
        List<PuntoSerieDto> puntos = new ArrayList<>();
        if (!serie.isEmpty()) {
            int paso = "DIA".equals(agrupacion) ? 1 : 7;
            LocalDate ultimo = LocalDate.parse(serie.lastKey());
            for (LocalDate f = LocalDate.parse(serie.firstKey()); !f.isAfter(ultimo); f = f.plusDays(paso)) {
                long[] v = serie.getOrDefault(f.toString(), new long[3]);
                puntos.add(new PuntoSerieDto(f.toString(), v[0], v[1], v[2]));
            }
        }

        // 6. Uso por hora de llegada (siempre de 07 a 22, que es el horario de la sede)
        TreeMap<Integer, Long> horas = new TreeMap<>();
        for (int h = 7; h <= 22; h++) horas.put(h, 0L);
        jdbc.query("SELECT HORA_INICIO, COUNT(*) FROM V_HECHO_USO WHERE" + rango + "GROUP BY HORA_INICIO", p,
                rs -> { horas.put(rs.getInt(1), rs.getLong(2)); });
        List<ConteoDto> porHora = new ArrayList<>();
        horas.forEach((h, n) -> porHora.add(new ConteoDto(String.format("%02d", h), n)));

        // 7. Uso por día de la semana (domingo solo si hay datos, porque la sede no abre)
        long[] semana = new long[7];
        jdbc.query("SELECT 1 + FECHA - TRUNC(FECHA, 'IW') D, COUNT(*) FROM V_HECHO_USO WHERE" + rango
                + "GROUP BY 1 + FECHA - TRUNC(FECHA, 'IW')", p, rs -> { semana[rs.getInt(1) - 1] = rs.getLong(2); });
        List<ConteoDto> porDia = new ArrayList<>();
        for (int d = 0; d < 7; d++) if (d < 6 || semana[d] > 0) porDia.add(new ConteoDto(DIAS[d], semana[d]));

        // 8. Uso por sector y tipo de vehículo (todas las bahías, aunque no tengan usos)
        List<SectorTipoDto> sectores = jdbc.query(
                "SELECT b.SECTOR, b.TIPO_PERMITIDO, COUNT(DISTINCT b.ID_BAHIA) BAHIAS, COUNT(u.ID_TRANSACCION) USOS "
                + "FROM V_DIM_BAHIA b LEFT JOIN V_HECHO_USO u ON u.ID_BAHIA = b.ID_BAHIA AND u.FECHA BETWEEN :desde AND :hasta "
                + "GROUP BY b.SECTOR, b.TIPO_PERMITIDO ORDER BY b.SECTOR, b.TIPO_PERMITIDO", p,
                (rs, i) -> new SectorTipoDto(rs.getString(1), rs.getString(2), rs.getLong(3), rs.getLong(4)));

        // 9. Las 5 bahías más usadas
        List<BahiaTopDto> top = jdbc.query(
                "SELECT b.CODIGO_IOT, b.SECTOR, COUNT(*) USOS, AVG(u.MINUTOS_USO) MINUTOS "
                + "FROM V_HECHO_USO u JOIN V_DIM_BAHIA b ON b.ID_BAHIA = u.ID_BAHIA WHERE u.FECHA BETWEEN :desde AND :hasta "
                + "GROUP BY b.CODIGO_IOT, b.SECTOR ORDER BY USOS DESC, b.CODIGO_IOT FETCH FIRST 5 ROWS ONLY", p,
                (rs, i) -> new BahiaTopDto(rs.getString(1), rs.getString(2), rs.getLong(3), redondeo(numero(rs.getObject(4)))));

        long usos = ((Number) u.get("USOS")).longValue();
        IndicadoresDto ind = new IndicadoresDto(
                reservas, usos,
                pct(estados.get("CONCRETADA"), reservas),
                faltas, pct(faltas, reservas),
                redondeo(numero(u.get("MINUTOS"))), redondeo(numero(r.get("LLEGADA"))),
                ((Number) u.get("USUARIOS")).longValue(),
                esperas, pct(espera.get("CONFIRMADA"), esperas), redondeo(minutosEspera),
                bloqueados);

        return new ResumenAnaliticaDto(dias, (String) r.get("DESDE"), (String) r.get("HASTA"), agrupacion, ind, puntos,
                porHora, porDia, sectores, aLista(estados), aLista(espera), top);
    }

    private long cuenta(String sql, MapSqlParameterSource p) {
        Number n = jdbc.queryForObject(sql, p, Number.class);
        return n == null ? 0 : n.longValue();
    }

    private static List<ConteoDto> aLista(Map<String, Long> m) {
        List<ConteoDto> l = new ArrayList<>();
        m.forEach((k, v) -> l.add(new ConteoDto(k, v)));
        return l;
    }

    private static Double numero(Object o) { return o instanceof Number n ? n.doubleValue() : null; }

    private static Double redondeo(Double d) { return d == null ? null : Math.round(d * 10) / 10.0; }

    private static double pct(long parte, long total) { return total == 0 ? 0 : Math.round(1000.0 * parte / total) / 10.0; }
}
