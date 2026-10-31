# OmniDock · App y panel web

Un solo proyecto contiene las dos interfaces de OmniDock:

- **App móvil**, para usuarios y colaboradores: buscar una bahía, reservarla, escanear el QR del rack, ver el historial y los avisos.
- **Panel web**, para el administrador: monitorear los racks, atender tickets, administrar usuarios y ver la analítica.

Al iniciar sesión, cada persona entra a su parte según su rol.

Está hecho con **Ionic y Angular**, y **Capacitor** genera la app de Android desde el mismo código. El diseño sigue los mockups de Figma (sin la pantalla de perfil ni NFC, que quedaron fuera del alcance).

## Qué se necesita

- Node.js y npm.
- El backend levantado (ver `../backend/README.md`).
- Para la app de Android: Android Studio.

## Cómo levantarlo

```bash
cd frontend
npm install        # solo la primera vez
npm start          # abre en http://localhost:8100
```

La dirección del backend está en `src/environments/environment.ts` (`apiUrl`):

| Dónde se prueba | `apiUrl` |
| --- | --- |
| Navegador del mismo PC | `http://localhost:8080/api/v1` |
| Emulador de Android | `http://10.0.2.2:8080/api/v1` |
| Celular real | `http://IP-DEL-PC:8080/api/v1` (el celular y el PC en la misma red) |

## App de Android

```bash
npm run build:prod
npx cap sync
npx cap open android     # abre Android Studio para instalarla o generar el APK
```

## Usuarios de prueba

Administrador `csoto@duocuc.cl` / `admin123`. Usuario con bicicleta `mmunoz@duocuc.cl` / `user123`. Usuaria con 3 faltas (no puede reservar) `fnavarro@duocuc.cl` / `user123`. Hay más en `../backend/README.md`.

## Pantallas

| Parte | Pantalla | Qué hace |
| --- | --- | --- |
| Todos | Login | Entrar con la cuenta institucional |
| App | Inicio | Bahías libres por sector, solo las compatibles con el vehículo elegido; faltas (X de 3), horario y lista de espera |
| App | Reservar | Confirma la bahía y el vehículo; muestra hasta qué hora hay que llegar |
| App | Escanear | Lee el QR del rack para empezar y terminar el uso |
| App | Historial | Usos del mes con su duración |
| App | Vehículos | Registrar, elegir y desactivar vehículos |
| App | Avisos (campana) | Faltas, bahías ofrecidas por la lista de espera y reservas canceladas por mantención |
| Panel | Racks | Estado de las 50 bahías al día, tickets, y quién está en la lista de espera |
| Panel | Tickets | Fallas reportadas y su seguimiento |
| Panel | Usuarios | Crear, cambiar rol, bloquear y anular faltas |
| Panel | Analítica | Indicadores y gráficos de uso por período |

## Códigos QR

Cada rack tiene un QR con su código (por ejemplo `RACK-BICI-01`). Los QR de las 50 bahías para imprimir están en `qr-prueba/QR_racks_OmniDock.pdf`.

- En la app de Android se usa el lector de Google.
- En el navegador se usa la cámara del equipo. Solo funciona en `localhost` o con `https`; para probar desde el navegador del celular: `npm start -- --ssl` y abrir `https://IP-DEL-PC:8100`.
- Si no hay cámara o el QR no se lee, el código se puede escribir a mano.
