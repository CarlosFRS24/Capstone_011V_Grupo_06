# Sprint 3 — App, panel web e integración

**Fechas:** 05/10 al 18/10/2026 · **Estado:** terminado

## Objetivo

Hacer la app y el panel web siguiendo el diseño de Figma y dejarlos funcionando con el backend, la base de datos y el simulador IoT.

## Qué hizo cada uno

| Integrante | Qué hizo | Jira |
| --- | --- | --- |
| Carlos Román | Programó la app y el panel web (login, bahías, reserva, QR, sesión, historial, vehículos, racks, tickets, usuarios y analítica). Probó las 26 pruebas del sprint el 14/10 | KAN-19 (subtareas KAN-82 a KAN-88), KAN-35 a KAN-39 |
| Felipe Vidal | Integró la app y el panel con el backend y la base de datos. Cerró las historias de login, asignación por vehículo e IoT | KAN-18, KAN-68 a KAN-70 |
| Crisler Romero | Cargó datos históricos de ejemplo, probó las consultas para Power BI y las restricciones de la base, limpió los datos de prueba y conectó Power BI a Oracle Cloud. Corrigió DEF-03 y DEF-04 en el backend | KAN-77 a KAN-81 |

Las 15 tareas e historias del sprint y las 7 subtareas quedaron en Finalizado (exportación de Jira del 17/10: `../gestion/jira/nodalix_2026-10-17_06.41pm.csv`).

## Burndown

Contamos 21 ítems: las 7 subtareas de las pantallas y las 14 tareas e historias que no tienen subtareas. La primera semana bajó parejo, mientras se programaban las pantallas, y el 14/10 cayó de 8 a 1, porque ese día probamos todo contra el backend y cerramos las historias. El último ítem fue la conexión de Power BI (16/10). Gráfico: `../gestion/burndown_sprint-3.png`.

## Qué entregamos

| Entregable | Dónde está |
| --- | --- |
| App móvil y panel web | `../../frontend/` (el código final lo sube Carlos al repositorio) |
| Pruebas del sprint (26 casos) | `Casos_Prueba_S3.xlsx` |
| Capturas de cada prueba | `Evidencias_QA_S3.docx` |
| Pruebas automáticas de la API | `../qa/regresion_api_2026-10-11_2309.md` y `../qa/regresion_api_2026-10-14_1658.md` |
| Power BI conectado a la base | `evidencia_power_bi.png` y `evidencia_paneles_power_bi.png` |
| Restricciones CHECK y consultas para Power BI | `../qa/SALIDA_CHECK.txt` y `../qa/Evidencia_consultas_bi.txt` |
| QR de los racks para probar | `qr_racks.pdf` |
| Burndown del sprint | `../gestion/burndown_sprint-3.png` |

## Pruebas

Resumen en `pruebas.md`.

- **Pantallas:** 26 casos, todos OK, probados el 14/10 en el celular Android y en el navegador.
- **API:** el 11/10 corrimos las pruebas automáticas: de 99 casos pasan 97, no falla ninguno y 2 quedan fuera (uno hay que esperar 15 minutos y el otro es de Power BI, del Sprint 4). El 14/10 Carlos las repitió con el backend integrado: 95 de 97 OK, sin fallas.
- **Defectos:** DEF-03 (usuario bloqueado seguía entrando con su token) y DEF-04 (se podía dejar disponible una bahía con reserva o ticket) quedaron corregidos el 11/10 y probados desde la app el 14/10.

## Lo que quedó pendiente

- Ampliar la ventana de reserva: sigue en 15 minutos porque no decidimos el nuevo valor.
- Actualizar los mockups del ERS (anexo 5.5) con las pantallas sin perfil ni NFC.

## Cierre del sprint

- **Qué se terminó:** todo lo planificado en Jira. La app y el panel funcionan con el backend real.
- **Qué no:** la ventana de reserva nueva.
- **Comentarios del docente:** no hubo comentarios en este sprint.
- **Qué funcionó:** el backend y el frontend. Aprovechamos lo que sabíamos y archivos de proyectos anteriores para avanzar más rápido.
- **Qué hay que mejorar:** seguimos sin mover las tareas en Jira cuando corresponde; somos desordenados con eso.
- **Pasa al Sprint 4:** Power BI completo y embebido, pruebas de integración, empaquetado y los pendientes de arriba.
