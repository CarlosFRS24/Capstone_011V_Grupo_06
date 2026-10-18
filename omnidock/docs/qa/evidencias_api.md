# Pruebas de los Sprints 1 y 2 (registro del 02/10/2026)


## Resumen

| Sprint | Qué se revisó | Casos | Pasan | Fallan | Otros |
| --- | --- | --- | --- | --- | --- |
| Sprint 1 | Documentos y modelo de datos | 12 | 6 | 0 | 3 con observación, 3 sin evidencia |
| Sprint 2 | La API | 85 | 80 | 5 | — |
| Sprint 3 (adelanto) | El simulador IoT | 7 | 5 | 2 | — |
| Sprint 4 | Power BI | 1 | 0 | 0 | no aplica todavía |

Todas las respuestas tardaron menos de 700 ms. El check-in completo (validar la reserva, abrir el cerrojo simulado y registrar el uso) tomó 115 ms; el ERS pide menos de 2 segundos.


## Capturas

Estas pruebas se hicieron por la API(Postman), sin capturas de pantalla.


## Sprint 1 — verificación estática

| ID | Verificación | Resultado | Detalle |
| --- | --- | --- | --- |
| S1-REQ-01 | Cada RF tiene una historia de usuario | Cumple | 11 de 11 |
| S1-REQ-02 | Cada HU tiene criterios de aceptación verificables | Observación | 10 de 11 en formato Dado/Cuando/Entonces; falta HU-02 |
| S1-REQ-03 | Los RNF son medibles | Cumple | 2 s de respuesta, 3 s de refresco, 99 % de disponibilidad |
| S1-REQ-04 | Alcance dentro y fuera definido | Cumple | ERS 1.2 |
| S1-REQ-05 | Anexos del ERS completos | Sin evidencia | Nueve anexos con texto de plantilla (5.1, 5.2, 5.3, 5.5 a 5.10) |
| S1-MOD-01 | Las 11 tablas tienen clave primaria y foráneas | Cumple | 11 claves primarias, 16 claves foráneas |
| S1-MOD-02 | Modelo normalizado y agnóstico al tipo de vehículo | Cumple | Catálogos ROL, TIPO_VEHICULO y ESTADO_BAHIA |
| S1-MOD-03 | Los estados están restringidos en la base | Observación | Solo VEHICULO tiene CHECK de estado |
| S1-MOD-04 | Fechas coherentes en el uso | Cumple | CHECK `FECHA_FIN >= FECHA_INICIO` |
| S1-API-01 | Cada ruta del contrato (ERS 5.11) existe en el backend | Observación | Todas implementadas; seis rutas extra sin documentar |
| S1-GES-01 | Backlog y tablero en Jira | Sin evidencia | Falta exportación de Jira |
| S1-GES-02 | Prototipo de interfaz | Sin evidencia | ERS 5.5 sin contenido |

## Sprint 2 — autenticación (HU-01)

| ID | Ref. | Caso | Esperado | Obtenido | ms | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S2-AUTH-01 | HU-01/RF-01 | Login administrador con credenciales válidas | 200 + token + idRol=1 | 200; no expone la contraseña | 34 | OK | n.º 1 |
| S2-AUTH-02 | HU-01/RF-01 | Login usuario final con credenciales válidas | 200 + token + idRol=2 | 200 | 27 | OK | — |
| S2-AUTH-03 | HU-01 | Login con contraseña incorrecta | 401 | 401 "Credenciales inválidas" | 21 | OK | — |
| S2-AUTH-04 | HU-01 | Login con correo inexistente | 401, mismo mensaje | 401 "Credenciales inválidas" | 27 | OK | — |
| S2-AUTH-05 | HU-01 | Login con cuerpo vacío | 400 | 400 con detalle de campos | 19 | OK | — |
| S2-AUTH-06 | RNF Seguridad | Recurso protegido sin token | 401 | 401 | 3 | OK | n.º 3 |
| S2-AUTH-07 | RNF Seguridad | Token JWT adulterado | 401 | 401 | 3 | OK | — |
| S2-AUTH-08 | HU-01 | Perfil propio con token válido | 200 | 200, usuario 4 | 21 | OK | n.º 2 |
| S2-AUTH-09 | HU-01 | Login con correo en mayúsculas | 200 | 200 | 29 | OK | — |

## Sprint 2 — roles y permisos (HU-10, RNF Seguridad)

