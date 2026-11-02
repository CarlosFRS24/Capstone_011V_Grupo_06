# OmniDock

Plataforma para gestionar estacionamientos de bicicletas y scooters en las sedes de Duoc UC.

Proyecto Capstone del **Equipo Nodalix** — Escuela de Informática y Telecomunicaciones, Duoc UC.

## Qué es

Hoy los bicicleteros son estructuras de fierro en forma de U invertida, donde cada persona deja su bicicleta o scooter con su propio candado. Hace poco se agregó un control con el RUT y un código de barras en cada bicicleta, que registra la entrada y la salida, pero a la salida no siempre se revisa que la bicicleta sea de quien la saca. Además, no se sabe si hay espacio antes de llegar ni en qué lugar queda cada vehículo. OmniDock propone que cada rack se pueda reservar y abrir desde el celular, y que la institución vea cómo se usan los estacionamientos.

- **App móvil:** el usuario entra con su cuenta institucional, registra su bicicleta o scooter, ve las bahías disponibles, reserva una (tiene 1 hora para llegar, dentro del horario de la sede) y abre o cierra su sesión escaneando el código QR del rack. Si no hay bahías libres para su vehículo se une a una lista de espera, y cada reserva a la que no llega le suma una falta: con 3 no puede reservar hasta que el administrador las anule. Los avisos le llegan a una campana en la app.
- **Panel web:** el administrador ve el estado de cada bahía (disponible, reservada, ocupada o fuera de servicio), gestiona usuarios, permisos y faltas, maneja los tickets de mantención y ve la pantalla Analítica, con gráficos de uso calculados sobre las vistas BI.
- **Simulador IoT:** como no tenemos el hardware real, un simulador hace de candado: recibe las órdenes de abrir y cerrar y envía el estado del rack.
- **Power BI:** un panel de tres páginas en Power BI Desktop muestra reservas, usos, horas punta, faltas, lista de espera, estado de las bahías y fallas.

## Estado del proyecto (al 01/11/2026)

| Parte | Estado |
| --- | --- |
| Base de datos Oracle | Lista (Sprint 2). En el Sprint 4 se agregaron faltas, lista de espera y avisos: 14 tablas, 50 bahías y 10 vistas para BI |
| Backend y simulador IoT | Listos (Sprint 2). En el Sprint 4 se agregaron el horario de la sede, la reserva de 1 hora, las faltas, la lista de espera y los avisos |
| Diseño de pantallas en Figma | Listo (Sprint 2). Las pantallas nuevas del Sprint 4 están como capturas en el anexo 5.5.3 del ERS |
| App móvil y panel web | Listos (Sprint 3), con las pantallas nuevas y la Analítica del Sprint 4 |
| Power BI | Panel terminado en Power BI Desktop (Sprint 4). El instituto no permite publicarlo ni embeberlo, así que el panel web muestra sus propios gráficos |
| Pruebas | Regresión de la API 115 de 115 OK, prueba de carga y los 22 casos del Sprint 4 OK (`omnidock/docs/qa/` y `omnidock/docs/sprint-4/`) |

## Tecnologías

| Parte | Con qué está hecha |
| --- | --- |
| Base de datos | Oracle Autonomous Database, en Oracle Cloud |
| Backend | Java 17, Spring Boot 3, Spring Security con JWT, Maven y Swagger |
| Simulador IoT | Va dentro del backend y se activa con el perfil `mock` |
| App y panel web | Ionic 8, Angular 18 y Capacitor, en un mismo proyecto |
| Reportes | Power BI, sobre vistas SQL de la base |
| Gestión | Jira para las tareas, GitHub para el código y Figma para el diseño |

## Carpetas

