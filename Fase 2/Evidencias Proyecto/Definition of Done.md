# ✅ Definition of Done (DoD)

Para que una Historia de Usuario o Tarea Técnica de OmniDock sea considerada "Terminada" (Done) y pase a la columna final de Jira, debe cumplir estrictamente con los siguientes criterios:

## 1. Código y Arquitectura
* El código ha sido subido (Pushed) a la rama correspondiente en este repositorio de GitHub sin conflictos.
* El código backend en Java compila sin errores.
* Las consultas y scripts de base de datos (Oracle) han sido probados y no generan violaciones de integridad referencial.

## 2. Pruebas y Seguridad
* Los endpoints desarrollados han sido probados exitosamente utilizando Postman.
* Toda transacción que lo requiera exige validación de identidad mediante token JWT.
* Las validaciones de campos nulos o erróneos están manejadas (Manejo de Excepciones).

## 3. Experiencia de Usuario (UI/UX)
* Las pantallas diseñadas respetan la paleta de colores y el sistema de diseño corporativo definido en Figma.

## 4. Gestión Ágil
* El ticket en Jira ha sido actualizado con los comentarios técnicos correspondientes (y sus subtareas cerradas).
* La tarea ha sido movida a la columna "Listo" por el responsable.
