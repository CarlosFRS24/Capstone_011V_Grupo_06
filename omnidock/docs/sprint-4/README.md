# Sprint 4 — Cambios después de la presentación, analítica y cierre

**Fechas:** 19/10 al 01/11/2026 · **Estado:** terminado

## Objetivo

Cerrar lo pendiente (Power BI, pruebas de integración y empaquetado) y sumar los cambios que salieron de la presentación del 23/10.

## Qué hizo cada uno

| Integrante | Qué hizo | Jira |
| --- | --- | --- |
| Carlos Román | Pantallas de la app para la lista de espera, las faltas y los avisos; panel web con faltas y lista de espera; QR de las 50 bahías; ERS v1.4; empaquetado del prototipo (jar, build web y APK). Cargó el Sprint 4 en Jira y ejecutó los casos de pantalla | KAN-90 a KAN-92, KAN-98 a KAN-100, KAN-103, KAN-29 |
| Felipe Vidal | En el backend: ventana de 60 minutos y horario de la sede, faltas y desbloqueo, lista de espera y avisos. Corrección de las reservas sobre bahías que pasan a mantención (CC-23) | KAN-93, KAN-96, KAN-97, KAN-105, KAN-28 |
| Crisler Romero | Tablas nuevas, 50 bahías e historial de ejemplo regenerado; gráficos de la pantalla Analítica (CC-24); panel de Power BI; diagramas UML y DAS v1.2. Corrió la regresión y la prueba de carga, y corrigió DEF-10 y DEF-11 | KAN-94, KAN-95, KAN-101, KAN-102, KAN-104, KAN-27, KAN-72, KAN-40 |

Exportación de Jira del 01/11: `../gestion/jira/nodalix_2026-11-01_09.36pm.csv`.

## Burndown

El sprint partió con 5 tareas que venían del Sprint 3. Con los cambios de la presentación se sumaron 3 historias y 13 tareas, y el alcance subió a 21. Al cierre (01/11) se terminaron las 21, y el proyecto termina con sus 51 tareas e historias finalizadas. Gráfico: `../gestion/burndown_sprint-4.png`.

## Cambios pedidos el 23/10 y qué decidimos

| Cambio | Decisión | Por qué |
| --- | --- | --- |
| Ventana de reserva | **1 hora** para llegar (antes 15 min) | 15 min no alcanzaba para llegar desde la casa; con 2 h la bahía quedaba mucho rato tomada sin uso |
| Reservar con días de anticipación | **No se hace**: se reserva cuando uno va | El uso no tiene hora de término, así que no se puede asegurar una bahía para más tarde sin dejarla vacía |
| Horario | Se reserva de lunes a viernes de 07:00 a 21:30 y el sábado de 07:00 a 15:00 | Las clases son de 08:00 a 22:30 (sábado hasta 16:00); se reserva hasta 1 hora antes del cierre |
| Castigo por no llegar | Cada reserva vencida deja una **falta**; con **3** no se puede reservar hasta que el admin las anula | Se bloquea solo el reservar: el usuario puede entrar a la app y sacar su vehículo |
| Lista de espera | Si no hay bahías libres para tu vehículo, te unes a la lista. Al liberarse una se le guarda **15 min** al primero y se le avisa en la app | Si no confirma pasa al siguiente sin falta, porque nunca reservó |
| Más bahías | **50 bahías**: 40 de bicicleta y 10 de scooter, en Acceso Norte y Patio Central | Con 4 no se veía como una sede real |
| Power BI en el panel (28/10) | La pantalla Analítica muestra **gráficos propios** calculados con las vistas BI; el informe embebido queda opcional | El instituto no permite publicar ni embeber el informe y un token manual dura 1 hora |

## Qué entregamos

