# Sprint 2 — Backend, base de datos y diseño

**Fechas:** 21/09 al 04/10/2026 · **Estado:** terminado

## Objetivo

Dejar lista la base de datos en Oracle, la API con su seguridad y el diseño de las pantallas en Figma.

## Qué hizo cada uno

| Integrante | Qué hizo | Dónde está |
| --- | --- | --- |
| Crisler Romero | Base de datos, datos de prueba, restricciones CHECK, vistas para Power BI, DAS y diagramas UML (KAN-14, KAN-71, KAN-73, KAN-75) | `../../database/` y `../arquitectura/` |
| Felipe Vidal | API REST con 30 endpoints, login con JWT, permisos por rol y simulador IoT (KAN-12, KAN-13, KAN-76) | `../../backend/` y `Documento de Evidencia Endpoints y Seguridad.pdf` |
| Carlos Román | Diseño de la app y del panel en Figma y actualización del ERS (KAN-34, KAN-74) | `figma.md` y ERS, anexo 5.5 |

Las tareas del sprint y sus 21 subtareas quedaron terminadas en Jira. Burndown: `../gestion/burndown_sprint-2.png`.

## Pruebas

El 02/10 probamos la API contra el backend real y la base en la nube: **92 casos, pasan 91**. El que falló fue DEF-03 (un usuario bloqueado podía seguir usando su token). El detalle está en `../qa/evidencias_api.md`, y las capturas de cada endpoint en el PDF de Felipe.

En la base quedaron activas las seis restricciones CHECK y las ocho vistas para Power BI (`check_consultas.png` y `consulta_bi_vistas.png`).

## Problemas que encontramos

- DEF-01 y DEF-02 (estado fuera de servicio y datos duplicados en la base): corregidos el 02/10.
- DEF-03 y DEF-04 (token de usuario bloqueado y estado de la bahía): pasaron al Sprint 3 y se corrigieron el 11/10.

## Comentarios del docente

El 02/10 nos dijo que encontraba poco el tiempo para hacer e integrar el frontend en el Sprint 3.

## Retrospectiva

- **Qué funcionó:** el equipo estuvo bien coordinado y alcanzamos a adelantar el simulador IoT.
- **Qué hay que mejorar:** dejamos las pruebas para los últimos días y Jira estuvo desactualizado casi todo el sprint.
- **Para el Sprint 3:** mover las tareas en Jira el mismo día, probar cada historia al terminarla y crear el `.gitignore` antes de subir el código.
