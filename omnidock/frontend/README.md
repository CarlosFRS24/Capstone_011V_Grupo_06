# OmniDock App (Ionic 8 + Angular 18 standalone + Capacitor)

Un solo proyecto para la **app móvil** (usuario/colaborador) y el **panel web administrativo**. Tras el login se redirige según el rol del JWT: Administrador -> `/admin`, Usuario/Colaborador -> `/app`. Los guards impiden entrar a la zona del otro rol.

## Ejecutar
```bash
npm install
npm start            # http://localhost:8100 (el backend ya lo permite por CORS)
```
Backend: `http://localhost:8080` (cambiar en `src/environments/environment.ts`).
- Emulador Android: `http://10.0.2.2:8080/api/v1`  ·  celular real: la IP de tu PC en la red local.

Usuarios del seed: admin `csoto@duocuc.cl` / `admin123`; usuario `mmunoz@duocuc.cl` / `user123` (tiene bicicleta); `gfuentes@duocuc.cl` / `user123` (scooter, con reserva pendiente en la bahía 4).

## Diseño
La interfaz sigue los mockups de Figma (ERS, anexo 5.4), sin la pantalla de perfil ni NFC, que quedaron fuera del alcance. La pestaña Perfil del mockup se reemplaza por Vehículos y el cierre de sesión está en la cabecera.
- Colores, tipografía (Inter) y componentes comunes: `src/theme/variables.scss` y `src/global.scss`.
- Isotipo: `src/assets/logo.svg`, redibujado a partir del mockup; reemplazarlo por la exportación oficial de Figma.
- Minutos de la reserva que muestra la app: `reservaMinutos` en `src/environments/environment.ts` (debe coincidir con `RESERVA_MINUTOS` del backend).

## Pantallas (HU)
| Zona | Pantalla | HU | Endpoints |
|---|---|---|---|
| Login | Portada y acceso con cuenta institucional | HU-01 | `POST /auth/login` |
| App | **Inicio**: vehículo elegido, búsqueda y bahías agrupadas por ubicación con sus libres | HU-06 | `GET /bahias`, `GET /vehiculos/usuario/{id}` |
| App | **Detalle de reserva**: confirma bahía y vehículo; sin vehículo compatible avisa y no reserva | HU-02, HU-06 | `POST /reservas` |
| App | **Escanear**: reserva pendiente, lector de QR, sesión activa y resumen al finalizar. El retiro también se confirma escaneando el rack | HU-07 | `GET /reservas/usuario/{id}`, `GET /bahias/codigo/{c}`, `POST /transacciones/iniciar`, `/{id}/finalizar` |
| App | **Historial**: estacionamientos del mes y movimientos con duración | HU-08 | `GET /transacciones/usuario/{id}` |
| App | **Vehículos**: elegir el que se usa al reservar, registrar y desactivar | HU-02 | `/vehiculos`, `/catalogos/tipos-vehiculo` |
| Admin | **Racks**: resumen por estado, filtros, refresco cada 3 s, nuevo rack, ticket, fuera de servicio/disponible | HU-09 | `/bahias`, `POST /tickets` |
| Admin | **Tickets**: resumen, filtros, nuevo ticket y cambio de estado | HU-09 | `/tickets` |
| Admin | **Usuarios**: resumen, filtros, crear, cambiar rol, bloquear/habilitar, desactivar | HU-10 | `/usuarios` |
| Admin | **Analítica**: indicadores en vivo y Power BI embebido | HU-11 | `GET /analitica/embed-token`, `/bahias`, `/usuarios` |

## QR
El QR de cada rack debe contener su **código IoT** (ej. `RACK-BICI-01`). El lector está en `core/scanner.service.ts`:
- **App instalada (Android):** escáner de Google con ML Kit. No pide permiso de cámara; la primera vez descarga un módulo de Google Play Services (la app muestra el avance).
- **Navegador (PC o celular):** usa la cámara con `getUserMedia` y `jsQR` (`shared/qr-camara.component.ts`). El navegador solo entrega la cámara en `http://localhost` o en `https://`. Para probar desde el navegador del celular: `npm start -- --ssl` y abrir `https://IP-DEL-PC:8100` (aceptar el certificado).
- **Sin cámara, permiso denegado o QR ilegible:** se ofrece escribir el código a mano.

## Móvil (Capacitor)
```bash
npm run build:prod
npx cap add android      # una vez
npx cap sync && npx cap open android
```
`capacitor.config.ts` ya permite tráfico HTTP en claro hacia el backend de desarrollo.

## Estructura
```
src/app/core     modelos, auth (JWT en localStorage), interceptor 401, guards, ApiService, escáner QR
src/app/shared   cabecera común (logout)
src/app/pages    login · app/(tabs, bahias, sesion, vehiculos, historial) · admin/(shell, racks, tickets, usuarios, analitica)
```
Catálogos (IDs de estado de bahía, roles, tipos) en `core/models.ts`, alineados con `02_insert.sql`.
