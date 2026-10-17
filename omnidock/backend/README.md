# OmniDock Backend (Spring Boot 3 / Java 17 / Oracle)

API REST según ERS v1.3.0 §5.8 y DAS v1.1 (patrón MVC, JWT + RBAC, borrado lógico, simulador IoT).

## Arranque rápido
```bash
# 1) Variables (o edita application.yml)
export DB_URL=jdbc:oracle:thin:@//localhost:1521/XEPDB1
export DB_USER=omnidock DB_PASSWORD=tu_clave

# 2) Primera vez: verifica que las entidades calcen con tu DDL (solo valida, no modifica)
JPA_DDL=validate mvn spring-boot:run -Dspring-boot.run.profiles=mock

# 3) Uso normal (perfil mock = simulador IoT dentro del mismo proceso)
mvn spring-boot:run -Dspring-boot.run.profiles=mock
```
Swagger: http://localhost:8080/swagger-ui.html

## Scripts (carpeta `database/`)
`00_drop.sql` -> `01_ddl.sql` -> `02_insert.sql` -> `03_verificar.sql`. La capa analítica va aparte: `04_vistas_bi.sql` -> `05_consultas_bi.sql`, y `06_datos_historicos.sql` carga datos de ejemplo para los reportes. `07_prueba_check.sql` prueba las restricciones CHECK. Los datos de prueba son coherentes con el backend y las fechas van en UTC.

## Prueba de punta a punta (usuarios del seed)
Admin: `csoto@duocuc.cl` / `admin123` (id 1). Usuario con bicicleta: `mmunoz@duocuc.cl` / `user123` (id 4, vehículo 1, bahía 1).
```bash
T=$(curl -s localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"emailInstitucional":"mmunoz@duocuc.cl","passwordPrototipo":"user123"}' | jq -r .token)
curl -s "localhost:8080/api/v1/bahias?idEstado=1" -H "Authorization: Bearer $T"
curl -s -X POST localhost:8080/api/v1/reservas -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d '{"idBahia":1,"idVehiculo":1}'
curl -s -X POST localhost:8080/api/v1/transacciones/iniciar -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d '{"idReserva":7,"idBahia":1,"idVehiculo":1}'
curl -s -X POST localhost:8080/api/v1/transacciones/5/finalizar -H "Authorization: Bearer $T"
curl -s localhost:8080/api/v1/transacciones/usuario/4 -H "Authorization: Bearer $T"
# Falla de hardware (HU-03), MAC de la bahía 1:
curl -s -X POST "localhost:8080/api/mock-iot/simular?mac=00:1B:44:11:3A:B7&evento=ALERTA_FALLA"
```
(Los ids 7 y 5 son los siguientes del seed; usa los que devuelvan las respuestas.)
Otros casos del seed: `gfuentes@duocuc.cl` / `user123` (id 11) tiene la reserva 6 PENDIENTE sobre la bahía 4 (scooter): puede hacer check-in con `{"idReserva":6,"idBahia":4,"idVehiculo":8}` antes de que expire (15 min desde que se cargó el seed). La bahía 2 está FUERA_DE_SERVICIO y la 3 OCUPADA (uso activo del usuario 10).

## Alineación con los scripts reales
Columnas, IDENTITY y largos validados contra `01_ddl.sql`. Catálogos según `02_insert.sql`:
ESTADO_BAHIA 1 DISPONIBLE / 2 RESERVADA / 3 OCUPADA / 4 FUERA_DE_SERVICIO; ROL 1 ADMINISTRADOR / 2 USUARIO / 3 COLABORADOR; TIPO_VEHICULO 1 BICICLETA / 2 SCOOTER.
- La "mantención" del DAS/ERS se representa con FUERA_DE_SERVICIO (tickets abiertos y alertas de falla IoT).
- El estado de una reserva con check-in es `CONCRETADA`, igual que en el ERS.

## Reglas implementadas (resumen)
- Reserva: 1 pendiente por usuario, vehículo propio y activo, bahía DISPONIBLE y compatible por tipo; `SELECT FOR UPDATE` evita doble asignación; expira a los `RESERVA_MINUTOS` (15) vía job.
- Check-in exige reserva PENDIENTE; si el simulador falla (502) se revierte todo. Check-out bloquea cerrojo y libera bahía (o FUERA_DE_SERVICIO si hay ticket abierto).
- Ticket abierto -> bahía FUERA_DE_SERVICIO; ticket RESUELTO/ANULADO y sin otros abiertos -> DISPONIBLE. `CERRADO` se acepta como alias de `RESUELTO`.
- Sin DELETE físico: usuarios, vehículos, bahías y tickets usan borrado lógico.
- Admin-only: `/usuarios`, `/analitica`, CRUD de bahías y gestión de tickets (GET/PUT/DELETE).
