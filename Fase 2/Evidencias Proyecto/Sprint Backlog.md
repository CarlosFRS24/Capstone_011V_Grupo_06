# Sprint Backlog

Trabajamos en sprints de dos semanas. Este archivo resume las tareas de cada sprint según Jira, al 05/10/2026. El detalle (qué hizo cada uno, entregables, pruebas y retrospectiva) está en el `README.md` de cada carpeta `../sprint-N/`.

El proyecto partió en cascada (kick-off del 21/08). El 09/09 cambiamos a metodología ágil y ese primer periodo quedó como Sprint 0.

## Sprint 0 — Kick-off (terminado)

**Fechas:** 24/08 al 06/09 · **Objetivo:** dejar definidas las bases del proyecto y su alcance.

| Tarea | Responsable | Estado |
| --- | --- | --- |
| KAN-31 Acta de kick-off | Carlos Román | Terminada |
| KAN-32 Definición de alcances | Carlos Román | Terminada |
| KAN-33 Comienzo del ERS | Carlos Román | Terminada |

## Sprint 1 — Requisitos y diseño (terminado)

**Fechas:** 07/09 al 20/09 · **Objetivo:** definir los requisitos, el modelo de la base de datos y los contratos de la API.

| Tarea | Responsable | Estado |
| --- | --- | --- |
| KAN-9 Levantamiento de requerimientos (ERS) | Carlos Román | Terminada |
| KAN-7 Diseño de la base de datos (4 subtareas) | Crisler Romero | Terminada |
| KAN-8 Contratos de la API | Felipe Vidal | Terminada |

Quedaron para el Sprint 2 los anexos pendientes del ERS.

## Sprint 2 — Backend, base de datos y diseño (terminado el 04/10)

**Fechas:** 21/09 al 04/10 · **Objetivo:** crear la base de datos en Oracle, programar la API con su seguridad y diseñar las pantallas.

| Tarea | Responsable | Cómo quedó |
| --- | --- | --- |
| KAN-34 Diseño de pantallas (web y móvil) | Carlos Román | Terminado: mockups en el ERS (anexo 5.5) |
| KAN-12 CRUD en Java | Felipe Vidal | Terminado y probado |
| KAN-13 Seguridad JWT | Felipe Vidal | Terminado y probado; queda un problema abierto (DEF-03) |
| KAN-14 Estructuración de la base de datos | Crisler Romero | Terminado, con vistas para Power BI y restricciones CHECK |
| KAN-71 HU-04 Trazabilidad e inmutabilidad | Crisler Romero | Probada por la API |
| KAN-73 Documento de arquitectura (DAS) y KAN-75 Diagramas UML | Crisler Romero | Terminados: `../arquitectura/` |
| KAN-74 Actualización del ERS | Carlos Román | Terminada: `../arquitectura/` |
| KAN-76 Pruebas de los Sprints 1 y 2 | Felipe Vidal | Terminadas: `../qa/` |

- **Pruebas:** pasan 91 de 92 casos de la API (ver `../sprint-2/README.md`).
- **Jira:** las 4 tareas principales y sus 21 subtareas están finalizadas.
- **Pasa al Sprint 3:** los problemas DEF-03 a DEF-08, las pruebas de las pantallas y exportar los mockups sin perfil ni NFC.

## Sprint 3 — Frontend e integración (en curso desde el 05/10)

**Fechas:** 05/10 al 18/10 · **Objetivo:** construir la app y el panel web y dejarlos funcionando con el backend, la base de datos y el simulador IoT.

| Tarea | Responsable | Estado |
| --- | --- | --- |
| KAN-19 Desarrollo de las pantallas (web y móvil) | Carlos Román | En curso |
| KAN-18 Integración de front, back y base de datos | Felipe Vidal | Por hacer |
| KAN-37 Historial de autogestión (app) | Carlos Román | Por hacer |
| KAN-35 Registro y consulta de bahías disponibles (app) | Carlos Román | Por hacer |
| KAN-36 Escaneo e iniciación de sesión de uso (app) | Carlos Román | Por hacer |
| KAN-38 Gestión y monitoreo de racks (web) | Carlos Román | Por hacer |
| KAN-39 Administración de usuarios y permisos (web) | Carlos Román | Por hacer |
| KAN-68 Autenticación con directorio institucional | Felipe Vidal | En curso |
| KAN-69 Asignación inteligente por vehículo | Felipe Vidal | En curso |
| KAN-70 Comunicación con infraestructura física (IoT) | Felipe Vidal | En curso |

El backend y el simulador IoT ya están listos y el diseño está en Figma. En este sprint se hace el frontend y se conecta con el backend. Las pruebas (26 casos) están en `../sprint-3/pruebas.md`.

## Sprint 4 — Power BI, pruebas finales y cierre (planificado)

**Fechas:** 19/10 al 01/11 · **Objetivo:** mostrar los datos en Power BI, probar el sistema completo y empaquetar el prototipo.

| Tarea | Responsable | Estado |
| --- | --- | --- |
| KAN-27 Datos hacia Power BI | Crisler Romero | Por hacer |
| KAN-28 Pruebas de integración | Felipe Vidal | Por hacer |
| KAN-29 Empaquetado del prototipo | Carlos Román | Por hacer |
| KAN-40 Dashboards dentro del panel web | Crisler Romero | Por hacer |
| KAN-72 Pipeline de datos para reportes | Crisler Romero | Por hacer |
