# 🏃‍♂️ Sprint Backlogs (Historial de Iteraciones)

> **Nota Metodológica:** Nuestro equipo trabaja en iteraciones (Sprints) de dos semanas. A continuación, se detalla el trabajo planificado, en curso y finalizado según nuestro tablero en Jira (exportación del 02/10/2026). El detalle de cada sprint (planificación, entregables, QA, review y retrospectiva) está en `../sprint-N/`.

> **Sobre la metodología:** El proyecto partió en cascada (acta de kick-off del 21/08/2026). El 09/09/2026 el equipo cambió a metodología ágil (ERS v1.1) y reorganizó el trabajo en sprints dentro de Jira; el periodo de kick-off quedó registrado como Sprint 0.

## Sprint 0: Kick-off y Setup (Finalizado)
**Fechas:** 24 Ago - 6 Sep
**Objetivo:** Establecer las bases del proyecto y definir su alcance.

| Clave | Tarea | Responsable | Estado |
| :--- | :--- | :--- | :--- |
| KAN-31 | Acta de Kick-off | Carlos Román | Finalizado |
| KAN-32 | Definición de Alcances | Carlos Román | Finalizado |
| KAN-33 | Comienzo de ERS (Especificación de Requisitos) | Carlos Román | Finalizado |

**Resultado:** 3 de 3 tareas terminadas.

## Sprint 1: Fundamentos y Arquitectura (Finalizado)
**Fechas:** 7 Sep - 20 Sep
**Objetivo:** Traducir los requerimientos de negocio en un modelo de datos relacional y definir los contratos de comunicación (API).

| Clave | Tarea | Responsable | Estado |
| :--- | :--- | :--- | :--- |
| KAN-9 | Levantamiento de Requerimientos (ERS) | Carlos Román | Finalizado |
| KAN-7 | Diseño de BD Oracle (4 subtareas) | Crisler Romero | Finalizado |
| KAN-8 | Definición de contratos API | Felipe Vidal | Finalizado |

**Resultado:** 3 de 3 tareas terminadas. Pasan al siguiente sprint los anexos pendientes del ERS.

## Sprint 2: Core Backend, Seguridad y UI (En cierre)
**Fechas:** 21 Sep - 4 Oct
**Objetivo:** Materializar el diseño en la base de datos Oracle, programar el núcleo de seguridad del backend y diseñar las interfaces visuales del sistema.

| Clave | Tarea | Responsable | Estado en Jira | Estado verificado al 03/10 |
| :--- | :--- | :--- | :--- | :--- |
| KAN-34 | Diseño UI (Web y Móvil) | Carlos Román | En curso | 4 de 8 subtareas finalizadas |
| KAN-12 | Programación de CRUD en Java | Felipe Vidal | En curso | Terminado y probado |
| KAN-13 | Implementación de seguridad JWT | Felipe Vidal | En curso | Terminado y probado; un defecto abierto (DEF-03) |
| KAN-14 | Estructuración BD | Crisler Romero | En curso | 4 de 5 subtareas finalizadas |

**Trabajo adicional del sprint (sin tarea en Jira):** DAS, ERS v1.2 y v1.3, diagramas UML y pruebas QA.

**Resultado de QA:** 91 de 92 casos de prueba de la API pasan (`../sprint-2/03_evidencias_qa.md`).

**Pasa al Sprint 3:** diseño web, prototipo y assets (KAN-64 a KAN-67), consultas analíticas (KAN-51) y los defectos DEF-03 a DEF-08.

## Sprint 3: Integración y Desarrollo Frontend (Planificado)
**Fechas:** 5 Oct - 18 Oct
**Objetivo:** Dejar funcionando de punta a punta las vistas de los ecosistemas web y móvil, conectadas con el backend, la base de datos y el simulador IoT.

| Clave | Tarea | Responsable | Estado |
| :--- | :--- | :--- | :--- |
| KAN-19 | Desarrollo UI (Web y Móvil) - Programación Frontend | Carlos Román | Por hacer |
| KAN-18 | Integración de Sistemas (Front + Back + BD) | Felipe Vidal | Por hacer |
| KAN-37 | HU - Historial de Autogestión (App Móvil) | Carlos Román | Por hacer |
| KAN-35 | HU - Registro y Consulta de Bahías Disponibles (App Móvil) | Carlos Román | Por hacer |
| KAN-36 | HU - Escaneo e Iniciación de Sesión de Uso (App Móvil) | Carlos Román | Por hacer |
| KAN-38 | HU - Gestión y Monitoreo de Racks (Web Admin) | Carlos Román | Por hacer |
| KAN-39 | HU - Administración de Usuarios y Permisos (Web Admin) | Carlos Román | Por hacer |

**Punto de partida:** las pantallas y el simulador IoT ya están construidos, por lo que el sprint se concentra en integrar, probar y corregir. El plan de pruebas (24 casos) está en `../sprint-3/03_evidencias_qa.md`.

## Sprint 4: Analítica, Pruebas y Despliegue (Planificado)
**Fechas:** 19 Oct - 1 Nov
**Objetivo:** Extraer la data transaccional hacia tableros directivos, asegurar la calidad del producto mediante pruebas de integración y empaquetar el MVP.

| Clave | Tarea | Responsable | Estado |
| :--- | :--- | :--- | :--- |
| KAN-27 | Despliegue Pipeline Data hacia PowerBI | Crisler Romero | Por hacer |
| KAN-28 | Pruebas de Integración | Felipe Vidal | Por hacer |
| KAN-29 | Empaquetado del prototipo | Carlos Román | Por hacer |
| KAN-40 | HU - Embebimiento y Exposición de Dashboards (Web Admin) | Crisler Romero | Por hacer |
