# ✅ Definition of Done (DoD)

Para que una Historia de Usuario o Tarea Técnica de OmniDock sea considerada "Terminada" (Done) y pase a la columna final de Jira, debe cumplir estrictamente con los siguientes criterios:

## 1. Código y Arquitectura
* El código ha sido subido (Pushed) a la rama correspondiente en este repositorio de GitHub sin conflictos.
* El código backend en Java compila sin errores.
* Las consultas y scripts de base de datos (Oracle) han sido probados y no generan violaciones de integridad referencial; después de cada carga de datos, `database/03_verificar.sql` muestra los catálogos y los estados de bahía correctos.

## 2. Pruebas y Seguridad
* Los criterios de aceptación de la historia (ERS, anexo 5.4) han sido verificados uno por uno.
* Los endpoints desarrollados han sido probados exitosamente (Postman, Swagger o llamadas directas a la API) y el resultado quedó registrado en `docs/qa/` o en las evidencias del sprint.
* Toda transacción que lo requiera exige validación de identidad mediante token JWT.
* Las validaciones de campos nulos o erróneos están manejadas (Manejo de Excepciones).
* No quedan defectos críticos abiertos asociados a la historia.

## 3. Experiencia de Usuario (UI/UX)
* Las pantallas diseñadas respetan la paleta de colores y el sistema de diseño corporativo definido en Figma.
* La pantalla fue probada de punta a punta contra el backend, no solo de forma aislada.

## 4. Documentación
* Si el cambio altera el comportamiento, el modelo de datos o los contratos de la API, el ERS, el DAS y el README quedan actualizados.

## 5. Gestión Ágil
* El ticket en Jira ha sido actualizado con los comentarios técnicos correspondientes (y sus subtareas cerradas).
* La tarea ha sido movida a la columna "Listo" por el responsable.
