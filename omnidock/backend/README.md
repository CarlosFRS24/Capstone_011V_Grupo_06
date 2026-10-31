# OmniDock · Backend

Es el servidor de OmniDock: recibe lo que hacen la app y el panel web, aplica las reglas (reservas, uso de bahías, faltas, lista de espera) y guarda todo en la base de datos Oracle. También le envía al rack la orden de abrir o cerrar el candado.

Está hecho en **Java 17 con Spring Boot 3** y expone una API REST protegida con login (JWT). Cada usuario solo puede hacer lo que permite su rol: administrador, usuario o colaborador.

## Qué se necesita

- Java 17 y Maven.
- La base de datos Oracle cargada con los scripts de `../database/` (ver abajo).
- Los datos de conexión a la base. Se entregan como variables de entorno y **nunca se suben a GitHub**:

| Variable | Para qué |
| --- | --- |
| `DB_URL` | Dirección de la base en Oracle Cloud (incluye la ruta al wallet) |
| `DB_USER` y `DB_PASSWORD` | Usuario y clave de la base |

## Cómo levantarlo

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=mock
```

- El perfil `mock` activa el **simulador IoT**: reemplaza a los racks físicos y responde las órdenes del candado.
- Queda en `http://localhost:8080`. La documentación de todos los servicios se ve en `http://localhost:8080/swagger-ui.html`.

### Opciones útiles para probar o presentar

| Variable | Qué hace |
| --- | --- |
| `HORARIO_ACTIVO=false` | Permite reservar a cualquier hora (normalmente solo L-V de 07:00 a 21:30 y sábado de 07:00 a 15:00) |
| `RESERVA_MINUTOS=2` | La reserva vence a los 2 minutos en vez de 60, para ver una falta sin esperar |

Ejemplo: `HORARIO_ACTIVO=false mvn spring-boot:run -Dspring-boot.run.profiles=mock`

## Base de datos

Los scripts están en `../database/` y se ejecutan en este orden:

1. `00_drop.sql`: borra todo (la primera vez puede avisar que algunas tablas no existen; es normal).
2. `01_ddl.sql`: crea las 14 tablas.
3. `02_insert.sql`: carga los datos de prueba (usuarios, vehículos y 50 bahías).
4. `03_verificar.sql`: revisa que la carga quedó bien.
5. `04_vistas_bi.sql`: crea las vistas que usan Power BI y la pantalla Analítica.
6. `06_datos_historicos.sql`: carga tres meses de historial de ejemplo (en la nube tarda unos minutos).

`05_consultas_bi.sql` trae consultas de ejemplo de los indicadores y `07_prueba_check.sql` prueba las restricciones de la base. Ninguno de los dos es obligatorio.

## Usuarios de prueba

| Correo | Clave | Rol | Para qué sirve |
| --- | --- | --- | --- |
| `csoto@duocuc.cl` | `admin123` | Administrador | Panel web |
| `mmunoz@duocuc.cl` | `user123` | Usuario | Tiene bicicleta; flujo normal de reserva |
| `gfuentes@duocuc.cl` | `user123` | Usuario | Tiene scooter y una reserva pendiente (vence 60 min después de cargar la base) |
| `fnavarro@duocuc.cl` | `user123` | Usuario | Tiene 3 faltas: no puede reservar hasta que el admin la desbloquee |

## Reglas principales

- **Reserva:** el usuario reserva una bahía libre y compatible con su vehículo, y tiene **60 minutos** para llegar. Solo puede tener una reserva pendiente, y dos personas no pueden reservar la misma bahía.
- **Horario:** se reserva de lunes a viernes de 07:00 a 21:30 y el sábado de 07:00 a 15:00 (hasta una hora antes del cierre). El domingo está cerrado.
- **Uso:** al escanear el QR del rack se abre el candado (check-in) y al terminar se cierra (check-out). Si el rack no responde en 2 segundos, no se cambia nada.
- **Faltas:** si la reserva vence sin check-in, queda una falta. Con **3 faltas** el usuario no puede reservar, pero sí usar la app y retirar su vehículo. El administrador las anula desde el panel.
- **Lista de espera:** si no hay bahías libres para su vehículo, el usuario se anota. Cuando se libera una, se le guarda **15 minutos** al primero y se le avisa en la app. Si no confirma, pasa al siguiente sin falta. La lista se cierra al terminar el horario.
- **Mantención:** un ticket o una alerta del rack deja la bahía fuera de servicio. Si estaba reservada, la reserva se cancela sin falta.
- **Sin borrado físico:** usuarios, vehículos, bahías y tickets se desactivan, no se borran, para mantener el historial.

## Pruebas

En `pruebas/` están la regresión automática de la API y la prueba de carga. Cómo correrlas está en `pruebas/README.md`; los reportes quedan en `../docs/qa/`.