| ID | Ref. | Caso | Esperado | Obtenido | ms | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S2-RBAC-01 | HU-10 | Usuario final lista usuarios | 403 | 403 | 3 | OK | n.º 3 |
| S2-RBAC-02 | HU-09 | Usuario final intenta crear bahía | 403 | 403 | 3 | OK | — |
| S2-RBAC-03 | HU-11 | Usuario final pide token de analítica | 403 | 403 | 3 | OK | — |
| S2-RBAC-04 | HU-09 | Usuario final lista tickets | 403 | 403 | 3 | OK | — |
| S2-RBAC-05 | RNF | Usuario 4 consulta vehículos del usuario 5 | 403 | 403 | 7 | OK | — |
| S2-RBAC-06 | HU-08 | Usuario 4 consulta historial del usuario 5 | 403 | 403 | 7 | OK | — |
| S2-RBAC-07 | RNF | Usuario 4 consulta reservas del usuario 5 | 403 | 403 | 8 | OK | — |
| S2-RBAC-08 | HU-10 | Colaborador (rol 3) lista usuarios | 403 | 403 | 3 | OK | — |
| S2-RBAC-09 | HU-10 | Administrador lista usuarios | 200 sin contraseñas | 200, 20 usuarios, sin contraseña | 31 | OK | n.º 5 |
| S2-RBAC-10 | HU-10 | Usuario final se auto-asigna rol administrador | 403 | 403 | 4 | OK | — |

## Sprint 2 — bahías (HU-06, HU-09)

| ID | Ref. | Caso | Esperado | Obtenido | ms | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S2-BAH-01 | HU-06/RF-06 | Listar bahías | 200 con estado | 200, 4 bahías | 19 | OK | n.º 9 |
| S2-BAH-02 | HU-02/HU-06 | Filtrar disponibles para bicicleta | Solo estado 1 y tipo 1 | RACK-BICI-01, RACK-BICI-02 | 89 | OK | n.º 9 (mismo filtro, con tipo 2) |
| S2-BAH-03 | HU-06 | Filtrar por texto de ubicación en minúsculas | Solo "Patio Central" | RACK-SCOOT-01, RACK-SCOOT-02 | 21 | OK | — |
| S2-BAH-04 | HU-07 | Resolver bahía por código QR válido | 200 idBahia=1 | 200 | 19 | OK | n.º 11 |
| S2-BAH-05 | HU-07 | Resolver bahía por código QR inexistente | 404 con mensaje claro | 404 "No existe una bahía con código…" | 13 | OK | — |
| S2-BAH-06 | HU-09/RF-09 | Administrador crea bahía con dispositivo IoT | 201 | 201, idBahia=41 | 76 | OK | n.º 8 |
| S2-BAH-07 | HU-09 | Crear bahía con código duplicado | 409 | 409 | 26 | OK | n.º 8 |
| S2-BAH-08 | HU-09 | Crear bahía con tipo inexistente | 400 | 400 | 15 | OK | — |
| S2-BAH-09 | HU-09 | Actualizar ubicación | 200 y persistido | 200 | 28 | OK | n.º 12 |
| S2-BAH-10 | HU-09 | Actualizar a un estado inexistente | 400 | 400 | 17 | OK | — |
| S2-BAH-11 | HU-09 | Administrador devuelve la bahía a DISPONIBLE | 200, estado 1 | 200 | 18 | OK | — |
| S2-BAH-12 | HU-04/RF-04 | Eliminar bahía (borrado lógico) | 204; queda FUERA_DE_SERVICIO | **409**; la bahía queda en estado 1 | 23 | **FALLA** (DEF-01) | n.º 13 (ya corregido) |
| S2-BAH-13 | HU-09/RF-09 | Administrador pasa la bahía a FUERA_DE_SERVICIO | 200, estado 4 | **409** "viola una restricción de la base de datos" | 33 | **FALLA** (DEF-01) | — |

## Sprint 2 — vehículos (HU-02, HU-04)

| ID | Ref. | Caso | Esperado | Obtenido | ms | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S2-VEH-01 | HU-02/RF-02 | Registrar vehículo propio | 201 | 201, idVehiculo=41 | 68 | OK | n.º 20 |
| S2-VEH-02 | HU-02 | Tipo de vehículo inexistente | 400 | 400 | 15 | OK | — |
| S2-VEH-03 | HU-02 | Sin identificador | 400 | 400 | 4 | OK | — |
| S2-VEH-04 | HU-02 | Listar vehículos propios | 200, incluye el nuevo | 200, 3 vehículos | 41 | OK | n.º 21 |
| S2-VEH-05 | RNF | Usuario 5 elimina vehículo del usuario 4 | 403 | 403 | 15 | OK | — |
| S2-VEH-06 | HU-04/RF-04 | Eliminar vehículo propio (borrado lógico) | 204; deja de listarse | 204 | 25 | OK | n.º 22 |
| S2-VEH-07 | HU-04 | Reservar con un vehículo dado de baja | 400 | 400 | 15 | OK | — |

