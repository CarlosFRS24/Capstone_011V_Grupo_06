# Visión del producto: OmniDock

## El problema

Cada vez llega más gente en bicicleta o scooter a las sedes. Los bicicleteros son estructuras de fierro en forma de U invertida, donde cada uno deja su vehículo con su propio candado. Hace poco se agregó un control con el RUT y un código de barras en las bicicletas, que registra la entrada y la salida, pero a la salida no siempre se revisa que la bicicleta sea de quien la saca. Tampoco dice si hay espacio antes de llegar, en qué lugar quedó cada vehículo ni a qué horas se llena cada sector. Por eso la administración no tiene datos para decidir dónde poner más racks.

## Nuestra solución

**OmniDock** es una plataforma para gestionar estacionamientos de bicicletas y scooters. El usuario reserva y abre su bahía desde una app, y la institución ve lo que pasa en un panel web y en tableros de Power BI. Los racks se controlan con dispositivos IoT, que en el prototipo se simulan por software.

## Para quién

- **Usuario final:** estudiantes, docentes y funcionarios que llegan en bicicleta o scooter.
- **Administrador:** el personal que opera los racks, gestiona los usuarios y revisa las métricas.

## Qué le aporta a cada uno

1. **Al usuario:** puede ver antes de llegar si hay espacio, reservar desde la app y dejar su vehículo asegurado escaneando el código QR del rack.
2. **A la institución:** controla los racks y los usuarios desde un panel web, y ve en Power BI cuánto se ocupan los estacionamientos y a qué horas, con registros que no se pueden borrar.

## Cómo sabremos que funciona

Son las metas que nos pusimos en el DAS (sección 7):

| Indicador | Hoy | Meta con OmniDock |
| --- | --- | --- |
| Tiempo para encontrar estacionamiento | 8 a 12 minutos | Menos de 2 minutos |
| Registro de cada uso | Entrada y salida con RUT y código de barras, sin revisar siempre que la bicicleta sea del mismo dueño | 100 % de los usos registrados, con rack, hora de llegada y de salida |
| Tiempo para resolver una falla | Días o semanas | 65 % menos |
| Rotación por rack | No se mide | 35 % más |

## Qué incluye el prototipo

- **Incluye:** backend en Java, base de datos Oracle, app móvil, panel web, simulador IoT y tablero en Power BI.
- **No incluye:** hardware físico ni pagos. La lectura por NFC queda para más adelante.

## El equipo (Nodalix)

- **Carlos Román:** líder del proyecto (Scrum Master y Product Owner) y diseño de pantallas.
- **Crisler Romero:** arquitectura de datos y BI.
- **Felipe Vidal:** backend e integración IoT.
