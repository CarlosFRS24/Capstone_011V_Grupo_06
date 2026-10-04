# Definición de terminado

Una historia o tarea la damos por terminada, y la movemos a "Listo" en Jira, cuando cumple esto:

## Código y base de datos

- El código está en el repositorio de GitHub, o listo para subirse, y sin conflictos.
- El backend compila sin errores.
- Los scripts de la base de datos se probaron y no rompen las relaciones entre tablas. Después de cada carga de datos, `database/03_verificar.sql` muestra bien los catálogos y los estados de las bahías.

## Pruebas y seguridad

- Revisamos uno por uno los criterios de aceptación de la historia (ERS, anexo 5.4).
- Los endpoints se probaron (con Postman, Swagger o llamadas directas a la API) y el resultado quedó anotado en `docs/qa/` o en la carpeta del sprint.
- Todo lo que requiere iniciar sesión pide el token JWT.
- Los campos vacíos o con datos erróneos están validados.
- No quedan problemas críticos abiertos de esa historia.

## Pantallas

- Respetan los colores y el diseño definidos en Figma.
- Se probaron completas contra el backend, no solo por separado.

## Documentación

- Si el cambio afecta el funcionamiento, la base de datos o la API, actualizamos el ERS, el DAS y el README.

## Jira

- La tarea tiene sus comentarios y sus subtareas cerradas.
- El responsable la movió a "Listo".