## Sprint 2 — reservas (HU-02, HU-06, RNF Fiabilidad)

| ID | Ref. | Caso | Esperado | Obtenido | ms | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S2-RES-01 | HU-02/RF-02 | Reservar bahía de bicicleta con un scooter | 409 | 409 "no es compatible con el tipo de tu vehículo" | 70 | OK | n.º 23 |
| S2-RES-02 | HU-02 | Reservar con vehículo de otro usuario | 400 | 400 | 17 | OK | — |
| S2-RES-03 | HU-06 | Reservar bahía inexistente | 404 | 404 | 38 | OK | — |
| S2-RES-04 | HU-06 | Reservar bahía que no está DISPONIBLE | 409 | 409 | 39 | OK | n.º 23 |
| S2-RES-05 | RNF Fiabilidad (ACID) | Dos usuarios reservan la misma bahía al mismo tiempo | Una 201 y una 409 | 201 y 409; bahía RESERVADA | 78 | OK | — |
| S2-RES-06 | HU-06 | Cancelar reserva pendiente propia | 200 CANCELADA; bahía DISPONIBLE | 200 | 36 | OK | n.º 25 |
| S2-RES-07 | HU-06 | Cancelar una reserva ya cancelada | 409 | 409 | 13 | OK | — |
| S2-RES-08 | HU-06/RF-06 | Crear reserva válida | 201 PENDIENTE; expira a los 15 min; bahía RESERVADA | 201, ventana de 15 min | 55 | OK | n.º 23 |
| S2-RES-09 | Regla de negocio | Segunda reserva con una pendiente | 409 | 409 "Ya tienes una reserva pendiente" | 39 | OK | — |
| S2-RES-10 | HU-06 | Listar reservas pendientes propias | 200 con 1 | 200 | 22 | OK | n.º 24 |
| S2-RES-11 | RNF | Usuario 5 cancela reserva del usuario 4 | 403 | 403 | 13 | OK | — |
| S2-RES-12 | HU-04/RF-04 | DELETE físico de una reserva, como administrador | La ruta no existe | 404 | 7 | OK | — |
| S2-RES-13 | HU-06/RF-06 | Expiración automática de una reserva no usada | Pasados 15 min: reserva EXPIRADA, bahía DISPONIBLE, check-in rechazado | Reserva 65 EXPIRADA a los 15 min; bahía 3 DISPONIBLE; check-in tardío 409 | — | OK | — |

## Sprint 2 — check-in, check-out e historial (HU-07, HU-08, HU-04)

| ID | Ref. | Caso | Esperado | Obtenido | ms | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S2-TX-01 | HU-07 | Check-in con la reserva de otro usuario | 403 | 403 | 22 | OK | — |
| S2-TX-02 | HU-07 | Check-in con reserva inexistente | 404 | 404 | 17 | OK | — |
| S2-TX-03 | HU-07/RF-07 | Check-in sin reserva | 400 | 400 "idReserva: no debe ser nulo" | 6 | OK | — |
| S2-TX-04 | HU-07 | Check-in con el QR de otra bahía | 409; nada cambia | 409; bahía sigue RESERVADA | 16 | OK | — |
| S2-TX-05 | HU-07/HU-03/RNF Rendimiento | Check-in válido | 200 ACTIVA en menos de 2 s; bahía OCUPADA | 200 en 115 ms; bahía OCUPADA; sin reservas pendientes | 115 | OK | n.º 26 |
| S2-TX-06 | RNF Fiabilidad | Repetir check-in con la misma reserva | 409 | 409 | 13 | OK | — |
| S2-TX-07 | Regla de negocio | Cancelar una reserva ya concretada | 409 | 409 | 14 | OK | — |
| S2-TX-08 | RNF Fiabilidad | Otro usuario reserva una bahía OCUPADA | 409 | 409 | 40 | OK | — |
| S2-TX-09 | RNF | Usuario 5 hace check-out del uso del usuario 4 | 403 | 403 | 22 | OK | — |
| S2-TX-10 | HU-07/HU-04 | Check-out válido | 200 FINALIZADA; fin ≥ inicio; bahía DISPONIBLE | 200 | 92 | OK | n.º 27 |
| S2-TX-11 | RNF Fiabilidad | Repetir check-out | 409 | 409 | 12 | OK | — |
| S2-TX-12 | HU-08/RF-08 | Historial tras finalizar | Aparece primero con rack, ubicación, vehículo y minutos | RACK-BICI-01, Sede Maipu - Acceso Norte, Trek Marlin 5, 0 min | 41 | OK | n.º 28 |
| S2-TX-13 | HU-04/RF-04 | DELETE físico de un uso, como administrador | La ruta no existe | 404 | 4 | OK | — |

