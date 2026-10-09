# Sprint 1 — Requisitos y diseño

**Fechas:** 07/09 al 20/09/2026 · **Estado:** cerrado

## Objetivo

Dejar claro qué íbamos a construir: los requisitos (ERS), el modelo de la base de datos y cómo se iba a comunicar la API, para poder programar en el Sprint 2.

El 09/09 cambiamos de cascada a ágil y pasamos el tablero de Planner a Jira.

## Qué hizo cada uno

| Integrante | Tarea en Jira | Qué entregó | Dónde está |
| --- | --- | --- | --- |
| Carlos Román | KAN-9 Levantamiento de requerimientos | ERS v1.1, con 11 requisitos funcionales y 11 historias de usuario | `../arquitectura/` (historias en el anexo 5.4) |
| Crisler Romero | KAN-7 Diseño de la base de datos | Modelo de 11 tablas y su diagrama entidad-relación | `../../database/01_ddl.sql` y `../arquitectura/uml/5_mer.png` |
| Felipe Vidal | KAN-8 Contratos de la API | Definición de los endpoints (API v1) | ERS, anexo 5.8 |

Las 3 tareas, y las 4 subtareas de la base de datos, se terminaron dentro del sprint.

## Revisión de lo entregado

En este sprint no hubo código, así que revisamos los documentos y el modelo. La revisión la hicimos el 02/10 y el 03/10.

- **Bien:** cada requisito tiene su historia de usuario, el alcance está definido y las 11 tablas tienen sus claves (11 primarias y 15 foráneas).
- **Por corregir:** los criterios de aceptación de la HU-02, y los estados no estaban restringidos en la base de datos (faltaban los CHECK).
- **Pendiente:** nueve anexos del ERS seguían con el texto de la plantilla, y en Jira faltaba cargar las historias HU-01 a HU-05.

El detalle está en `../qa/QA_evidencia_sprint1-2_2026-10-02.md`.

## Comentarios del docente

- Cambiar de cascada a ágil, porque con cascada no alcanzábamos a terminar en el plazo. Lo hicimos el 09/09.
- Dejar ordenados los entregables de cada sprint. Por eso existe una carpeta por sprint.

## Retrospectiva

**Qué funcionó:** la base de datos quedó en una primera versión con lo acordado, se definieron los endpoints de la API y salió la primera versión del ERS.

**Qué nos faltó:** dejamos los anexos del ERS para después, no cargamos todas las historias en Jira y no registramos las horas trabajadas.

**Qué pasó al Sprint 2:**

- Completar los anexos del ERS, corregir la HU-02 y cargar las historias que faltaban en Jira (Carlos).
- Agregar los CHECK de los estados en la base de datos (Crisler).
- El diseño de las pantallas (KAN-34) y el diagrama de casos de uso.