| Carpeta | Qué tiene |
| --- | --- |
| `Fase 1/`, `Fase 2/` y `Fase 3/` | Evidencias de cada fase de la asignatura: grupales, individuales (diarios de reflexión) y seguimiento semanal |
| `Fase 2/Evidencias Proyecto/` | Visión del producto, Product Backlog, Sprint Backlog y definición de terminado |
| `omnidock/backend/` | API REST en Spring Boot, con el simulador IoT |
| `omnidock/frontend/` | App móvil (Android) y panel web en Ionic |
| `omnidock/database/` | Scripts de Oracle para crear la base, cargar datos de prueba y revisarlos |
| `omnidock/docs/arquitectura/` | ERS, DAS y diagramas UML |
| `omnidock/docs/sprint-0/` a `omnidock/docs/sprint-4/` | Un README por sprint: qué hicimos, quién, entregables, pruebas y retrospectiva |
| `omnidock/docs/gestion/` | Burndown y exportación de Jira |
| `omnidock/docs/qa/` | Registro de las pruebas de la API y de la base |

## Cómo levantar el proyecto

### Qué se necesita

- Acceso a la base Oracle del proyecto (con la carpeta `wallet/`, que no se sube al repositorio) o un Oracle XE local (19c o 21c), y Oracle SQL Developer.
- JDK 17 o superior y Maven 3.8 o superior.
- Node.js 18 o superior e Ionic CLI (`npm i -g @ionic/cli`).
- Git y, para los reportes, Power BI Desktop.

### 1. Clonar el repositorio

```bash
git clone https://github.com/CarlosFRS24/Capstone_011V_Grupo_06.git
cd Capstone_011V_Grupo_06/omnidock
```

Desde aquí, todas las rutas de esta guía parten en la carpeta `omnidock/`.

### 2. Crear la base de datos

Con el backend detenido, ejecutar los scripts en este orden:

1. `database/00_drop.sql`: borra las 14 tablas, las 10 vistas y sus datos. Si alguna no existe, ese error se ignora.
2. `database/01_ddl.sql`: crea las 14 tablas con sus restricciones.
3. `database/02_insert.sql`: carga los catálogos y los datos de prueba (20 usuarios, 50 bahías en Acceso Norte y Patio Central, vehículos, reservas, usos, faltas y avisos). Siempre sobre tablas recién creadas.
4. `database/03_verificar.sql`: consultas para revisar que todo quedó bien cargado.

Para Power BI, aparte:

5. `database/04_vistas_bi.sql`: crea las 10 vistas para los reportes (4 dimensiones y 6 hechos, incluidas faltas y lista de espera).
6. `database/05_consultas_bi.sql`: consultas de ejemplo sobre esas vistas (ocupación, horas punta, permanencia, reservas, faltas, lista de espera y mantención).
7. `database/06_datos_historicos.sql`: carga datos de ejemplo de tres meses (15/06 al 17/09/2026) para que los reportes tengan qué mostrar. Se ejecuta una sola vez, después del 02 y del 04.

Orden completo para dejar la base lista: `00` → `01` → `02` → `03` → `04` → `06`.

Para probar las restricciones de la base:

8. `database/07_prueba_check.sql`: intenta guardar valores inválidos y comprueba que la base los rechaza. No deja cambios, porque termina con ROLLBACK.

> Los estados de bahía tienen ID fijo: 1 `DISPONIBLE`, 2 `RESERVADA`, 3 `OCUPADA` y 4 `FUERA_DE_SERVICIO`. Si se cambian, hay que actualizar `domain/Estados.java` en el backend.

### 3. Configurar el backend

```bash
# Oracle Cloud (alias del wallet):
export DB_URL="jdbc:oracle:thin:@omnidock_high?TNS_ADMIN=/ruta/a/wallet"
# u Oracle XE local:
export DB_URL=jdbc:oracle:thin:@//localhost:1521/XEPDB1
export DB_USER=<usuario> DB_PASSWORD=<clave>
```

También se puede editar `backend/src/main/resources/application.yml`. Son opcionales `JWT_SECRET`, `RESERVA_MINUTOS` (60 por defecto; con `2` se puede ver una falta sin esperar), `HORARIO_ACTIVO` (`false` permite reservar a cualquier hora, para probar o presentar) y las variables `PBI_*` de Power BI.

### 4. Levantar el backend

