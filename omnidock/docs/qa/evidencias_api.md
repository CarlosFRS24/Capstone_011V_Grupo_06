# Pruebas de la API y registro de defectos

El 02/10/2026 hicimos la primera sesión de pruebas de la API, a mano con Postman (Crisler la ejecutó y Felipe documentó las capturas en `../sprint-2/Documento de Evidencia Endpoints y Seguridad.pdf`). Desde el 05/10 los mismos casos se corren con el script `backend/pruebas/regresion_api.py`, y cada ejecución deja su reporte en esta carpeta.

## Sesión del 02/10 (Sprints 1 y 2)

| Sprint | Qué se revisó | Casos | Pasan | Fallan | Otros |
| --- | --- | --- | --- | --- | --- |
| Sprint 1 | Documentos y modelo de datos | 12 | 6 | 0 | 3 con observación, 3 sin evidencia |
| Sprint 2 | La API | 85 | 80 | 5 | — |
| Sprint 3 (adelanto) | El simulador IoT | 7 | 5 | 2 | — |

Todas las respuestas tardaron menos de 700 ms. El check-in completo (validar la reserva, abrir el candado simulado y registrar el uso) tomó 115 ms; el ERS pide menos de 2 segundos.

### Sprint 1: revisión de documentos y modelo

| ID | Qué se revisó | Resultado | Detalle |
| --- | --- | --- | --- |
| S1-REQ-01 | Cada RF tiene una historia de usuario | Cumple | 11 de 11 |
| S1-REQ-02 | Cada HU tiene criterios de aceptación verificables | Observación | 10 de 11 en formato Dado/Cuando/Entonces; faltaba HU-02 |
| S1-REQ-03 | Los RNF son medibles | Cumple | 2 s de respuesta, 3 s de refresco, 99 % de disponibilidad |
| S1-REQ-04 | Alcance dentro y fuera definido | Cumple | ERS 1.2 |
| S1-REQ-05 | Anexos del ERS completos | Sin evidencia | Nueve anexos con texto de plantilla |
| S1-MOD-01 | Las 11 tablas tienen clave primaria y foráneas | Cumple | 11 claves primarias, 16 foráneas |
| S1-MOD-02 | Modelo normalizado e independiente del tipo de vehículo | Cumple | Catálogos ROL, TIPO_VEHICULO y ESTADO_BAHIA |
| S1-MOD-03 | Los estados están restringidos en la base | Observación | Solo VEHICULO tenía CHECK de estado |
| S1-MOD-04 | Fechas coherentes en el uso | Cumple | CHECK `FECHA_FIN >= FECHA_INICIO` |
| S1-API-01 | Cada ruta del contrato existe en el backend | Observación | Todas implementadas; seis rutas extra sin documentar |
| S1-GES-01 | Backlog y tablero en Jira | Sin evidencia | Faltaba la exportación de Jira |
| S1-GES-02 | Prototipo de interfaz | Sin evidencia | ERS 5.5 sin contenido |

Las observaciones se resolvieron después: las CHECK de estado se agregaron en el Sprint 2, y el ERS, los anexos, Jira y Figma se completaron en los Sprints 2 y 3.

### Sprint 2 y simulador IoT: resultado por módulo

| Módulo | Casos | Pasan | Fallan |
| --- | --- | --- | --- |
| Autenticación (HU-01) | 9 | 9 | 0 |
| Roles y permisos (HU-10) | 10 | 10 | 0 |
| Bahías (HU-06, HU-09) | 13 | 11 | 2 |
| Vehículos (HU-02, HU-04) | 7 | 7 | 0 |
| Reservas (HU-02, HU-06) | 13 | 13 | 0 |
| Check-in, check-out e historial (HU-07, HU-08) | 13 | 13 | 0 |
| Tickets de mantención (HU-09) | 6 | 4 | 2 |
| Usuarios (HU-10, HU-04) | 13 | 12 | 1 |
| Documentación (Swagger) | 1 | 1 | 0 |
| Simulador IoT (HU-03) | 7 | 5 | 2 |

### Casos que fallaron

