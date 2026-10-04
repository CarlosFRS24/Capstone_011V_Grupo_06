# Visión del producto: OmniDock

## El problema

Cada vez llega más gente en bicicleta o scooter a las sedes, y no hay orden: no se sabe dónde hay espacio, los vehículos quedan poco seguros y los estacionamientos se usan mal. Además, la administración no tiene datos de cuánto se usan, así que no puede justificar inversiones.

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
| Registro de cada uso | No existe | 100 % de los usos registrados |
| Tiempo para resolver una falla | Días o semanas | 65 % menos |
| Rotación por rack | No se mide | 35 % más |

## Qué incluye el prototipo

- **Incluye:** backend en Java, base de datos Oracle, app móvil, panel web, simulador IoT y tablero en Power BI.
- **No incluye:** hardware físico ni pagos. La lectura por NFC queda para más adelante.

## El equipo (Nodalix)

- **Carlos Román:** líder del proyecto (Scrum Master y Product Owner) y diseño de pantallas.
- **Crisler Romero:** arquitectura de datos y BI.
- **Felipe Vidal:** backend e integración IoT.