| Entregable | Dónde está |
| --- | --- |
| Base de datos: tablas `FALTA_RESERVA`, `LISTA_ESPERA` y `NOTIFICACION`, 50 bahías, historial nuevo y vistas de faltas y lista de espera | `../../database/` |
| Backend: horario, faltas, lista de espera, avisos y datos de Analítica | `../../backend/` |
| App y panel web con las pantallas nuevas | `../../frontend/` |
| QR de las 50 bahías | `../../frontend/qr-prueba/QR_racks_OmniDock.pdf` |
| ERS v1.4, DAS v1.2 y diagramas UML | `../arquitectura/` |
| Casos de prueba del sprint (22) | `Casos_Prueba_S4.xlsx` |
| Capturas de cada prueba | `Evidencias_QA_S4.docx` |
| Pantalla Analítica funcionando | `Analitica Omnidock.png` |
| Panel de Power BI (3 páginas con los colores de la web) | `Omnidock.pbix`, capturas `power_bi_1_resumen.png`, `power_bi_2_faltas_lista_espera.png` y `power_bi_3_bahias_mantencion.png` |
| Regresión y prueba de carga | `../qa/regresion_api_2026-10-30_1249.md`, `../qa/prueba_carga_2026-10-30_1247.md` y `../qa/prueba_carga_2026-10-30_1235.md` |
| Burndown del sprint y del proyecto | `../gestion/burndown_sprint-4.png` y `../gestion/burndown_proyecto_2026-11-01.png` |

## Pruebas

- **API:** el 30/10 corrimos la regresión automática con los casos del sprint: 115 de 115 OK, incluida la expiración de reservas y faltas.
- **Carga:** con 10 usuarios a la vez el check-in tarda 63 ms (p95) y no hay bloqueos. Con 50 a la vez, el simulador IoT no alcanza a responder en 2 segundos (ver DEF-09).
- **Pantallas:** los 22 casos del sprint quedaron OK (`Casos_Prueba_S4.xlsx` y `Evidencias_QA_S4.docx`). Los ejecutaron Carlos y Felipe el 31/10 y Crisler el 30/10. S4-UI-07 y S4-UI-16 fallaron el 31/10 (DEF-10 y DEF-11); se corrigieron y pasaron el 01/11.
- **Power BI:** S4-BI-01 OK el 30/10. Las 10 vistas cargan, incluidas las de faltas y lista de espera, y el panel se filtra por período, sector y tipo de bahía. Sus totales cuadran con la pantalla Analítica.
- **Defectos:** DEF-07 (contraseñas de prueba en texto plano) y DEF-09 (check-in con 50 usuarios a la vez) quedan aceptados para el prototipo. DEF-09 pasa solo porque el simulador corre dentro del mismo backend; con el rack real, separado, no compite por las conexiones a la base. DEF-10 (posición en la lista de espera) y DEF-11 (alerta de una segunda oferta) se corrigieron el 01/11. Detalle en `../qa/evidencias_api.md`.

## Cómo probar

1. Recargar la base: `00` → `01` → `02` → `03` → `04` → `06` (→ `05` para revisar).
2. Fuera de horario, levantar el backend con `HORARIO_ACTIVO=false`.
3. Faltas: entrar con `fnavarro@duocuc.cl` / `user123` (tiene 3 faltas y no puede reservar) y desbloquearla desde el panel (Usuarios → acciones).
4. Lista de espera: en el panel (Racks) marcar fuera de servicio las bahías de scooter libres, entrar a la app con `bherrera@duocuc.cl` / `user123`, unirse a la lista y, desde el panel, volver a marcar disponible RACK-SCOOT-03.
5. Ver una falta sin esperar 1 hora: levantar el backend con `RESERVA_MINUTOS=2`.

## Cierre del sprint

Se cerró el 01/11, con las 21 tareas e historias terminadas.

- **Qué se terminó:** todo lo que venía pendiente del Sprint 3 (Power BI, pruebas de integración y empaquetado) y todo lo que se agregó después de la presentación del 23/10.
- **Qué no:** nada; el sprint quedó completo.
- **Comentarios del docente:** en la presentación del 23/10 aconsejó agregar la lista de espera, el castigo por no llegar a la reserva, ampliar la ventana de reserva y reservar con días de anticipación (esto último se descartó, ver la tabla de cambios).
- **Qué funcionó:** todo lo realizado. Los cambios se repartieron por rol (base de datos, backend y app) y avanzaron en paralelo, y la regresión automática permitió revisar en minutos que lo nuevo no rompiera lo anterior.
- **Qué hay que mejorar:**
  - Probar las pantallas antes. Los casos de la app se ejecutaron el 31/10 y dos fallaron (DEF-10 y DEF-11) a un día del cierre; conviene probar cada pantalla apenas se termina.
  - Subir el código a GitHub más seguido, con ramas y pull requests. Esta vez el código se compartió a mano y al final hubo que ordenar el repositorio antes de poder hacer `git pull`.
