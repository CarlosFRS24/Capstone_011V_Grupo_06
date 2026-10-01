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
* **Autogestión en Terreno (App Móvil):** Permite a estudiantes, docentes y funcionarios autenticarse con sus credenciales institucionales, registrar sus vehículos personales, consultar disponibilidad de bahías por sector en tiempo real, realizar una **reserva previa obligatoria** (ventana de 15 minutos) e iniciar o finalizar su sesión de estacionamiento (*Check-in / Check-out*) mediante lectura de códigos QR/NFC.
* **Control Operativo y Administración (Panel Web Admin):** Permite a los administradores monitorear el estado operativo de los racks en tiempo real (`DISPONIBLE`, `OCUPADA`, `MANTENCION`), gestionar usuarios y permisos bajo control de acceso basado en roles (**RBAC**), y administrar tickets de mantenimiento técnico ante fallas de hardware.
* **Simulación Bidireccional IoT (Mocking):** Emula la comunicación con los microcontroladores físicos de los racks para el envío de comandos de apertura/cierre (`LIBERAR_CERROJO`) y la ingesta de telemetría JSON (estado del candado, batería y conexión).
* **Inteligencia de Negocios (BI):** Procesa el historial transaccional inmutable mediante consultas analíticas (ETL) para alimentar dashboards directivos embebidos en **Microsoft Power BI**, reduciendo tiempos de búsqueda, eliminando reclamos por robos y optimizando el presupuesto de infraestructura.

---

## 3. Tecnologías Utilizadas

| Capa / Ámbito | Tecnologías y Herramientas | Propósito en el Proyecto |
| :--- | :--- | :--- |
| **Base de Datos (OLTP)** | **Oracle Database (19c / 21c)**, Oracle SQL Developer, Data Modeler | Persistencia relacional en 3FN con propiedades ACID, claves `GENERATED ALWAYS AS IDENTITY`, integridad referencial y borrado lógico. |
| **Backend & Seguridad** | **Java (JDK 17+)**, Spring Boot 3, Spring Security, **JWT**, Maven, JDBC/JPA | Lógica de negocio, exposición de contratos API RESTful (`/api/v1/...`), validación de reservas y seguridad por roles (RBAC). |
| **Simulación IoT (Mock)** | **Servidor Mock REST (JSON)**, Postman | Simulación de microcontroladores de racks para recepción de comandos e ingesta de eventos de telemetría. |
| **Frontend & UI/UX** | **HTML5, CSS3, JavaScript (Web & App Móvil)**, Figma | Diseño de prototipos e interfaces responsivas para el usuario final y el panel administrativo. |
| **Analítica y BI (OLAP)** | **Microsoft Power BI**, Vistas SQL Analíticas (ETL) | Construcción del modelo dimensional y dashboards embebidos de ocupación, rotación y fallas. |
| **Infraestructura & Gestión** | **Microsoft Azure** (Capa Académica), **Git / GitHub**, **Jira** | Entorno cloud proyectado, control de versiones distribuido y gestión de backlog bajo Scrum. |

---

## 4. Ejecución Local Paso a Paso

Sigue estos **8 pasos en orden estricto** para desplegar y probar el proyecto completo en tu entorno local:

### Prerrequisitos del Sistema
* **Oracle Database XE (19c o 21c)** instalado localmente (o acceso a instancia Oracle Cloud) y **Oracle SQL Developer**.
* **Java Development Kit (JDK 17 o superior)** y **Apache Maven 3.8+**.
* **Node.js (v18+)** (para ejecución de interfaces frontend).
* **Git**, **Postman** (para pruebas de API) y **Microsoft Power BI Desktop**.

---
### ...en construcción...
### Paso 1: Clonar el repositorio y verificar estructura
1. Abre una terminal y clona el repositorio oficial:
   `git clone https://github.com/equipo-nodalix/omnidock.git`
2. Ingresa a la carpeta raíz del proyecto:
   `cd omnidock`
3. Verifica que estén presentes los directorios `/database`, `/backend`, `/frontend`, `/iot-mock` y `/docs`.

---
## 5. Integrantes y Roles

El proyecto es desarrollado por el **Equipo Nodalix**, con una dedicación estimada de **900 Horas-Hombre (300 HH por integrante)** y un presupuesto CAPEX valorizado en **$18.600.000 CLP**:

| Nombre Integrante | Rol Definido | Responsabilidades Específicas |
| :--- | :--- | :--- |
| **Carlos Román** | **Líder de Proyecto (Scrum Master) / Desarrollador Frontend y UI/UX** | Gestión del Product Backlog en Jira, planificación de Sprints, diseño de prototipos en Figma y construcción de las interfaces de usuario (App Móvil y Panel Web Admin). |
| **Crisler Romero** | **Arquitectura de Datos, Business Intelligence (BI)** | Diseño y normalización del modelo relacional en Oracle SQL (DDL/DML), reglas de integridad e inmutabilidad (borrado lógico, reserva obligatoria), diccionario de datos y pipeline ETL hacia Power BI. |
| **Felipe Vidal** | **Desarrollador Backend e Integración de APIs / IoT** | Construcción de la API RESTful en Java Spring Boot, implementación de seguridad JWT y RBAC, especificación de contratos API v1 y desarrollo de los simuladores de hardware IoT (Mocks). |

---

## 6. Metodología de Trabajo

El desarrollo se rige bajo una **Metodología Ágil (Scrum Adaptado)**, seleccionada estratégicamente para gestionar de forma incremental la integración entre el software transaccional y el hardware simulado:

