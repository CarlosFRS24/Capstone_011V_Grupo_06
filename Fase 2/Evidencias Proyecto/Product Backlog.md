# Product Backlog

El backlog lo llevamos en Jira. Aquí está el resumen al 17/10/2026, sacado de la exportación de ese día (`../gestion/jira/nodalix_2026-10-17_06.41pm.csv`). En Jira "Kris" es Crisler Romero y "f.vidalv" es Felipe Vidal.

## Historias de usuario

Son 11. Los criterios de aceptación están en el ERS (anexo 5.4). No usamos puntos de historia; planificamos por horas por sprint (ERS, sección 4.1.5).

| Historia | Jira | Sprint | Estado |
| --- | --- | --- | --- |
| HU-01 Autenticación con directorio institucional | KAN-68 | 2 y 3 | Terminada |
| HU-02 Asignación inteligente por vehículo | KAN-69 | 2 y 3 | Terminada |
| HU-03 Comunicación con infraestructura física (IoT) | KAN-70 | 3 | Terminada |
| HU-04 Trazabilidad e inmutabilidad | KAN-71 | 2 | Terminada |
| HU-05 Pipeline de datos para reportes | KAN-72 | 4 | Por hacer (vistas y conexión a Power BI listas) |
| HU-06 Consulta de bahías disponibles | KAN-35 | 3 | Terminada |
| HU-07 Escaneo QR e inicio de sesión de uso | KAN-36 | 3 | Terminada |
| HU-08 Historial de uso | KAN-37 | 3 | Terminada |
| HU-09 Gestión y monitoreo de racks | KAN-38 | 3 | Terminada |
| HU-10 Usuarios y permisos | KAN-39 | 3 | Terminada |
| HU-11 Dashboards de Power BI en el panel | KAN-40 | 4 | Por hacer |

## Épicas

| Épica | Qué incluye | Estado |
| --- | --- | --- |
| KAN-30 Kick-Off | Acta, alcance y comienzo del ERS | Terminada |
| KAN-4 Documentación y diseños iniciales | ERS, base de datos, contratos API, diseño en Figma, DAS, UML y pruebas de los Sprints 1 y 2 | Terminada |
| KAN-5 Core Backend y Seguridad | CRUD en Java, JWT, base de datos y HU-01, HU-02 y HU-04 | Terminada |
| KAN-6 Integración IoT & UI | Pantallas, integración y HU-03 | Terminada |
| KAN-41 Aplicación Móvil | HU-06, HU-07 y HU-08 | Terminada |
| KAN-42 Plataforma Web | HU-09 y HU-10 terminadas; falta HU-11 | En curso |
| KAN-26 Analítica y Cierre | Tareas de datos del Sprint 3 (terminadas) y las del Sprint 4 | En curso |

## Avance

De las 35 tareas e historias del proyecto hay 30 terminadas. Quedan las 5 del Sprint 4: KAN-27, KAN-28, KAN-29, KAN-40 y KAN-72.

## Pendientes que no están en Jira

| Qué | Estado |
| --- | --- |
| Ampliar la ventana de reserva (hoy 15 minutos) | Falta decidir los minutos |
| `.gitignore` en la raíz (la carpeta `wallet/` no se sube) | Pendiente |
| Contraseñas de prueba en texto plano en `02_insert.sql` (DEF-07) | Pendiente |
| Mockups del ERS sin perfil ni NFC (anexo 5.5) | Pendiente |