| ID | Caso | Obtenido | Defecto |
| --- | --- | --- | --- |
| S2-BAH-12 | Eliminar bahía (borrado lógico) | 409; la bahía quedaba disponible | DEF-01 |
| S2-BAH-13 | Pasar una bahía a FUERA_DE_SERVICIO | 409 "viola una restricción de la base de datos" | DEF-01 |
| S2-TKT-01 | Usuario reporta una falla | 409; nada cambiaba | DEF-01 |
| S2-TKT-02 | Administrador abre un ticket | 409; nada cambiaba | DEF-01 |
| S2-USR-08 | Usuario bloqueado usa un token emitido antes del bloqueo | 200; el token seguía aceptado | DEF-03 |
| S3-IOT-03 | Simulador envía ALERTA_FALLA | 409; la bahía seguía disponible | DEF-01 |
| S3-IOT-04 | Reservar una bahía que recibió alerta de falla | 201; la reserva se creaba | DEF-01 |

Todos estos casos pasan en las regresiones posteriores.

## Regresiones automáticas

| Fecha | Ejecutó | Casos | Pasan | Fallan | Otros | Reporte |
| --- | --- | --- | --- | --- | --- | --- |
| 05/10 | Crisler Romero | 97 | 94 | 1 (DEF-03) | 2 | `regresion_api_2026-10-05_1735.md` |
| 11/10 | Crisler Romero | 99 | 97 | 0 | 2 | `regresion_api_2026-10-11_2309.md` |
| 14/10 | Carlos Román | 97 | 95 | 0 | 2 | `regresion_api_2026-10-14_1658.md` |
| 29/10 | Crisler Romero | 115 | 112 | 0 | 3 (expiración, sin correr) | `regresion_api_2026-10-29_2123.md` |
| 30/10 | Crisler Romero | 115 | 115 | 0 | 0 | `regresion_api_2026-10-30_1249.md` |

## Pruebas de carga

| Fecha | Usuarios a la vez | RNF-01 (check-in bajo 2 s) | RNF-02 (sin bloqueos) | Reporte |
| --- | --- | --- | --- | --- |
| 30/10 | 10 | Cumple: p95 de 63 ms | Cumple: 1 ganador y 9 rechazos | `prueba_carga_2026-10-30_1247.md` |
| 30/10 | 50 | No cumple: 124 de 148 check-in con 502 (DEF-09) | Cumple: 1 ganador y 49 rechazos | `prueba_carga_2026-10-30_1235.md` |

## Defectos

| ID | Severidad | Defecto | Estado |
| --- | --- | --- | --- |
| DEF-01 | Crítica | La base de la nube no aceptaba el estado 4 (FUERA_DE_SERVICIO) porque al catálogo ESTADO_BAHIA le faltaba ese ID | Corregido: se recreó el esquema y se recargaron los datos |
| DEF-02 | Alta | Datos duplicados e incoherentes en la base (vehículos, usos y bahías repetidos o en estados imposibles) | Corregido con la misma recarga |
| DEF-03 | Media | El token de un usuario bloqueado seguía vigente hasta 240 minutos | Corregido el 11/10: el filtro JWT revisa el estado del usuario |
| DEF-04 | Media | El administrador podía dejar DISPONIBLE una bahía con reserva pendiente o ticket abierto | Corregido el 11/10 |
| DEF-05 | Media | Sin `.gitignore`: la carpeta `wallet/` se habría subido a GitHub | Corregido el 17/10 |
| DEF-06 | Baja | "15 minutos" escrito fijo en la app y en los datos de prueba | Corregido: la app toma la duración del backend (60 min) |
| DEF-07 | Baja | Contraseñas de prueba en texto plano en `02_insert.sql` | Aceptado: son datos de prueba del prototipo |
| DEF-08 | Baja | Sin pruebas automatizadas | Corregido: regresión automática desde el 05/10 |
| DEF-09 | Media | Con 50 check-in simultáneos, el simulador IoT, que corre dentro del mismo backend, se queda sin conexión a la base y no responde en 2 s; el check-in se revierte con 502. Con 10 usuarios no ocurre | Aceptado: pasa solo porque el simulador corre dentro del backend; con el rack real, separado, no compite por las conexiones. |
| DEF-10 | Baja | Al unirse a la lista de espera, el mensaje de confirmación decía "posición 2" aunque la persona era la primera (S4-UI-07) | Corregido el 01/11: el conteo excluye la propia inscripción |
| DEF-11 | Media | Si a la misma persona de la lista se le ofrecía una bahía por segunda vez, la app no repetía la alerta "¡Se liberó una bahía!" (S4-UI-16) | Corregido el 01/11: la app identifica cada oferta por su fecha límite |
