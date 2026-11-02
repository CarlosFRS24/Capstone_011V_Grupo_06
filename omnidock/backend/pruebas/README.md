# Pruebas de regresión de la API

`regresion_api.py` ejecuta los casos de prueba de la API (los mismos IDs del registro de QA: `S2-AUTH-01`, `S2-RES-05`, etc.) contra el backend levantado y deja un reporte con fecha en `docs/qa/`.

## Cómo se ejecuta

1. Levantar el backend con el perfil `mock`, desde la carpeta `backend/`:

   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=mock
   ```

2. En otra terminal, desde la raíz del proyecto:

   ```bash
   python3 backend/pruebas/regresion_api.py --ejecutor "Nombre Apellido"
   ```

Solo necesita Python 3.8 o superior; no hay que instalar nada.

## Qué deja

| Archivo | Contenido |
| --- | --- |
| `docs/qa/regresion_api_AAAA-MM-DD_HHMM.md` | Resultado por módulo y caso por caso: esperado, obtenido, tiempo y resultado |
| `docs/qa/regresion_api_AAAA-MM-DD_HHMM_detalle.txt` | Cada llamada HTTP con lo enviado y lo recibido, sin claves ni tokens |

En pantalla muestra cada caso a medida que lo ejecuta y un resumen al final. Termina con código 1 si hay una falla que no sea un defecto ya conocido.

## Opciones

| Opción | Para qué |
| --- | --- |
| `--url http://localhost:8080` | Dirección del backend |
| `--ejecutor "Nombre"` | Quién ejecuta; queda en el reporte |
| `--reserva-min 60` | Minutos de la ventana de reserva que se espera (por defecto toma `RESERVA_MINUTOS` o 60) |
| `--esperar-expiracion` | Incluye `S2-RES-13`, `S4-FAL-05` y `S4-FAL-06`, que esperan a que venza una reserva. Conviene levantar el backend con `RESERVA_MINUTOS=2` y usar `--reserva-min 2` |
| `--sin-reporte` | Solo muestra el resultado en pantalla |

## Datos y credenciales

- El script no toca los datos existentes. Crea sus propios usuarios, bahías, vehículos, reservas y tickets, todos con el prefijo `QA`, y al final los deja desactivados. Como el sistema no borra físicamente (RF-04), esos registros quedan en la base hasta que se recargue la base (`00` → `01` → `02` → `03` → `04` → `06`).
- La clave del administrador se toma de las variables de entorno `OMNIDOCK_ADMIN_EMAIL` y `OMNIDOCK_ADMIN_PASSWORD`. Si no existen, se lee del primer administrador de `database/02_insert.sql`.
- La llave de los dispositivos IoT se toma de `IOT_API_KEY` o de `application.yml`.
- Ninguna clave ni token se escribe en el reporte ni en pantalla.

## Casos

115 casos en 12 módulos: autenticación, roles y permisos, bahías, vehículos, reservas, check-in y check-out, tickets, usuarios, documentación, simulador IoT, analítica, y faltas, lista de espera y avisos. El plan completo está al inicio del script, en la lista `PLAN`.

# Prueba de carga

`prueba_carga.py` revisa los requisitos de rendimiento del ERS con muchos usuarios a la vez:

- **RNF-01:** el check-in (orden de apertura del candado) no pasa de 2 segundos.
- **RNF-02:** las reservas simultáneas no generan bloqueos ni errores 500.

Crea N usuarios y N bahías de prueba ("QA Carga"). Los N usuarios parten al mismo tiempo y hacen el ciclo completo: login, ver bahías, mi estado, reservar, check-in y check-out. Al final todos intentan reservar la misma bahía: debe ganar uno solo y el resto recibir 409. Los datos de prueba quedan desactivados.

```bash
# backend con el perfil mock y sin horario
HORARIO_ACTIVO=false mvn spring-boot:run -Dspring-boot.run.profiles=mock

# en otra terminal, desde la raíz del proyecto
python3 backend/pruebas/prueba_carga.py --usuarios 50 --rondas 3 --ejecutor "Nombre Apellido"
```

Deja `docs/qa/prueba_carga_AAAA-MM-DD_HHMM.md` con los tiempos por operación (promedio, p95 y máximo) y el resultado de RNF-01 y RNF-02.
