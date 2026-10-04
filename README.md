# 🚲 OmniDock: Plataforma Transaccional de Gestión de Micromovilidad

![Estado del Proyecto](https://img.shields.io/badge/Estado-En_Desarrollo-blue)
![Java](https://img.shields.io/badge/Backend-Java_Spring_Boot-orange)
![Oracle](https://img.shields.io/badge/Base_de_Datos-Oracle_SQL-red)
![Power BI](https://img.shields.io/badge/Analítica-Power_BI-yellow)
![Metodología](https://img.shields.io/badge/Metodología-Scrum_Ágil-brightgreen)

---

## 1. Nombre del Proyecto
**OmniDock: Plataforma Transaccional de Gestión de Micromovilidad**
*Desarrollado por **Equipo Nodalix** — Escuela de Informática y Telecomunicaciones, Duoc UC.*

---

## 2. Descripción
**OmniDock** es una plataforma SaaS transaccional e *IoT-ready* diseñada para modernizar, automatizar y asegurar el control de accesos y la asignación de estacionamientos de bicicletas y scooters dentro de las sedes institucionales de Duoc UC.

El sistema transforma la infraestructura pasiva (bicicleteros tradicionales) en puntos de control activos mediante una arquitectura omnicanal sustentada en una **Fuente Única de Verdad (*Single Source of Truth*)** en Oracle SQL:
* **Autogestión en Terreno (App Móvil):** Permite a estudiantes, docentes y funcionarios autenticarse con sus credenciales institucionales, registrar sus vehículos personales, consultar disponibilidad de bahías por sector en tiempo real, realizar una **reserva previa obligatoria** (ventana de 15 minutos) e iniciar o finalizar su sesión de estacionamiento (*Check-in / Check-out*) mediante lectura de códigos QR.
* **Control Operativo y Administración (Panel Web Admin):** Permite a los administradores monitorear el estado operativo de los racks en tiempo real (`DISPONIBLE`, `RESERVADA`, `OCUPADA`, `FUERA_DE_SERVICIO`), gestionar usuarios y permisos bajo control de acceso basado en roles (**RBAC**), y administrar tickets de mantenimiento técnico ante fallas de hardware.
* **Simulación Bidireccional IoT (Mocking):** Emula la comunicación con los microcontroladores físicos de los racks para el envío de comandos de apertura/cierre (`LIBERAR_CERROJO`, `BLOQUEAR_CERROJO`) y la ingesta de telemetría JSON (estado del candado, batería y conexión).
* **Inteligencia de Negocios (BI):** Procesa el historial transaccional inmutable mediante consultas analíticas (ETL) para alimentar dashboards directivos embebidos en **Microsoft Power BI**, reduciendo tiempos de búsqueda, eliminando reclamos por robos y optimizando el presupuesto de infraestructura.

---

## 3. Tecnologías Utilizadas

| Capa / Ámbito | Tecnologías y Herramientas | Propósito en el Proyecto |
| :--- | :--- | :--- |
| **Base de Datos (OLTP)** | **Oracle Autonomous Database** (Oracle Cloud), Oracle SQL Developer, Data Modeler | Persistencia relacional en 3FN con propiedades ACID, claves de identidad (`GENERATED ALWAYS`; los catálogos, `BY DEFAULT ON NULL`), fechas en UTC, integridad referencial y borrado lógico. |
| **Backend & Seguridad** | **Java (JDK 17+)**, Spring Boot 3, Spring Security, **JWT**, Maven, Spring Data JPA, Springdoc (Swagger) | Lógica de negocio, exposición de contratos API RESTful (`/api/v1/...`), validación de reservas y seguridad por roles (RBAC). |
| **Simulación IoT (Mock)** | **Perfil `mock` de Spring Boot** (`/api/mock-iot/*`), Swagger / Postman | Simulación de microcontroladores de racks para recepción de comandos e ingesta de eventos de telemetría. |
| **Frontend & UI/UX** | **Ionic 8 + Angular 18 + Capacitor**, TypeScript, Figma | App móvil (con escaneo QR) y panel web administrativo desde un mismo proyecto Ionic, con rutas protegidas por rol. |
| **Analítica y BI (OLAP)** | **Microsoft Power BI**, Vistas SQL Analíticas (ETL) | Construcción del modelo dimensional y dashboards embebidos de ocupación, rotación y fallas. |
| **Infraestructura & Gestión** | **Oracle Cloud** (capa gratuita), **Git / GitHub**, **Jira** | Base de datos ya desplegada en Oracle Cloud y máquina virtual proyectada para el backend; control de versiones distribuido y gestión de backlog bajo Scrum. |

---

## 4. Ejecución Local Paso a Paso

Sigue estos pasos en orden para desplegar y probar el proyecto completo en tu entorno local:

### Prerrequisitos del Sistema
* Acceso a la instancia **Oracle Autonomous Database** del proyecto (carpeta `wallet/`, que no se versiona) o un **Oracle Database XE (19c o 21c)** local, y **Oracle SQL Developer**.
* **Java Development Kit (JDK 17 o superior)** y **Apache Maven 3.8+**.
* **Node.js (v18+)** e **Ionic CLI** (`npm i -g @ionic/cli`) para las interfaces frontend.
* **Git**, **Postman** (para pruebas de API) y **Microsoft Power BI Desktop**.

---
### Paso 1: Clonar el repositorio y verificar estructura
```bash
git clone https://github.com/CarlosFRS24/Capstone_011V_Grupo_06.git
cd omnidock
```
Deben existir `/database`, `/backend`, `/frontend` y `/docs`. El simulador IoT **no** es un proyecto aparte: vive dentro de `/backend` y se activa con el perfil `mock`.

| Carpeta | Contenido |
| :--- | :--- |
| `backend/` | API REST en Spring Boot, con el simulador IoT |
| `frontend/` | App móvil y panel web en Ionic |
| `database/` | Scripts de Oracle: borrado, creación, datos de prueba y verificación |
| `docs/arquitectura/` | ERS, DAS y diagramas UML |
| `docs/sprint-0/` a `docs/sprint-4/` | Planificación, entregables, evidencias de QA, review y retrospectiva de cada sprint |
| `docs/qa/` | Registro detallado de las pruebas ejecutadas |

### Paso 2: Crear la base de datos (Oracle)
Con el backend detenido y conectado como el usuario/esquema de la aplicación, ejecuta en este orden:
1. `database/00_drop.sql`: borra las 11 tablas y todos sus datos (si alguna no existe, ese error se ignora).
2. `database/01_ddl.sql`: crea las 11 tablas y los `ALTER` del Sprint 2.
3. `database/02_insert.sql`: catálogos y datos de prueba (20 usuarios, 4 bahías, vehículos, reservas y transacciones). Se ejecuta siempre sobre tablas recién creadas.
4. `database/03_verificar.sql`: consultas de solo lectura para confirmar catálogos, cantidades y que el estado de cada bahía calce con sus datos.

> Catálogo `ESTADO_BAHIA`: 1 `DISPONIBLE`, 2 `RESERVADA`, 3 `OCUPADA`, 4 `FUERA_DE_SERVICIO`. Si cambias estos IDs, actualiza `domain/Estados.java` en el backend.

### Paso 3: Configurar el backend
```bash
# Oracle Cloud (alias del wallet):
export DB_URL="jdbc:oracle:thin:@omnidock_high?TNS_ADMIN=/ruta/a/wallet"
# u Oracle XE local:
export DB_URL=jdbc:oracle:thin:@//localhost:1521/XEPDB1
export DB_USER=<usuario> DB_PASSWORD=<clave>
```
(También puedes editar `backend/src/main/resources/application.yml`.) Opcional: `JWT_SECRET`, `RESERVA_MINUTOS` (15 por defecto), `PBI_*` para Power BI.

### Paso 4: Levantar el backend (con simulador IoT)
```bash
cd backend
JPA_DDL=validate mvn spring-boot:run -Dspring-boot.run.profiles=mock   # primera vez: valida que las entidades calcen con el DDL
mvn spring-boot:run -Dspring-boot.run.profiles=mock                    # uso normal
```
API en `http://localhost:8080` y documentación Swagger en `http://localhost:8080/swagger-ui.html`.

### Paso 5: Probar la API
Credenciales del seed: administrador `csoto@duocuc.cl` / `admin123`; usuario con bicicleta `mmunoz@duocuc.cl` / `user123`. El flujo completo (login, reserva, check-in, check-out, historial y falla simulada) está con ejemplos `curl` en `backend/README.md`.

### Paso 6: Levantar el frontend (Ionic)
```bash
cd frontend
npm install
npm start          # http://localhost:8100 (ya permitido por CORS en el backend)
```
La URL del backend se define en `frontend/src/environments/environment.ts` (por defecto `http://localhost:8080/api/v1`; en emulador Android usar `http://10.0.2.2:8080/api/v1`).
Usuarios de prueba: el administrador `csoto@duocuc.cl` / `admin123` entra al panel web (`/admin`); el usuario `mmunoz@duocuc.cl` / `user123` entra a la app (`/app`).
En el navegador no hay cámara: el check-in pide escribir el código del rack (ej. `RACK-BICI-01`). En celular se escanea el QR, que debe contener el código IoT del rack.

### Paso 7: Power BI — *en construcción*
Modo rápido para la demo: publicar el reporte y definir `PBI_EMBED_URL` (el backend lo expone en `GET /api/v1/analitica/embed-token`). Modo completo: `PBI_MODO=embedded` con las credenciales de la aplicación registrada en Microsoft Entra ID, antes Azure AD (`PBI_TENANT_ID`, `PBI_CLIENT_ID`, `PBI_CLIENT_SECRET`, `PBI_WORKSPACE_ID`, `PBI_REPORT_ID`).

---
## 5. Integrantes y Roles

El proyecto es desarrollado por el **Equipo Nodalix**, con una dedicación estimada de **900 Horas-Hombre (300 HH por integrante)** y un presupuesto CAPEX valorizado en **$18.600.000 CLP**:

| Nombre Integrante | Rol Definido | Responsabilidades Específicas |
| :--- | :--- | :--- |
| **Carlos Román** | **Líder de Proyecto (Scrum Master) / Desarrollador Frontend y UI/UX** | Gestión del Product Backlog en Jira, planificación de Sprints, diseño de prototipos en Figma y construcción de las interfaces de usuario (App Móvil y Panel Web Admin). |
| **Crisler Romero** | **Arquitectura de Datos y BI** | Diseño y normalización del modelo relacional en Oracle SQL (DDL/DML), reglas de integridad e inmutabilidad (borrado lógico, reserva obligatoria), diccionario de datos y pipeline ETL hacia Power BI. |
| **Felipe Vidal** | **Desarrollador Backend e Integración de APIs / IoT** | Construcción de la API RESTful en Java Spring Boot, implementación de seguridad JWT y RBAC, especificación de contratos API v1 y desarrollo de los simuladores de hardware IoT (Mocks). |

---

## 6. Metodología de Trabajo

El desarrollo se rige bajo una **Metodología Ágil (Scrum Adaptado)**, seleccionada estratégicamente para gestionar de forma incremental la integración entre el software transaccional y el hardware simulado:

* **Gestión del Backlog:** Administración de tareas mediante tableros Kanban/Scrum en **Jira**, documentando **11 Historias de Usuario (HU-01 a HU-11)** con criterios de aceptación bajo estándar *Gherkin (Dado / Cuando / Entonces)*.
* **Control de Cambios:** Priorización iterativa al inicio de cada Sprint, blindando el modelo relacional base en las primeras iteraciones para evitar refactorizaciones costosas.
* **Ciclo de Vida en 4 Sprints** (la evidencia de cada uno está en `docs/sprint-N/`):
  * **Sprint 1 — Fundamentos y Especificación (ERS), 07/09 al 20/09/2026:** Levantamiento de requerimientos bajo estándar IEEE 830, diseño conceptual/lógico de base de datos y definición de contratos API v1.
  * **Sprint 2 — Core Backend, Seguridad y Estructuración de Datos (DAS), 21/09 al 04/10/2026:** Construcción física de las 11 tablas en Oracle SQL, scripts DML de prueba con integridad referencial, implementación de CRUD y autenticación JWT en Java, diseño de interfaces (UI/UX) y elaboración del Documento de Arquitectura de Software (Modelo 4+1 Ágil).
  * **Sprint 3 — Integración IoT y Acoplamiento UI, 05/10 al 18/10/2026:** Conexión bidireccional entre la API Java y los simuladores de hardware IoT (Mocks), e integración de pantallas de la App Móvil y Web Admin.
  * **Sprint 4 — Analítica BI, Pruebas QA y Cierre, 19/10 al 01/11/2026:** Despliegue del pipeline ETL hacia Microsoft Power BI, embebimiento de reportes, pruebas de concurrencia/ACID y empaquetado final.

---

## 7. Arquitectura del Sistema

La arquitectura de **OmniDock** se estructura bajo el estándar **Modelo de Vistas 4+1 de Kruchten adaptado a Scrum**, garantizando trazabilidad total con el ERS v1.3.0. Los documentos y diagramas están en `docs/arquitectura/`.

### 7.1. Las 5 Vistas Arquitectónicas
1. **Vista de Escenarios (+1):** Compuesta por las **11 Historias de Usuario** divididas en tres flujos: *Autogestión en App Móvil* (HU-01, HU-02, HU-06, HU-07, HU-08), *Administración y Monitoreo Web* (HU-09, HU-10, HU-11) y *Core IoT, Auditoría y BI* (HU-03, HU-04, HU-05).
2. **Vista Lógica:** Sistema estructurado en 4 bloques desacoplados bajo el principio de *Single Source of Truth*:
   * **Capa de Presentación Omnicanal:** App Móvil (ciclistas) y Panel Web Admin con Power BI Embedded.
   * **Capa de Negocio (Backend Java):** API RESTful MVC asegurada con tokens JWT y control RBAC.
   * **Capa de Simulación IoT:** Servicio Mock (perfil `mock` del backend) que emula cerraduras electromagnéticas y sensores de bahía.
   * **Capa de Datos y Analítica:** Motor transaccional **Oracle SQL (OLTP)** + **Microsoft Power BI (OLAP)**.
3. **Vista de Procesos:** Implementa el flujo transaccional de **Reserva Obligatoria y Check-in**:
   * El usuario consulta bahías disponibles compatibles con su tipo de vehículo (`BICICLETA` o `SCOOTER`) -> Genera una reserva temporal de 15 minutos (`PENDIENTE`) -> Escanea el QR en terreno -> El Backend valida la reserva en Oracle, ordena al Mock IoT abrir el candado (`LIBERAR_CERROJO`) e inicia la sesión en `TRANSACCION_USO` (`ACTIVA`). Al hacer check-out la sesión pasa a `FINALIZADA` y la bahía vuelve a `DISPONIBLE`.
4. **Vista de Desarrollo (Modelo de Datos en 3FN):**
   * **11 Tablas en Oracle SQL:** `ROL`, `TIPO_VEHICULO`, `ESTADO_BAHIA`, `USUARIO`, `VEHICULO`, `BAHIA`, `RESERVA`, `TRANSACCION_USO`, `DISPOSITIVO_IOT`, `LOG_EVENTO_IOT` y `TICKET_MANTENIMIENTO`.
   * **Reglas de Integridad e Inmutabilidad (RF-04):** Prohibición de `DELETE` físico en tablas operativas mediante **Borrado Lógico** (`ESTADO_VEHICULO = 'INACTIVO'`, `USUARIO = 'INACTIVO'`) para proteger las llaves foráneas históricas requeridas por Power BI. Aplica también a bahías (`FUERA_DE_SERVICIO`) y tickets (`ANULADO`).
   * **Estados de bahía (catálogo):** `DISPONIBLE` -> `RESERVADA` -> `OCUPADA`, y `FUERA_DE_SERVICIO` ante fallas o tickets abiertos.
5. **Vista Física (Despliegue):** Clientes móviles y navegadores web conectados por HTTPS al backend, que se conecta por JDBC sobre TCPS a **Oracle Autonomous Database** en **Oracle Cloud**. La base de datos ya opera en Oracle Cloud; el backend corre hoy en el equipo de cada integrante y su despliegue en una máquina virtual de Oracle Cloud (capa gratuita) está proyectado. La analítica se integra con el servicio cloud de **Microsoft Power BI**.

### 7.2. Impacto y Propuesta de Valor al Negocio
* **-80% en tiempos de búsqueda de estacionamiento:** Reducción de 8-12 minutos a menos de 2 minutos mediante consulta de disponibilidad por sector y reserva asegurada de 15 minutos.
* **100% de trazabilidad y -90% en reclamos:** Registro inmutable que cruza `ID_USUARIO + ID_VEHICULO + ID_RESERVA + ID_BAHIA` con sellos `TIMESTAMP` exactos de entrada y salida.
* **-65% en tiempo de inactividad de racks (Downtime):** Bloqueo automático de bahías a estado `FUERA_DE_SERVICIO` al abrirse un `TICKET_MANTENIMIENTO` o recibirse una alerta de falla desde la telemetría IoT.
* **Optimización del CAPEX ($18.600.000 CLP):** Decisiones de expansión basadas en métricas reales de rotación horaria y demanda por tipo de vehículo en Power BI.