* **Gestión del Backlog:** Administración de tareas mediante tableros Kanban/Scrum en **Jira**, documentando **11 Historias de Usuario (HU-01 a HU-11)** con criterios de aceptación bajo estándar *Gherkin (Dado / Cuando / Entonces)*.
* **Control de Cambios:** Priorización iterativa al inicio de cada Sprint, blindando el modelo relacional base en las primeras iteraciones para evitar refactorizaciones costosas.
* **Ciclo de Vida en 4 Sprints:**
  * **Sprint 1 — Fundamentos y Especificación (ERS):** Levantamiento de requerimientos bajo estándar IEEE 830, diseño conceptual/lógico de base de datos, definición de contratos API v1 y prototipado UI/UX.
  * **Sprint 2 — Core Backend, Seguridad y Estructuración de Datos (DAS):** Construcción física de las 11 tablas en Oracle SQL, scripts DML de prueba con integridad referencial, implementación de CRUD y autenticación JWT en Java, y elaboración del Documento de Arquitectura de Software (Modelo 4+1 Ágil).
  * **Sprint 3 — Integración IoT y Acoplamiento UI:** Conexión bidireccional entre la API Java y los simuladores de hardware IoT (Mocks), e integración de pantallas de la App Móvil y Web Admin.
  * **Sprint 4 — Analítica BI, Pruebas QA y Cierre:** Despliegue del pipeline ETL hacia Microsoft Power BI, embebimiento de reportes, pruebas de concurrencia/ACID y empaquetado final.

---

## 7. Arquitectura del Sistema

La arquitectura de **OmniDock** se estructura bajo el estándar **Modelo de Vistas 4+1 de Kruchten adaptado a Scrum**, garantizando trazabilidad total con el ERS v1.1.0:

### 7.1. Las 5 Vistas Arquitectónicas
1. **Vista de Escenarios (+1):** Compuesta por las **11 Historias de Usuario** divididas en tres flujos: *Autogestión en App Móvil* (HU-01, HU-02, HU-06, HU-07, HU-08), *Administración y Monitoreo Web* (HU-09, HU-10, HU-11) y *Core IoT, Auditoría y BI* (HU-03, HU-04, HU-05).
2. **Vista Lógica:** Sistema estructurado en 4 bloques desacoplados bajo el principio de *Single Source of Truth*:
   * **Capa de Presentación Omnicanal:** App Móvil (ciclistas) y Panel Web Admin con Power BI Embedded.
   * **Capa de Negocio (Backend Java):** API RESTful MVC asegurada con tokens JWT y control RBAC.
   * **Capa de Simulación IoT:** Servicio Mock que emula cerraduras electromagnéticas y sensores de bahía.
   * **Capa de Datos y Analítica:** Motor transaccional **Oracle SQL (OLTP)** + **Microsoft Power BI (OLAP)**.
3. **Vista de Procesos:** Implementa el flujo transaccional de **Reserva Obligatoria y Check-in**:
   * El usuario consulta bahías disponibles compatibles con su tipo de vehículo (`BICICLETA` o `SCOOTER`) -> Genera una reserva temporal de 15 minutos (`PENDIENTE`) -> Escanea el QR en terreno -> El Backend valida la reserva en Oracle, ordena al Mock IoT abrir el candado (`LIBERAR_CERROJO`) e inicia la sesión en `TRANSACCION_USO` (`ACTIVA`).
4. **Vista de Desarrollo (Modelo de Datos en 3FN):**
   * **11 Tablas en Oracle SQL:** `ROL`, `TIPO_VEHICULO`, `ESTADO_BAHIA`, `USUARIO`, `VEHICULO`, `BAHIA`, `RESERVA`, `TRANSACCION_USO`, `DISPOSITIVO_IOT`, `LOG_EVENTO_IOT` y `TICKET_MANTENIMIENTO`.
   * **Reglas de Integridad e Inmutabilidad (RF-04):** Prohibición de `DELETE` físico en tablas operativas mediante **Borrado Lógico** (`ESTADO_VEHICULO = 'INACTIVO'`, `USUARIO = 'INACTIVO'`) para proteger las llaves foráneas históricas requeridas por Power BI.
5. **Vista Física (Despliegue):** Clientes móviles y navegadores web conectados por HTTPS a los servicios de aplicación y base de datos proyectados sobre infraestructura académica en **Microsoft Azure** y **Oracle Database**, integrados con el servicio cloud de **Microsoft Power BI**.

### 7.2. Impacto y Propuesta de Valor al Negocio
* **-80% en tiempos de búsqueda de estacionamiento:** Reducción de 8-12 minutos a menos de 2 minutos mediante consulta de disponibilidad por sector y reserva asegurada de 15 minutos.
* **100% de trazabilidad y -90% en reclamos:** Registro inmutable que cruza `ID_USUARIO + ID_VEHICULO + ID_RESERVA + ID_BAHIA` con sellos `TIMESTAMP` exactos de entrada y salida.
* **-65% en tiempo de inactividad de racks (Downtime):** Bloqueo automático de bahías a estado `MANTENCION` al abrirse un `TICKET_MANTENIMIENTO` o recibirse una alerta de falla desde la telemetría IoT.
* **Optimización del CAPEX ($18.600.000 CLP):** Decisiones de expansión basadas en métricas reales de rotación horaria y demanda por tipo de vehículo en Power BI.