```bash
cd backend
JPA_DDL=validate mvn spring-boot:run -Dspring-boot.run.profiles=mock   # la primera vez: revisa que las entidades calcen con la base
mvn spring-boot:run -Dspring-boot.run.profiles=mock                    # uso normal
```

La API queda en `http://localhost:8080` y la documentación Swagger en `http://localhost:8080/swagger-ui.html`.

### 5. Probar la API

Los usuarios de prueba están en `database/02_insert.sql`; por ejemplo, el administrador `csoto@duocuc.cl` y el usuario `mmunoz@duocuc.cl`. El flujo completo (login, reserva, check-in, check-out, historial y falla simulada) está con ejemplos en `backend/README.md`.

Para correr todas las pruebas de la API de una vez, ver `backend/pruebas/README.md`.

### 6. Frontend

Para levantar la app y el panel web en el navegador:

```bash
cd frontend
npm install
npm start          # http://localhost:8100
```

- La dirección del backend se define en `frontend/src/environments/environment.ts` (por defecto `http://localhost:8080/api/v1`; en un emulador Android se usa `http://10.0.2.2:8080/api/v1`).
- El administrador entra al panel web (`/admin`) y el usuario final a la app (`/app`).
- En el navegador el check-in permite escribir el código del rack (por ejemplo `RACK-BICI-01`). En el celular se escanea el QR; hay QR de prueba en `frontend/qr-prueba/`.

### 7. Power BI

El panel está en `docs/sprint-4/Omnidock.pbix` y se abre con Power BI Desktop. Se conecta a la base Oracle con el mismo wallet del backend y usa las 10 vistas de `04_vistas_bi.sql`. Si después de cambiar las vistas no aparecen las nuevas, hay que borrar la caché de Power BI (*Archivo → Opciones y configuración → Opciones → Carga de datos → Borrar caché*).

El panel web no depende de Power BI: la pantalla Analítica calcula sus gráficos con las mismas vistas. Embeber el informe queda opcional, porque el instituto no permite publicarlo. Si se pudiera, basta con definir `PBI_EMBED_URL` (o `PBI_MODO=embedded` con las variables `PBI_*` de una aplicación de Microsoft Entra ID).

## Integrantes

| Integrante | Rol | Qué hace |
| --- | --- | --- |
| Carlos Román | Líder del proyecto y diseño (UI/UX) | Lleva el backlog en Jira, planifica los sprints, diseña en Figma y construye la app y el panel web |
| Crisler Romero | Arquitectura de datos y BI | Diseña el modelo de datos en Oracle, los scripts, las reglas de integridad y las vistas para Power BI |
| Felipe Vidal | Backend e integración IoT | Programa la API en Spring Boot, la seguridad con JWT, los contratos de la API y el simulador IoT |

## Cómo trabajamos

Partimos en cascada y el 09/09/2026 cambiamos a metodología ágil. Trabajamos en sprints de dos semanas y llevamos las tareas en Jira. Las 14 historias de usuario están en el ERS (anexo 5.4); las HU-12 a HU-14 se agregaron en el Sprint 4.

| Sprint | Fechas | De qué se trata |
| --- | --- | --- |
| Sprint 0 | 24/08 al 06/09 | Kick-off y alcance |
| Sprint 1 | 07/09 al 20/09 | Requisitos (ERS), diseño de la base de datos y contratos de la API |
| Sprint 2 | 21/09 al 04/10 | Base de datos, backend con seguridad y diseño de pantallas |
| Sprint 3 | 05/10 al 18/10 | App móvil, panel web e integración con el backend |
| Sprint 4 | 19/10 al 01/11 | Power BI, pruebas finales y cierre |

El detalle de cada sprint está en `omnidock/docs/sprint-N/`.

## Documentación

- **ERS** (requisitos) y **DAS** (arquitectura, con el modelo de vistas 4+1): `omnidock/docs/arquitectura/`
- **Diagramas UML:** `omnidock/docs/arquitectura/uml/`
- **Visión del producto y backlogs:** `Fase 2/Evidencias Proyecto/`
- **Burndown y Jira:** `omnidock/docs/gestion/`
- **Pruebas:** `omnidock/docs/qa/` y el README de cada sprint
