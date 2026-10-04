# Product Backlog

El backlog lo llevamos en Jira. Este archivo es un resumen de las historias de usuario y de las tareas del proyecto, al 05/10/2026. La exportación de Jira de ese día está en `../gestion/jira/`.

## Historias de usuario

Son 11 y están en el ERS (anexo 5.4) con sus criterios de aceptación. Las ordenamos según el sprint en que se trabajan. No usamos puntos de historia: planificamos por horas por sprint (ERS, sección 4.1.6).

| N.º | Historia | Jira | Sprint | Cómo va |
| --- | --- | --- | --- | --- |
| 1 | **HU-01** Autenticación con directorio institucional | KAN-68 | 2 y 3 | API probada; falta la pantalla (Sprint 3) |
| 2 | **HU-04** Trazabilidad transaccional e inmutabilidad | KAN-71 | 2 | Probada |
| 3 | **HU-02** Asignación inteligente por vehículo | KAN-69 | 2 y 3 | API probada; falta la pantalla (Sprint 3) |
| 4 | **HU-06** Registro y consulta de bahías disponibles | KAN-35 | 3 | API probada; falta la pantalla (Sprint 3) |
| 5 | **HU-07** Escaneo e iniciación de sesión de uso | KAN-36 | 3 | API probada; falta la pantalla (Sprint 3) |
| 6 | **HU-08** Historial de autogestión | KAN-37 | 3 | API probada; falta la pantalla (Sprint 3) |
| 7 | **HU-03** Comunicación con infraestructura física (IoT) | KAN-70 | 3 | Simulador probado: los 7 casos pasan (pruebas automáticas del 05/10). Falta probar con el simulador caído |
| 8 | **HU-09** Gestión y monitoreo de racks | KAN-38 | 3 | API probada; falta el panel (Sprint 3) |
| 9 | **HU-10** Administración de usuarios y permisos | KAN-39 | 3 | API probada, con un problema abierto (DEF-03); falta el panel (Sprint 3) |
| 10 | **HU-05** Pipeline de datos para reportería | KAN-72 | 4 | Vistas para Power BI creadas; falta conectar Power BI |
| 11 | **HU-11** Embebimiento y exposición de dashboards | KAN-40 | 4 | Por hacer |

Las historias HU-01 a HU-05 se cargaron en Jira recién el 04/10 (KAN-68 a KAN-72). KAN-68 a KAN-70 las tiene Felipe Vidal; KAN-71 y KAN-72, Crisler Romero.

## Épicas y tareas en Jira

| Épica | Tareas | Estado |
| --- | --- | --- |
| KAN-30 Kick-Off | KAN-31 Acta de kick-off, KAN-32 Definición de alcances, KAN-33 Comienzo del ERS | Terminada |
| KAN-4 Documentación y diseños iniciales | KAN-9 Levantamiento de requerimientos (ERS), KAN-7 Diseño de la base de datos, KAN-8 Contratos de la API, KAN-34 Diseño de pantallas, KAN-73 Documento de arquitectura (DAS), KAN-74 Actualización del ERS, KAN-75 Diagramas UML, KAN-76 Pruebas de los Sprints 1 y 2 | Terminada |
| KAN-5 Core Backend y Seguridad | KAN-12 CRUD en Java, KAN-13 Seguridad JWT, KAN-14 Estructuración de la base de datos | Terminada |
| KAN-41 Aplicación Móvil | KAN-35, KAN-36 y KAN-37 (historias de la app) | En curso |
| KAN-42 Plataforma Web | KAN-38 y KAN-39 (historias del panel) y KAN-40 (dashboards, Sprint 4) | En curso |
| KAN-6 Integración IoT & UI | KAN-19 Desarrollo de las pantallas (en curso) y KAN-18 Integración de front, back y base de datos (por hacer) | En curso |
| KAN-26 Analítica y Cierre | KAN-27 Datos hacia Power BI, KAN-28 Pruebas de integración, KAN-29 Empaquetado del prototipo | Por hacer |

El frontend se desarrolla en el Sprint 3, siguiendo el diseño de Figma.

## Problemas y cambios pendientes

Para repartir en el Sprint 3.

| Código | Qué es |
| --- | --- |
| DEF-03 | El token de un usuario bloqueado sigue funcionando |
| DEF-04 | Una bahía con una reserva o un ticket puede quedar disponible |
| DEF-05 | Falta el `.gitignore` en la raíz (la carpeta `wallet/` no debe subirse) |
| DEF-06 | En el borrador del frontend la ventana de reserva quedó como parámetro (`reservaMinutos`); la app final debe leerla del backend |
| DEF-07 | Contraseñas de prueba en texto plano |
| DEF-08 | Pruebas automáticas del backend: ya está el script de la API y se corrió el 05/10 (pasan 94 de 97 casos). Hay que repetirlo después de cada cambio |
| Cambio | Ampliar la ventana de reserva (hoy 15 minutos) |
| Diseño | Exportar de Figma los mockups sin perfil ni NFC y actualizarlos en el ERS (anexo 5.5) |
