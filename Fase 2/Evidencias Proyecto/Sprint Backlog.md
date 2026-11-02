# Sprint Backlog

Sprints de dos semanas. Resumen de las tareas de cada sprint según la exportación final de Jira (01/11/2026). El detalle de cada uno está en `omnidock/docs/sprint-N/README.md`.

Partimos en cascada (kick-off del 21/08) y el 09/09 cambiamos a ágil. Ese primer periodo quedó como Sprint 0.

## Sprint 0 — Kick-off (24/08 al 06/09) · terminado

| Tarea | Responsable | Estado |
| --- | --- | --- |
| KAN-31 Acta de kick-off | Carlos Román | Terminada |
| KAN-32 Definición de alcances | Carlos Román | Terminada |
| KAN-33 Comienzo del ERS | Carlos Román | Terminada |

## Sprint 1 — Requisitos y diseño (07/09 al 20/09) · terminado

| Tarea | Responsable | Estado |
| --- | --- | --- |
| KAN-9 Requerimientos (ERS) | Carlos Román | Terminada |
| KAN-7 Diseño de la base de datos (4 subtareas) | Crisler Romero | Terminada |
| KAN-8 Contratos de la API | Felipe Vidal | Terminada |

## Sprint 2 — Backend, base de datos y diseño (21/09 al 04/10) · terminado

| Tarea | Responsable | Estado |
| --- | --- | --- |
| KAN-34 Diseño de pantallas en Figma (8 subtareas) | Carlos Román | Terminada |
| KAN-74 Actualización del ERS | Carlos Román | Terminada |
| KAN-12 CRUD en Java (4 subtareas) | Felipe Vidal | Terminada |
| KAN-13 Seguridad JWT (4 subtareas) | Felipe Vidal | Terminada |
| KAN-76 Pruebas de los Sprints 1 y 2 | Felipe Vidal | Terminada |
| KAN-14 Base de datos (5 subtareas) | Crisler Romero | Terminada |
| KAN-71 HU-04 Trazabilidad e inmutabilidad | Crisler Romero | Terminada |
| KAN-73 DAS | Crisler Romero | Terminada |
| KAN-75 Diagramas UML | Crisler Romero | Terminada |

Pruebas: pasan 91 de 92 casos de la API (ver `../../omnidock/docs/sprint-2/README.md`).

## Sprint 3 — App, panel web e integración (05/10 al 18/10) · terminado

| Tarea | Responsable | Estado |
| --- | --- | --- |
| KAN-19 Desarrollo de las pantallas (7 subtareas) | Carlos Román | Terminada |
| KAN-35 a KAN-39 Historias de la app y del panel (HU-06 a HU-10) | Carlos Román | Terminadas |
| KAN-18 Integración front, back y base de datos | Felipe Vidal | Terminada |
| KAN-68 a KAN-70 HU-01, HU-02 y HU-03 | Felipe Vidal | Terminadas |
| KAN-77 Datos históricos de ejemplo | Crisler Romero | Terminada |
| KAN-78 Consultas para Power BI | Crisler Romero | Terminada |
| KAN-79 Prueba de las restricciones de la base | Crisler Romero | Terminada |
| KAN-80 Limpieza de datos de prueba | Crisler Romero | Terminada |
| KAN-81 Conexión de Power BI a Oracle | Crisler Romero | Terminada |

Pruebas: 26 de 26 OK (ver `../../omnidock/docs/sprint-3/pruebas.md`).

## Sprint 4 — Cambios de la presentación, Power BI y cierre (19/10 al 01/11) · terminado

| Tarea | Responsable | Estado |
| --- | --- | --- |
| KAN-27 Datos hacia Power BI | Crisler Romero | Terminada: panel en Power BI Desktop (`docs/sprint-4/Omnidock.pbix`) |
| KAN-72 HU-05 Pipeline de datos | Crisler Romero | Terminada |
| KAN-40 HU-11 Dashboards en el panel web | Crisler Romero | Cerrada: se reemplazó por gráficos propios (CC-24) |
| KAN-28 Pruebas de integración | Felipe Vidal | Terminada: regresión 115 de 115 y prueba de carga |
| KAN-29 Empaquetado del prototipo | Carlos Román | Terminada: jar, build web y APK |

Agregado después de la presentación del 23/10 (en Jira desde el 30/10, dentro de la épica KAN-26):

| Tarea | Responsable | Estado |
| --- | --- | --- |
| KAN-90 HU-12 Lista de espera | Carlos Román | Terminada |
| KAN-91 HU-13 Control de inasistencias | Carlos Román | Terminada |
| KAN-92 HU-14 Avisos en la app | Carlos Román | Terminada |
| KAN-93 Ventana de reserva de 60 minutos y horario de la sede | Felipe Vidal | Terminada |
| KAN-94 Tablas nuevas y 50 bahías | Crisler Romero | Terminada |
| KAN-95 Regenerar datos históricos | Crisler Romero | Terminada |
| KAN-96 Backend de faltas y desbloqueo | Felipe Vidal | Terminada |
| KAN-97 Backend de lista de espera y avisos | Felipe Vidal | Terminada |
| KAN-98 Pantallas de la app (lista de espera, faltas y avisos) | Carlos Román | Terminada |
| KAN-99 Panel web (faltas y lista de espera) | Carlos Román | Terminada |
| KAN-100 QR de las 50 bahías | Carlos Román | Terminada |
| KAN-101 Gráficos de analítica en el panel | Crisler Romero | Terminada |
| KAN-102 Actualizar diagramas UML | Crisler Romero | Terminada |
| KAN-103 Actualizar ERS v1.4 | Carlos Román | Terminada |
| KAN-104 Actualizar DAS v1.2 | Crisler Romero | Terminada |
| KAN-105 Pruebas del Sprint 4 (22 casos en `Casos_Prueba_S4.xlsx` y regresión) | Felipe Vidal | Terminada: 22 de 22 OK |

Pruebas: regresión de la API 115 de 115 OK y los 22 casos del sprint OK (ver `../../omnidock/docs/sprint-4/README.md`).
