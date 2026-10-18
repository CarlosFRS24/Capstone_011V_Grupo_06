# Sprint 3 — Pruebas

## Pruebas de pantallas

Las 26 pruebas están en `Casos_Prueba_S3.xlsx` (paso a paso, datos, resultado esperado y obtenido) y las capturas de cada una en `Evidencias_QA_S3.docx`. Las hizo Carlos el 14/10 con el backend real, en el celular Android y en el navegador.

| Módulo | Casos | OK |
| --- | --- | --- |
| RF-01 Autenticación | 3 | 3 |
| RF-02 Asignación | 6 | 6 |
| RF-03 Comunicación IoT | 1 | 1 |
| RF-06 Consulta de bahías | 1 | 1 |
| RF-07 Escaneo e inicio de sesión | 5 | 5 |
| RF-08 Historial | 1 | 1 |
| RF-09 Gestión de racks | 4 | 4 |
| RF-10 Usuarios y permisos | 3 | 3 |
| RF-11 Dashboards | 1 | 1 |
| Regresión de la API | 1 | 1 |
| **Total** | **26** | **26** |

Algunas notas:

- S3-UI-14: el panel de racks mostró la reserva entre 2,5 y 3,6 segundos medido a mano (con tiempo de reacción). El panel se refresca cada 3 segundos.
- S3-DEF-04: se probó con una bahía con ticket abierto. El caso con reserva pendiente no se probó desde la app.
- S3-VEN-01: se probó con la ventana actual de 15 minutos, porque no hemos decidido la nueva.

## Pruebas automáticas de la API

Usamos el script `../../backend/pruebas/regresion_api.py`.

| Fecha | Casos | Pasan | Fallan | No se corren | Reporte |
| --- | --- | --- | --- | --- | --- |
| 05/10 | 97 | 94 | 1 (DEF-03) | 2 | `../qa/regresion_api_2026-10-05_1735.md` |
| 11/10 | 99 | 97 | 0 | 2 | `../qa/regresion_api_2026-10-11_2309.md` |
| 14/10 | 97 | 95 | 0 | 2 | `../qa/regresion_api_2026-10-14_1658.md` |

La corrida del 14/10 la hizo Carlos con la versión del script que tenía en su equipo, que todavía no traía los 2 casos de DEF-04 (por eso son 97). Esos casos se probaron desde la app (S3-DEF-04).

Los 2 que no se corren son S2-RES-13 (hay que esperar que venza la reserva) y S4-ANA-01 (Power BI embebido, del Sprint 4).

## Simulador IoT

Los 7 casos del simulador pasan desde el 05/10. El 14/10 probamos además el check-in con el simulador apagado (S3-IOT-08): la app muestra un error y no cambia nada en la base.
