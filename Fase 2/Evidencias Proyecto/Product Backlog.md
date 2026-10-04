# 📋 Product Backlog

> **Nota Metodológica:** Nuestro equipo gestiona el Product Backlog de forma dinámica utilizando **Jira Software**. Este documento refleja las historias de usuario, las Épicas y las tareas del proyecto OmniDock. Estado actualizado al 03/10/2026 con la exportación de Jira del 02/10 (`../gestion/jira/`).

## Historias de Usuario

Las 11 historias están definidas en el ERS (anexo 5.4) con sus criterios de aceptación. El orden corresponde al plan de sprints; el Product Owner puede reordenarlo. No hay estimación por puntos: el esfuerzo se planificó en horas por sprint (ERS 4.1.6).

| Orden | Historia | Jira | Sprint | Estado |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **HU-01** Autenticación con directorio institucional | Sin historia en Jira | 2 y 3 | API probada; pantalla construida, por probar |
| 2 | **HU-04** Trazabilidad transaccional e inmutabilidad | Sin historia en Jira | 2 | Probada |
| 3 | **HU-02** Asignación inteligente por vehículo | Sin historia en Jira | 2 y 3 | API probada; pantalla construida, por probar |
| 4 | **HU-06** Registro y consulta de bahías disponibles | KAN-35 | 3 | API probada; pantalla construida, por probar |
| 5 | **HU-07** Escaneo e iniciación de sesión de uso | KAN-36 | 3 | API probada; pantalla construida, por probar |
| 6 | **HU-08** Historial de autogestión | KAN-37 | 3 | API probada; pantalla construida, por probar |
| 7 | **HU-03** Comunicación con infraestructura física (IoT) | Sin historia en Jira | 3 | Simulador probado; falta el caso de simulador caído |
| 8 | **HU-09** Gestión y monitoreo de racks | KAN-38 | 3 | API probada; panel construido, por probar |
| 9 | **HU-10** Administración de usuarios y permisos | KAN-39 | 3 | API probada, con un defecto abierto (DEF-03); panel por probar |
| 10 | **HU-05** Pipeline de datos para reportería | Sin historia en Jira | 4 | No iniciada |
| 11 | **HU-11** Embebimiento y exposición de dashboards | KAN-40 | 4 | Pantalla construida; Power BI sin configurar |

Pendiente en Jira: crear HU-01 a HU-05 como historias.

## Estructura de Épicas (Áreas de Trabajo del Proyecto)

### 1. [KAN-30] Kick-Off — Finalizado
* `[KAN-31]` Acta de Kick-off — Finalizado
* `[KAN-32]` Definición de Alcances — Finalizado
* `[KAN-33]` Comienzo de ERS — Finalizado

### 2. [KAN-4] Documentación y diseños iniciales — Finalizado
* `[KAN-9]` Levantamiento de Requerimientos (ERS) — Finalizado
* `[KAN-7]` Diseño de BD Oracle — Finalizado
* `[KAN-8]` Definición contratos API — Finalizado
* `[KAN-34]` Diseño UI (Web y Móvil) — En curso (4 de 8 subtareas finalizadas)

### 3. [KAN-5] Core Backend y Seguridad
* `[KAN-12]` Programación de CRUD en Java — Terminado y probado; falta actualizar Jira
* `[KAN-13]` Implementación de seguridad JWT — Terminado y probado; falta actualizar Jira
* `[KAN-14]` Estructuración BD — 4 de 5 subtareas finalizadas

### 4. [KAN-41] Aplicación Móvil (Usuario)
* `[KAN-37]` Historial de Autogestión (App Móvil) — Por hacer
* `[KAN-35]` Registro y Consulta de Bahías Disponibles (App Móvil) — Por hacer
* `[KAN-36]` Escaneo e Iniciación de Sesión de Uso (App Móvil) — Por hacer

### 5. [KAN-42] Plataforma Web (Admin)
* `[KAN-38]` Gestión y Monitoreo de Racks (Web Admin) — Por hacer
* `[KAN-39]` Administración de Usuarios y Permisos (Web Admin) — Por hacer
* `[KAN-40]` Embebimiento y Exposición de Dashboards (Web Admin) — Por hacer, Sprint 4

### 6. [KAN-6] Integración IoT & UI
* `[KAN-19]` Desarrollo UI (Web y Móvil) — Por hacer en Jira; las pantallas ya están construidas
* `[KAN-18]` Integración de Sistemas (Front + Back + BD) — Por hacer

### 7. [KAN-26] Analítica y Cierre
* `[KAN-27]` Despliegue Pipeline Data hacia PowerBI — Por hacer
* `[KAN-28]` Pruebas de Integración — Por hacer
* `[KAN-29]` Empaquetado del prototipo — Por hacer

## Trabajo Realizado que Falta Registrar en Jira

| Ítem | Sprint | Evidencia |
| :--- | :--- | :--- |
| Documento de Arquitectura de Software (DAS v1.1) | 2 | `../arquitectura/` |
| ERS v1.2 y v1.3 | 2 | `../arquitectura/` |
| Diagramas UML (casos de uso, componentes, despliegue, secuencia) | 2 | `../arquitectura/uml/` |
| Pruebas QA de los Sprints 1 y 2 | 2 | `../qa/` |
| Recarga de la base y scripts de datos simplificados | 2 | `../../database/` |

## Defectos y Mejoras por Priorizar (Sprint 3)

| Ítem | Descripción |
| :--- | :--- |
| DEF-03 | El token de un usuario bloqueado sigue vigente |
| DEF-04 | Una bahía con reserva o ticket vigente puede quedar disponible |
| DEF-05 | Falta `.gitignore` en la raíz (la carpeta `wallet/` no debe subirse) |
| DEF-06 | La ventana de "15 minutos" está escrita fija en la app |
| DEF-08 | Faltan pruebas automatizadas del backend |
| Cambio | Ampliar la ventana de reserva |
| Documentación | Seis anexos pendientes del ERS (5.2, 5.5 a 5.8 y 5.10) |