## Sprint 2 — tickets de mantención (HU-09)

| ID | Ref. | Caso | Esperado | Obtenido | ms | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S2-TKT-01 | HU-09/RF-09 | Usuario reporta una falla | 201; bahía FUERA_DE_SERVICIO | **409** "viola una restricción de la base de datos"; nada cambia | 31 | **FALLA** (DEF-01) | — |
| S2-TKT-02 | HU-09/RF-09 | Administrador abre ticket sobre la bahía 1 | 201; bahía FUERA_DE_SERVICIO | **409**; nada cambia | 35 | **FALLA** (DEF-01) | n.º 14 (ya corregido) |
| S2-TKT-03 | HU-09 | Ticket sin descripción | 400 | 400 | 4 | OK | — |
| S2-TKT-04 | HU-09 | Ticket a un estado inválido | 400 | 400 | 23 | OK | — |
| S2-TKT-05 | HU-09 | Ticket 1 de ABIERTO a EN_REVISION | 200 y persistido | 200 (luego devuelto a ABIERTO) | 30 | OK | n.º 16 (mismo endpoint, a RESUELTO) |
| S2-TKT-06 | HU-09 | Actualizar ticket inexistente | 404 | 404 | 11 | OK | — |

No se pudo probar el ciclo completo de un ticket nuevo (RESUELTO libera la bahía, ANULADO como borrado lógico) porque la creación falla.

## Sprint 2 — usuarios (HU-10, HU-04)

| ID | Ref. | Caso | Esperado | Obtenido | ms | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S2-USR-01 | HU-10/RF-10 | Administrador crea usuario | 201 | 201, idUsuario=41 | 669 | OK | n.º 4 |
| S2-USR-02 | HU-10 | RUT duplicado | 409 | 409 | 15 | OK | — |
| S2-USR-03 | HU-10 | Correo duplicado, en mayúsculas | 409 | 409 | 31 | OK | — |
| S2-USR-04 | HU-10 | Rol inexistente | 400 | 400 | 7 | OK | — |
| S2-USR-05 | HU-10 | Correo mal formado | 400 | 400 | 5 | OK | — |
| S2-USR-06 | HU-01/HU-10 | El usuario nuevo inicia sesión | 200, idRol=2 | 200 | 68 | OK | — |
| S2-USR-07 | HU-10/RF-10 | Administrador bloquea al usuario; este intenta entrar | Login denegado | 403 "Usuario bloqueado: acceso denegado" | 24 | OK | — |
| S2-USR-08 | RNF Seguridad | Usuario bloqueado usa un token emitido antes del bloqueo | 401 o 403 | **200**; el token sigue aceptado | 11 | **FALLA** (DEF-03) | — |
| S2-USR-09 | HU-10 | Estado de usuario inválido | 400 | 400 | 12 | OK | — |
| S2-USR-10 | HU-10/RF-10 | Rehabilitar y cambiar rol a Colaborador | 200; login con idRol=3 | 200, idRol=3 | 33 | OK | n.º 6 (cambio de rol) |
| S2-USR-11 | HU-04/RF-04 | Eliminar usuario (borrado lógico) | 204; queda INACTIVO; login denegado | 204, INACTIVO, login 403 | 18 | OK | n.º 7 |
| S2-USR-12 | HU-10 | Administrador se desactiva a sí mismo | 409 | 409 | 7 | OK | — |
| S2-USR-13 | HU-10 | Actualizar usuario inexistente | 404 | 404 | 12 | OK | — |

S2-USR-08 va más allá del criterio de la HU-10, que solo exige negar el inicio de sesión. Se registra como falla de seguridad, no de la historia.

## Sprint 2 — documentación de la API

| ID | Ref. | Caso | Esperado | Obtenido | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- |
| S2-DOC-01 | ERS 1.2 | Swagger disponible | 200 | 200 | OK | Todo el documento |

## Sprint 3 (adelantado) — simulador IoT (HU-03)

| ID | Ref. | Caso | Esperado | Obtenido | ms | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S3-IOT-01 | HU-03/RNF | Telemetría sin cabecera X-IOT-KEY | 401 | 401 | 8 | OK | — |
| S3-IOT-02 | HU-03/RF-03 | Simulador envía lectura de sensor | 200 + idLog; bahía igual | 200, idLog=21 | 42 | OK | n.º 29 |
| S3-IOT-03 | HU-03/RF-03 | Simulador envía ALERTA_FALLA | Bahía FUERA_DE_SERVICIO | **409**; bahía sigue DISPONIBLE | 47 | **FALLA** (DEF-01) | n.º 30 (ya corregido) |
| S3-IOT-04 | HU-03/HU-07 | Reservar una bahía que recibió alerta de falla | 409 | **201**; la reserva se crea | 53 | **FALLA** (consecuencia de DEF-01) | — |
| S3-IOT-05 | HU-03 | Telemetría de un dispositivo no registrado | 404 | 404 | 14 | OK | — |
| S3-IOT-06 | HU-03/RF-03 | Comando LIBERAR_CERROJO | 200 EJECUTADO | 200 "Cerrojo liberado exitosamente en el hardware" | 8 | OK | n.º 31 |
| S3-IOT-07 | HU-03 | Comando a un dispositivo desconocido | 404 | 404 | 9 | OK | — |

## Sprint 4 — analítica (HU-11)

| ID | Ref. | Caso | Esperado | Obtenido | Resultado | Captura |
| --- | --- | --- | --- | --- | --- | --- |
| S4-ANA-01 | HU-11/RF-11 | Administrador pide los datos de embebido de Power BI | 200 con URL | 503 "Power BI no configurado" | No aplica todavía | n.º 18 |

## Defectos

| ID | Severidad | Defecto | Casos | Corrección |
| --- | --- | --- | --- | --- |
| DEF-01 | Crítica | En la base de la nube, asignar el estado 4 (FUERA_DE_SERVICIO) a una bahía viola una restricción. Los estados 2 y 3 se aceptan. Causa probable: el catálogo ESTADO_BAHIA no tiene el ID 4 | S2-TKT-01, S2-TKT-02, S2-BAH-12, S2-BAH-13, S3-IOT-03, S3-IOT-04 | Recrear el esquema y cargar los datos una sola vez |
| DEF-02 | Alta | Datos duplicados e incoherentes: vehículos 1–10 repetidos como 21–30, usos 1–4 repetidos como 21–24, bahía 4 con ID 24 y RESERVADA sin reserva, bahía 3 DISPONIBLE con dos usos ACTIVOS, bahía 2 DISPONIBLE con ticket ABIERTO | Estado leído antes de las pruebas | Misma recarga; hacer el script repetible |
| DEF-03 | Media | El token de un usuario bloqueado sigue vigente hasta 240 minutos | S2-USR-08 | Validar el estado del usuario en el filtro JWT |
| DEF-04 | Media | El administrador puede dejar DISPONIBLE una bahía con reserva pendiente o ticket abierto | Observado con la reserva 64 | Validar la transición de estado |
| DEF-05 | Media | Sin `.gitignore` en la raíz: `wallet/` se subiría a GitHub; `application.yml` trae valores por defecto sensibles | Revisión de la carpeta | Crear `.gitignore` y quitar los valores por defecto |
| DEF-06 | Baja | "15 minutos" escrito fijo en la app y en los datos de prueba | `bahias.page.ts:140`, `02_insert.sql` | Leer la duración desde la reserva |
| DEF-07 | Baja | Contraseñas de prueba en texto plano | `02_insert.sql` | Cargar hashes BCrypt |
| DEF-08 | Baja | Sin pruebas automatizadas; README del backend desactualizado | No existe `backend/src/test` | Agregar pruebas y corregir el README |

## Datos de prueba que quedaron en la base

El sistema no borra físicamente, así que estos registros permanecen hasta que se recargue la base.

| Registro | Estado |
| --- | --- |
| Usuario "QA Usuario de Prueba (ignorar)", ID 41 | INACTIVO |
| Bahía RACK-QA-01, ID 41, con dispositivo IoT | DISPONIBLE (DEF-01 impidió dejarla fuera de servicio) |
| Vehículo "QA Scooter de prueba", ID 41, del usuario 4 | INACTIVO |
| Reservas 61 a 65 | 61, 63 y 64 CANCELADAS; 62 CONCRETADA; 65 EXPIRADA |
| Uso 41, usuario 4, bahía 1 | FINALIZADO |
| Evento IoT 21 | Lectura de sensor de la bahía de prueba |
