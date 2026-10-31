#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OmniDock - Regresion de la API (pruebas de caja negra)

Ejecuta los casos de prueba de la API contra el backend levantado y deja un
reporte con fecha en docs/qa/. Cada caso es una llamada HTTP real: se revisa
el codigo de respuesta, el cuerpo y, cuando corresponde, el estado en que
queda la bahia.

Uso (con el backend levantado con el perfil "mock"):

    python3 backend/pruebas/regresion_api.py

Opciones utiles:

    --url http://localhost:8080     direccion del backend
    --ejecutor "Nombre Apellido"    quien ejecuta (queda en el reporte)
    --reserva-min 60                minutos de la ventana de reserva esperada
    --esperar-expiracion            incluye S2-RES-13 y S4-FAL-05/06 (espera la ventana completa;
                                    para no esperar 1 hora, levanta el backend con RESERVA_MINUTOS=2
                                    y ejecuta con --reserva-min 2)

Las reservas solo se aceptan en horario (L-V 07:00-21:30, sab 07:00-15:00).
Para correr la regresion a cualquier hora levanta el backend con HORARIO_ACTIVO=false.
    --sin-reporte                   solo muestra el resultado en pantalla

Solo usa la biblioteca estandar de Python 3.8 o superior: no hay nada que instalar.

Datos: el script NO toca los datos existentes. Crea sus propios usuarios, bahias,
vehiculos, reservas y tickets (todos con el prefijo "QA"), y al final los deja
desactivados. Como el sistema no borra fisicamente (RF-04), esos registros
quedan en la base hasta que se recargue con los scripts 00 a 03.

Credenciales: la clave del administrador se lee de las variables de entorno
OMNIDOCK_ADMIN_EMAIL y OMNIDOCK_ADMIN_PASSWORD o, si no existen, del primer
administrador de database/02_insert.sql. La llave de los dispositivos se lee de
IOT_API_KEY o de application.yml. Ninguna clave ni token se escribe en el reporte.
"""
import argparse
import datetime
import getpass
import json
import os
import random
import re
import secrets
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]          # carpeta del proyecto
SEED = RAIZ / "database" / "02_insert.sql"
YML = RAIZ / "backend" / "src" / "main" / "resources" / "application.yml"
DIR_REPORTES = RAIZ / "docs" / "qa"

INEXISTENTE = 999999999                              # ID que no existe en ninguna tabla
DISPONIBLE, RESERVADA, OCUPADA, FUERA_DE_SERVICIO = 1, 2, 3, 4
NOMBRE_ESTADO = {1: "DISPONIBLE", 2: "RESERVADA", 3: "OCUPADA", 4: "FUERA_DE_SERVICIO"}

# Casos que hoy fallan por un defecto ya registrado. Se informan como falla conocida.
DEFECTOS_CONOCIDOS = {"S2-USR-08": "DEF-03"}

# ------------------------------------------------------------------------------
# Plan de pruebas: (ID, modulo, referencia del ERS, caso, resultado esperado)
# ------------------------------------------------------------------------------
PLAN = [
    ("S2-AUTH-01", "Autenticación", "HU-01/RF-01", "Login administrador con credenciales válidas", "200 + token + idRol=1, sin exponer la contraseña"),
    ("S2-AUTH-02", "Autenticación", "HU-01/RF-01", "Login usuario final con credenciales válidas", "200 + token + idRol=2"),
    ("S2-AUTH-03", "Autenticación", "HU-01", "Login con contraseña incorrecta", "401"),
    ("S2-AUTH-04", "Autenticación", "HU-01", "Login con correo inexistente", "401, mismo mensaje"),
    ("S2-AUTH-05", "Autenticación", "HU-01", "Login con cuerpo vacío", "400"),
    ("S2-AUTH-06", "Autenticación", "RNF Seguridad", "Recurso protegido sin token", "401"),
    ("S2-AUTH-07", "Autenticación", "RNF Seguridad", "Token JWT adulterado", "401"),
    ("S2-AUTH-08", "Autenticación", "HU-01", "Perfil propio con token válido", "200 con el usuario del token"),
    ("S2-AUTH-09", "Autenticación", "HU-01", "Login con correo en mayúsculas", "200"),

    ("S2-RBAC-01", "Roles y permisos", "HU-10", "Usuario final lista usuarios", "403"),
    ("S2-RBAC-02", "Roles y permisos", "HU-09", "Usuario final intenta crear bahía", "403"),
    ("S2-RBAC-03", "Roles y permisos", "HU-11", "Usuario final pide token de analítica", "403"),
    ("S2-RBAC-04", "Roles y permisos", "HU-09", "Usuario final lista tickets", "403"),
    ("S2-RBAC-05", "Roles y permisos", "RNF", "Usuario A consulta vehículos del usuario B", "403"),
    ("S2-RBAC-06", "Roles y permisos", "HU-08", "Usuario A consulta historial del usuario B", "403"),
    ("S2-RBAC-07", "Roles y permisos", "RNF", "Usuario A consulta reservas del usuario B", "403"),
    ("S2-RBAC-08", "Roles y permisos", "HU-10", "Colaborador (rol 3) lista usuarios", "403"),
    ("S2-RBAC-09", "Roles y permisos", "HU-10", "Administrador lista usuarios", "200 sin contraseñas"),
    ("S2-RBAC-10", "Roles y permisos", "HU-10", "Usuario final se auto-asigna rol administrador", "403"),

    ("S2-BAH-01", "Bahías", "HU-06/RF-06", "Listar bahías", "200 con estado"),
    ("S2-BAH-06", "Bahías", "HU-09/RF-09", "Administrador crea bahía con dispositivo IoT", "201"),
    ("S2-BAH-07", "Bahías", "HU-09", "Crear bahía con código duplicado", "409"),
    ("S2-BAH-08", "Bahías", "HU-09", "Crear bahía con tipo inexistente", "400"),
    ("S2-BAH-02", "Bahías", "HU-02/HU-06", "Filtrar disponibles para bicicleta", "Solo estado 1 y tipo 1; incluye la bahía nueva"),
    ("S2-BAH-03", "Bahías", "HU-06", "Filtrar por texto de ubicación en minúsculas", "Solo bahías de esa ubicación"),
    ("S2-BAH-04", "Bahías", "HU-07", "Resolver bahía por código QR válido", "200 con la bahía"),
    ("S2-BAH-05", "Bahías", "HU-07", "Resolver bahía por código QR inexistente", "404 con mensaje claro"),
    ("S2-BAH-09", "Bahías", "HU-09", "Actualizar ubicación", "200 y persistido"),
    ("S2-BAH-10", "Bahías", "HU-09", "Actualizar a un estado inexistente", "400"),
    ("S2-BAH-13", "Bahías", "HU-09/RF-09", "Administrador pasa la bahía a FUERA_DE_SERVICIO", "200, estado 4"),
    ("S2-BAH-11", "Bahías", "HU-09", "Administrador devuelve la bahía a DISPONIBLE", "200, estado 1"),
    ("S2-BAH-12", "Bahías", "HU-04/RF-04", "Eliminar bahía (borrado lógico)", "204; queda FUERA_DE_SERVICIO"),

    ("S2-VEH-01", "Vehículos", "HU-02/RF-02", "Registrar vehículo propio", "201"),
    ("S2-VEH-02", "Vehículos", "HU-02", "Tipo de vehículo inexistente", "400"),
    ("S2-VEH-03", "Vehículos", "HU-02", "Sin identificador", "400"),
    ("S2-VEH-04", "Vehículos", "HU-02", "Listar vehículos propios", "200, incluye el nuevo"),
    ("S2-VEH-05", "Vehículos", "RNF", "Usuario B elimina vehículo del usuario A", "403"),
    ("S2-VEH-06", "Vehículos", "HU-04/RF-04", "Eliminar vehículo propio (borrado lógico)", "204; deja de listarse"),
    ("S2-VEH-07", "Vehículos", "HU-04", "Reservar con un vehículo dado de baja", "400"),

    ("S2-RES-01", "Reservas", "HU-02/RF-02", "Reservar bahía de bicicleta con un scooter", "409"),
    ("S2-RES-02", "Reservas", "HU-02", "Reservar con vehículo de otro usuario", "400"),
    ("S2-RES-03", "Reservas", "HU-06", "Reservar bahía inexistente", "404"),
    ("S2-RES-05", "Reservas", "RNF Fiabilidad (ACID)", "Dos usuarios reservan la misma bahía al mismo tiempo", "Una 201 y una 409; bahía RESERVADA"),
    ("S2-RES-06", "Reservas", "HU-06", "Cancelar reserva pendiente propia", "200 CANCELADA; bahía DISPONIBLE"),
    ("S2-RES-07", "Reservas", "HU-06", "Cancelar una reserva ya cancelada", "409"),
    ("S2-RES-08", "Reservas", "HU-06/RF-06", "Crear reserva válida", "201 PENDIENTE; ventana configurada; bahía RESERVADA"),
    ("S2-RES-04", "Reservas", "HU-06", "Reservar bahía que no está DISPONIBLE", "409"),
    ("S2-RES-09", "Reservas", "Regla de negocio", "Segunda reserva con una pendiente", "409"),
    ("S2-RES-10", "Reservas", "HU-06", "Listar reservas pendientes propias", "200 con 1"),
    ("S2-RES-11", "Reservas", "RNF", "Usuario B cancela reserva del usuario A", "403"),
    ("S2-RES-12", "Reservas", "HU-04/RF-04", "DELETE físico de una reserva, como administrador", "La ruta no existe (404 o 405) y la reserva sigue"),
    ("S2-RES-13", "Reservas", "HU-06/RF-06", "Expiración automática de una reserva no usada", "Pasada la ventana: reserva EXPIRADA, bahía DISPONIBLE, check-in rechazado"),

    ("S2-TX-01", "Check-in, check-out e historial", "HU-07", "Check-in con la reserva de otro usuario", "403"),
    ("S2-TX-02", "Check-in, check-out e historial", "HU-07", "Check-in con reserva inexistente", "404"),
    ("S2-TX-03", "Check-in, check-out e historial", "HU-07/RF-07", "Check-in sin reserva", "400"),
    ("S2-TX-04", "Check-in, check-out e historial", "HU-07", "Check-in con el QR de otra bahía", "409; la bahía sigue RESERVADA"),
    ("S2-TX-05", "Check-in, check-out e historial", "HU-07/HU-03/RNF Rendimiento", "Check-in válido", "200 ACTIVA en menos de 2 s; bahía OCUPADA; sin reservas pendientes"),
    ("S2-TX-06", "Check-in, check-out e historial", "RNF Fiabilidad", "Repetir check-in con la misma reserva", "409"),
    ("S2-TX-07", "Check-in, check-out e historial", "Regla de negocio", "Cancelar una reserva ya concretada", "409"),
    ("S2-TX-08", "Check-in, check-out e historial", "RNF Fiabilidad", "Otro usuario reserva una bahía OCUPADA", "409"),
    ("S2-TX-09", "Check-in, check-out e historial", "RNF", "Usuario B hace check-out del uso del usuario A", "403"),
    ("S2-TX-10", "Check-in, check-out e historial", "HU-07/HU-04", "Check-out válido", "200 FINALIZADA; fin >= inicio; bahía DISPONIBLE"),
    ("S2-TX-11", "Check-in, check-out e historial", "RNF Fiabilidad", "Repetir check-out", "409"),
    ("S2-TX-12", "Check-in, check-out e historial", "HU-08/RF-08", "Historial tras finalizar", "Aparece primero con rack, ubicación, vehículo y minutos"),
    ("S2-TX-13", "Check-in, check-out e historial", "HU-04/RF-04", "DELETE físico de un uso, como administrador", "La ruta no existe (404 o 405) y el uso sigue"),

    ("S2-TKT-01", "Tickets de mantención", "HU-09/RF-09", "Usuario reporta una falla", "201; bahía FUERA_DE_SERVICIO"),
    ("S2-TKT-07", "Tickets de mantención", "HU-09", "Administrador lista tickets ABIERTOS", "200, incluye el ticket nuevo"),
    ("S2-TKT-03", "Tickets de mantención", "HU-09", "Ticket sin descripción", "400"),
    ("S2-TKT-05", "Tickets de mantención", "HU-09", "Ticket de ABIERTO a EN_REVISION", "200 y persistido; la bahía sigue fuera de servicio"),
    ("S2-TKT-04", "Tickets de mantención", "HU-09", "Ticket a un estado inválido", "400"),
    ("S2-TKT-06", "Tickets de mantención", "HU-09", "Actualizar ticket inexistente", "404"),
    ("S2-TKT-08", "Tickets de mantención", "HU-09/RF-09", "Ticket a RESUELTO", "200; con fecha de resolución; bahía DISPONIBLE"),
    ("S2-TKT-02", "Tickets de mantención", "HU-09/RF-09", "Administrador abre ticket sobre la bahía", "201; bahía FUERA_DE_SERVICIO"),
    ("S2-TKT-09", "Tickets de mantención", "HU-09", "Ticket sobre una bahía inexistente", "404"),
    ("S2-TKT-10", "Tickets de mantención", "HU-04/RF-04", "Eliminar ticket (borrado lógico)", "204; queda ANULADO; bahía DISPONIBLE"),

    ("S2-USR-01", "Usuarios", "HU-10/RF-10", "Administrador crea usuario", "201"),
    ("S2-USR-02", "Usuarios", "HU-10", "RUT duplicado", "409"),
    ("S2-USR-03", "Usuarios", "HU-10", "Correo duplicado, en mayúsculas", "409"),
    ("S2-USR-04", "Usuarios", "HU-10", "Rol inexistente", "400"),
    ("S2-USR-05", "Usuarios", "HU-10", "Correo mal formado", "400"),
    ("S2-USR-06", "Usuarios", "HU-01/HU-10", "El usuario nuevo inicia sesión", "200, idRol=2"),
    ("S2-USR-07", "Usuarios", "HU-10/RF-10", "Administrador bloquea al usuario; este intenta entrar", "Login denegado (403)"),
    ("S2-USR-08", "Usuarios", "RNF Seguridad", "Usuario bloqueado usa un token emitido antes del bloqueo", "401 o 403"),
    ("S2-USR-09", "Usuarios", "HU-10", "Estado de usuario inválido", "400"),
    ("S2-USR-10", "Usuarios", "HU-10/RF-10", "Rehabilitar y cambiar rol a Colaborador", "200; login con idRol=3"),
    ("S2-USR-11", "Usuarios", "HU-04/RF-04", "Eliminar usuario (borrado lógico)", "204; queda INACTIVO; login denegado"),
    ("S2-USR-12", "Usuarios", "HU-10", "Administrador se desactiva a sí mismo", "409"),
    ("S2-USR-13", "Usuarios", "HU-10", "Actualizar usuario inexistente", "404"),

    ("S2-DOC-01", "Documentación de la API", "ERS 1.2", "Swagger disponible", "200 en la interfaz y en /v3/api-docs"),

    ("S3-IOT-01", "Simulador IoT", "HU-03/RNF", "Telemetría sin cabecera X-IOT-KEY", "401"),
    ("S3-IOT-02", "Simulador IoT", "HU-03/RF-03", "Dispositivo envía lectura de sensor", "201 + idLog; la bahía no cambia"),
    ("S3-IOT-05", "Simulador IoT", "HU-03", "Telemetría de un dispositivo no registrado", "404"),
    ("S3-IOT-06", "Simulador IoT", "HU-03/RF-03", "Comando LIBERAR_CERROJO", "200 EJECUTADO"),
    ("S3-IOT-07", "Simulador IoT", "HU-03", "Comando a un dispositivo desconocido", "404"),
    ("S3-IOT-03", "Simulador IoT", "HU-03/RF-03", "Simulador envía ALERTA_FALLA", "200; bahía FUERA_DE_SERVICIO"),
    ("S3-IOT-04", "Simulador IoT", "HU-03/HU-07", "Reservar una bahía que recibió alerta de falla", "409"),

    ("S4-ANA-01", "Analítica", "HU-11/RF-11", "Administrador pide los datos de embebido de Power BI (opcional)", "200 con URL, o 503 si no está configurado"),
    ("S4-ANA-02", "Analítica", "HU-11/RF-11", "Administrador pide los datos de los gráficos (30 días)", "200; indicadores, serie por día y 16 horas (07 a 22)"),
    ("S4-ANA-03", "Analítica", "HU-11/RF-11", "Período no permitido (dias=15)", "400"),
    ("S4-ANA-04", "Analítica", "HU-11/RF-11", "Usuario final pide los datos de los gráficos", "403"),

    ("S4-EST-01", "Faltas, lista de espera y avisos", "Sprint 4", "Usuario consulta su estado (mi-estado)", "200; 0 de 3 faltas; ventana configurada; horario"),
    ("S4-ESP-01", "Faltas, lista de espera y avisos", "Sprint 4", "Unirse a la lista de espera habiendo bahías libres", "409"),
    ("S4-ESP-02", "Faltas, lista de espera y avisos", "Sprint 4", "Salir de la lista sin estar en ella", "404"),
    ("S4-ESP-03", "Faltas, lista de espera y avisos", "Sprint 4", "Confirmar una bahía sin tener oferta", "404"),
    ("S4-ESP-04", "Faltas, lista de espera y avisos", "Sprint 4", "Consultar mi lugar sin estar en la lista", "204"),
    ("S4-ESP-05", "Faltas, lista de espera y avisos", "Sprint 4", "Usuario final pide la lista de espera completa", "403 (solo admin); admin 200"),
    ("S4-RES-14", "Faltas, lista de espera y avisos", "Sprint 4", "Ticket sobre una bahía reservada", "Reserva CANCELADA sin falta, bahía FUERA_DE_SERVICIO y aviso al usuario"),
    ("S4-NOT-01", "Faltas, lista de espera y avisos", "Sprint 4", "Marcar avisos como leídos", "200; 0 sin leer"),
    ("S4-NOT-02", "Faltas, lista de espera y avisos", "Sprint 4", "Usuario B marca un aviso del usuario A", "403"),
    ("S4-FAL-01", "Faltas, lista de espera y avisos", "Sprint 4", "Administrador ve las faltas de un usuario sin faltas", "200 lista vacía"),
    ("S4-FAL-02", "Faltas, lista de espera y avisos", "Sprint 4", "Desbloquear a un usuario sin faltas", "409"),
    ("S4-FAL-03", "Faltas, lista de espera y avisos", "Sprint 4", "Usuario final usa la ruta de faltas del admin", "403; su propia ruta 200"),
    ("S4-FAL-04", "Faltas, lista de espera y avisos", "Sprint 4", "Lista de usuarios con faltas vigentes", "200; cada usuario trae faltasVigentes"),
    ("S4-FAL-05", "Faltas, lista de espera y avisos", "Sprint 4", "Reserva vencida sin check-in deja una falta", "1 de 3 faltas y aviso FALTA"),
    ("S4-FAL-06", "Faltas, lista de espera y avisos", "Sprint 4", "Administrador desbloquea (anula faltas)", "200, 1 anulada; vuelve a 0"),
]
INFO = {c[0]: c for c in PLAN}
MODULOS = []
for _c in PLAN:
    if _c[1] not in MODULOS:
        MODULOS.append(_c[1])


class SinConexion(Exception):
    pass


class Respuesta(object):
    def __init__(self, status, cuerpo, texto, ms):
        self.status, self.cuerpo, self.texto, self.ms = status, cuerpo, texto, ms

    def campo(self, nombre, defecto=None):
        return self.cuerpo.get(nombre, defecto) if isinstance(self.cuerpo, dict) else defecto

    @property
    def mensaje(self):
        m = self.campo("mensaje")
        return m if isinstance(m, str) else ""

    def breve(self):
        """Codigo de respuesta y mensaje, para la columna Obtenido."""
        return '%s "%s"' % (self.status, self.mensaje) if self.mensaje and self.status >= 400 else str(self.status)


# ------------------------------------------------------------------------------
# Estado de la ejecucion
# ------------------------------------------------------------------------------
BASE = "http://localhost:8080"
CLAVES_OCULTAS = ("passwordprototipo", "token", "embedtoken", "x-iot-key", "authorization")
LLAMADAS = []        # detalle de cada llamada HTTP (sin claves)
RESULTADOS = {}      # id del caso -> dict(obtenido, ms, resultado)
CREADOS = []         # registros de prueba que quedan en la base
caso_actual = ["PREPARACION"]
quien = {}           # token -> etiqueta legible ("administrador", "usuario A"...)


def ocultar(obj):
    """Copia de un cuerpo JSON con las claves y tokens reemplazados."""
    if isinstance(obj, dict):
        return {k: ("<oculto>" if k.lower() in CLAVES_OCULTAS and v is not None else ocultar(v)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [ocultar(x) for x in obj]
    return obj


def api(metodo, ruta, token=None, cuerpo=None, params=None, cabeceras=None):
    url = BASE + ruta
    if params:
        url += "?" + urllib.parse.urlencode(params)
    datos = None
    cab = {"Accept": "application/json"}
    if cuerpo is not None:
        datos = json.dumps(cuerpo).encode("utf-8")
        cab["Content-Type"] = "application/json"
    if token:
        cab["Authorization"] = "Bearer " + token
    if cabeceras:
        cab.update(cabeceras)
    pet = urllib.request.Request(url, data=datos, headers=cab, method=metodo)
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(pet, timeout=20) as r:
            status, bruto = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, bruto = e.code, e.read()
    except (urllib.error.URLError, OSError) as e:
        raise SinConexion(str(e))
    ms = int(round((time.perf_counter() - t0) * 1000))
    texto = bruto.decode("utf-8", "replace")
    try:
        js = json.loads(texto) if texto.strip() else None
    except ValueError:
        js = None
    LLAMADAS.append({
        "caso": caso_actual[0],
        "hora": datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3],
        "metodo": metodo,
        "ruta": url[len(BASE):],
        "como": quien.get(token, "token adulterado" if token else "sin token"),
        "envio": ocultar(cuerpo),
        "cabeceras": sorted(k for k in (cabeceras or {})),
        "status": status,
        "ms": ms,
        "respuesta": ocultar(js) if js is not None else texto[:300],
    })
    return Respuesta(status, js, texto, ms)


def reg(id_caso, ok, obtenido, ms=None, resultado=None):
    """Registra el resultado de un caso y lo muestra en pantalla."""
    if resultado is None:
        if ok:
            resultado = "OK"
        elif id_caso in DEFECTOS_CONOCIDOS:
            resultado = "FALLA (%s, defecto conocido)" % DEFECTOS_CONOCIDOS[id_caso]
        else:
            resultado = "FALLA"
    RESULTADOS[id_caso] = {"obtenido": obtenido, "ms": ms, "resultado": resultado}
    marca = {"OK": "OK     "}.get(resultado, "FALLA  " if resultado.startswith("FALLA") else "------ ")
    print("  %s%-11s %s -> %s%s" % (marca, id_caso, INFO[id_caso][3], obtenido, "" if ms is None else "  (%d ms)" % ms))


def caso(id_caso):
    caso_actual[0] = id_caso


def estado_bahia(admin, id_bahia):
    r = api("GET", "/api/v1/bahias/%s" % id_bahia, admin)
    return r.campo("idEstado")


def nom(estado):
    return NOMBRE_ESTADO.get(estado, str(estado))


def instante(valor):
    """Convierte una fecha de la API (texto ISO-8601 o numero) a datetime UTC."""
    if valor is None:
        return None
    if isinstance(valor, (int, float)):
        return datetime.datetime(1970, 1, 1) + datetime.timedelta(seconds=valor)
    m = re.match(r"(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d+))?", str(valor))
    if not m:
        return None
    base = datetime.datetime.strptime(m.group(1), "%Y-%m-%dT%H:%M:%S")
    frac = (m.group(2) or "0")[:6].ljust(6, "0")
    return base + datetime.timedelta(microseconds=int(frac))


def deshacer_reserva(r, token):
    """Si una reserva que debia rechazarse se creo, la cancela para no alterar los casos siguientes."""
    if r.status == 201 and r.campo("idReserva") is not None:
        previo = caso_actual[0]
        caso("PREPARACION")
        api("PUT", "/api/v1/reservas/%s/cancelar" % r.campo("idReserva"), token)
        caso(previo)


def login(email, clave):
    return api("POST", "/api/v1/auth/login", cuerpo={"emailInstitucional": email, "passwordPrototipo": clave})


# ------------------------------------------------------------------------------
# Credenciales (no se imprimen)
# ------------------------------------------------------------------------------
def credenciales_admin():
    email, clave = os.environ.get("OMNIDOCK_ADMIN_EMAIL"), os.environ.get("OMNIDOCK_ADMIN_PASSWORD")
    if email and clave:
        return email, clave, "variables de entorno"
    if SEED.exists():
        patron = re.compile(r"INSERT INTO USUARIO.*?VALUES\s*\(\s*'[^']*',\s*'[^']*',\s*'([^']*)',\s*'([^']*)',\s*(\d+)\s*\)", re.I)
        for linea in SEED.read_text(encoding="utf-8", errors="replace").splitlines():
            m = patron.search(linea)
            if m and m.group(3) == "1":
                return m.group(1), m.group(2), "database/02_insert.sql"
    return None, None, None


def llave_iot():
    if os.environ.get("IOT_API_KEY"):
        return os.environ["IOT_API_KEY"]
    if YML.exists():
        m = re.search(r"api-key:\s*\$\{IOT_API_KEY:([^}]*)\}", YML.read_text(encoding="utf-8", errors="replace"))
        if m and m.group(1).strip():
            return m.group(1).strip()
    return None


# ------------------------------------------------------------------------------
# Ejecucion de los casos
# ------------------------------------------------------------------------------
def ejecutar(args):
    corrida = time.strftime("%m%d%H%M%S")
    ctx = {"corrida": corrida, "mock": False}

    def rut():
        return "%d-%d" % (random.randint(10000000, 99999999), random.randint(0, 9))

    def mac():
        return "0A:" + ":".join("%02X" % random.randint(0, 255) for _ in range(5))

    # ---------------- Autenticacion (1) ----------------
    print("\nAutenticación")
    email_admin, clave_admin, origen = credenciales_admin()
    if not email_admin:
        sys.exit("No encontre las credenciales del administrador. Define OMNIDOCK_ADMIN_EMAIL y "
                 "OMNIDOCK_ADMIN_PASSWORD, o revisa que exista database/02_insert.sql.")
    caso("S2-AUTH-01")
    r = login(email_admin, clave_admin)
    usuario = r.campo("usuario") or {}
    admin = r.campo("token")
    quien[admin] = "administrador"
    ok = r.status == 200 and bool(admin) and usuario.get("idRol") == 1 and "passwordPrototipo" not in usuario
    reg("S2-AUTH-01", ok, "%s; idRol=%s; %s la contraseña" % (r.status, usuario.get("idRol"),
        "no expone" if "passwordPrototipo" not in usuario else "EXPONE"), r.ms)
    if not admin:
        sys.exit("\nNo pude iniciar sesion como administrador (%s, credenciales tomadas de %s).\n"
                 "Si la clave cambio, define OMNIDOCK_ADMIN_EMAIL y OMNIDOCK_ADMIN_PASSWORD y vuelve a ejecutar."
                 % (r.breve(), origen))
    id_admin = usuario.get("idUsuario")

    # ---------------- Preparacion: usuarios de prueba ----------------
    caso("PREPARACION")
    usuarios = {}
    for letra, rol in (("A", 2), ("B", 2), ("COLAB", 3)):
        u = {"rut": rut(), "email": "qa.%s.%s@duocuc.cl" % (letra.lower(), corrida), "clave": secrets.token_urlsafe(12), "rol": rol}
        r = api("POST", "/api/v1/usuarios", admin, {
            "rut": u["rut"], "nombreCompleto": "QA Regresion %s (ignorar)" % letra,
            "emailInstitucional": u["email"], "passwordPrototipo": u["clave"], "idRol": rol})
        if r.status != 201:
            sys.exit("\nNo pude crear el usuario de prueba %s: %s. Sin el no se puede seguir." % (letra, r.breve()))
        u["id"] = r.campo("idUsuario")
        usuarios[letra] = u
        CREADOS.append("Usuario \"QA Regresion %s (ignorar)\", ID %s" % (letra, u["id"]))
    A, B, COLAB = usuarios["A"], usuarios["B"], usuarios["COLAB"]

    caso("S2-AUTH-02")
    r = login(A["email"], A["clave"])
    A["token"] = r.campo("token")
    quien[A["token"]] = "usuario A"
    reg("S2-AUTH-02", r.status == 200 and bool(A["token"]) and (r.campo("usuario") or {}).get("idRol") == 2,
        "%s; idRol=%s" % (r.status, (r.campo("usuario") or {}).get("idRol")), r.ms)
    caso("PREPARACION")
    for u, etiqueta in ((B, "usuario B"), (COLAB, "colaborador")):
        u["token"] = login(u["email"], u["clave"]).campo("token")
        quien[u["token"]] = etiqueta
    if not (A["token"] and B["token"] and COLAB["token"]):
        sys.exit("\nLos usuarios de prueba no pudieron iniciar sesion. Sin ellos no se puede seguir.")
    # Sprint 4: fuera del horario de reservas casi todos los casos de reservas fallarian
    horario = (api("GET", "/api/v1/mi-estado", A["token"]).campo("horario") or {})
    if horario and not horario.get("reservasAbiertas", True):
        for u in (A, B, COLAB):
            api("DELETE", "/api/v1/usuarios/%s" % u["id"], admin)
        sys.exit("\nAhora el backend no acepta reservas: %s\nPara correr la regresion a cualquier hora, levanta el backend con "
                 "HORARIO_ACTIVO=false." % horario.get("mensaje", "fuera de horario"))

    caso("S2-AUTH-03")
    r3 = login(A["email"], "clave-incorrecta-" + corrida)
    reg("S2-AUTH-03", r3.status == 401, r3.breve(), r3.ms)
    caso("S2-AUTH-04")
    r = login("no.existe.%s@duocuc.cl" % corrida, "x")
    reg("S2-AUTH-04", r.status == 401 and r.mensaje == r3.mensaje, r.breve(), r.ms)
    caso("S2-AUTH-05")
    r = api("POST", "/api/v1/auth/login", cuerpo={})
    reg("S2-AUTH-05", r.status == 400, r.breve(), r.ms)
    caso("S2-AUTH-06")
    r = api("GET", "/api/v1/auth/me")
    reg("S2-AUTH-06", r.status == 401, r.breve(), r.ms)
    caso("S2-AUTH-07")
    t = A["token"]
    adulterado = t[:-10] + ("A" if t[-10] != "A" else "B") + t[-9:]
    r = api("GET", "/api/v1/auth/me", adulterado)
    reg("S2-AUTH-07", r.status == 401, r.breve(), r.ms)
    caso("S2-AUTH-08")
    r = api("GET", "/api/v1/auth/me", A["token"])
    reg("S2-AUTH-08", r.status == 200 and r.campo("idUsuario") == A["id"], "%s, usuario %s" % (r.status, r.campo("idUsuario")), r.ms)
    caso("S2-AUTH-09")
    r = login(A["email"].upper(), A["clave"])
    reg("S2-AUTH-09", r.status == 200, r.breve(), r.ms)

    # ---------------- Roles y permisos ----------------
    print("\nRoles y permisos")
    pruebas = [
        ("S2-RBAC-01", "GET", "/api/v1/usuarios", A, None),
        ("S2-RBAC-02", "POST", "/api/v1/bahias", A, {"codigoIot": "QA-%s-NO" % corrida, "ubicacion": "QA", "idTipoPermitido": 1}),
        ("S2-RBAC-03", "GET", "/api/v1/analitica/embed-token", A, None),
        ("S2-RBAC-04", "GET", "/api/v1/tickets", A, None),
        ("S2-RBAC-05", "GET", "/api/v1/vehiculos/usuario/%s" % B["id"], A, None),
        ("S2-RBAC-06", "GET", "/api/v1/transacciones/usuario/%s" % B["id"], A, None),
        ("S2-RBAC-07", "GET", "/api/v1/reservas/usuario/%s" % B["id"], A, None),
        ("S2-RBAC-08", "GET", "/api/v1/usuarios", COLAB, None),
    ]
    for id_caso, metodo, ruta, u, cuerpo in pruebas:
        caso(id_caso)
        r = api(metodo, ruta, u["token"], cuerpo)
        reg(id_caso, r.status == 403, r.breve(), r.ms)
    caso("S2-RBAC-09")
    r = api("GET", "/api/v1/usuarios", admin)
    lista = r.cuerpo if isinstance(r.cuerpo, list) else []
    sin_clave = all("passwordPrototipo" not in x for x in lista)
    reg("S2-RBAC-09", r.status == 200 and len(lista) > 0 and sin_clave,
        "%s, %d usuarios, %s contraseña" % (r.status, len(lista), "sin" if sin_clave else "CON"), r.ms)
    caso("S2-RBAC-10")
    r = api("PUT", "/api/v1/usuarios/%s" % A["id"], A["token"], {"idRol": 1})
    reg("S2-RBAC-10", r.status == 403, r.breve(), r.ms)

    # ---------------- Bahias ----------------
    print("\nBahías")
    ubic = "QA Patio %s" % corrida
    b1 = {"codigo": "QA-%s-B1" % corrida, "mac": mac()}
    b2 = {"codigo": "QA-%s-B2" % corrida, "mac": mac()}
    caso("S2-BAH-01")
    r = api("GET", "/api/v1/bahias", A["token"])
    lista = r.cuerpo if isinstance(r.cuerpo, list) else []
    reg("S2-BAH-01", r.status == 200 and all("idEstado" in x for x in lista), "%s, %d bahías" % (r.status, len(lista)), r.ms)
    caso("S2-BAH-06")
    r = api("POST", "/api/v1/bahias", admin, {"codigoIot": b1["codigo"], "ubicacion": ubic, "idEstado": 1, "idTipoPermitido": 1, "direccionMac": b1["mac"]})
    b1["id"] = r.campo("idBahia")
    reg("S2-BAH-06", r.status == 201 and b1["id"] is not None, "%s, idBahia=%s" % (r.status, b1["id"]), r.ms)
    caso("PREPARACION")
    r = api("POST", "/api/v1/bahias", admin, {"codigoIot": b2["codigo"], "ubicacion": ubic, "idEstado": 1, "idTipoPermitido": 2, "direccionMac": b2["mac"]})
    b2["id"] = r.campo("idBahia")
    if b1["id"] is None or b2["id"] is None:
        sys.exit("\nNo pude crear las bahias de prueba (%s). Sin ellas no se puede seguir." % r.breve())
    CREADOS.append("Bahía %s (bicicleta), ID %s, con dispositivo IoT" % (b1["codigo"], b1["id"]))
    CREADOS.append("Bahía %s (scooter), ID %s, con dispositivo IoT" % (b2["codigo"], b2["id"]))
    caso("S2-BAH-07")
    r = api("POST", "/api/v1/bahias", admin, {"codigoIot": b1["codigo"], "ubicacion": ubic, "idTipoPermitido": 1})
    reg("S2-BAH-07", r.status == 409, r.breve(), r.ms)
    caso("S2-BAH-08")
    r = api("POST", "/api/v1/bahias", admin, {"codigoIot": "QA-%s-B9" % corrida, "ubicacion": ubic, "idTipoPermitido": 999})
    reg("S2-BAH-08", r.status == 400, r.breve(), r.ms)
    caso("S2-BAH-02")
    r = api("GET", "/api/v1/bahias", A["token"], params={"idEstado": 1, "idTipoPermitido": 1})
    lista = r.cuerpo if isinstance(r.cuerpo, list) else []
    ok = r.status == 200 and all(x.get("idEstado") == 1 and x.get("idTipoPermitido") == 1 for x in lista) \
        and any(x.get("idBahia") == b1["id"] for x in lista)
    reg("S2-BAH-02", ok, "%s, %d bahías: %s" % (r.status, len(lista), ", ".join(str(x.get("codigoIot")) for x in lista[:6])), r.ms)
    caso("S2-BAH-03")
    r = api("GET", "/api/v1/bahias", A["token"], params={"ubicacion": ubic.lower()})
    lista = r.cuerpo if isinstance(r.cuerpo, list) else []
    ok = r.status == 200 and sorted(x.get("idBahia") for x in lista) == sorted([b1["id"], b2["id"]])
    reg("S2-BAH-03", ok, "%s: %s" % (r.status, ", ".join(str(x.get("codigoIot")) for x in lista[:6])), r.ms)
    caso("S2-BAH-04")
    r = api("GET", "/api/v1/bahias/codigo/%s" % b1["codigo"], A["token"])
    reg("S2-BAH-04", r.status == 200 and r.campo("idBahia") == b1["id"], "%s, idBahia=%s" % (r.status, r.campo("idBahia")), r.ms)
    caso("S2-BAH-05")
    r = api("GET", "/api/v1/bahias/codigo/QA-%s-NOEXISTE" % corrida, A["token"])
    reg("S2-BAH-05", r.status == 404 and bool(r.mensaje), r.breve(), r.ms)
    caso("S2-BAH-09")
    r = api("PUT", "/api/v1/bahias/%s" % b1["id"], admin, {"ubicacion": ubic + " - Norte"})
    leido = api("GET", "/api/v1/bahias/%s" % b1["id"], admin).campo("ubicacion")
    reg("S2-BAH-09", r.status == 200 and leido == ubic + " - Norte", "%s; ubicación \"%s\"" % (r.status, leido), r.ms)
    caso("S2-BAH-10")
    r = api("PUT", "/api/v1/bahias/%s" % b1["id"], admin, {"idEstado": 9})
    reg("S2-BAH-10", r.status == 400, r.breve(), r.ms)
    caso("S2-BAH-13")
    r = api("PUT", "/api/v1/bahias/%s" % b1["id"], admin, {"idEstado": FUERA_DE_SERVICIO})
    e = estado_bahia(admin, b1["id"])
    reg("S2-BAH-13", r.status == 200 and e == FUERA_DE_SERVICIO, "%s; bahía %s" % (r.breve(), nom(e)), r.ms)
    caso("S2-BAH-11")
    r = api("PUT", "/api/v1/bahias/%s" % b1["id"], admin, {"idEstado": DISPONIBLE})
    e = estado_bahia(admin, b1["id"])
    reg("S2-BAH-11", r.status == 200 and e == DISPONIBLE, "%s; bahía %s" % (r.breve(), nom(e)), r.ms)
    if e != DISPONIBLE:
        sys.exit("\nLa bahia de prueba no quedo DISPONIBLE; los casos de reserva dependen de ella. Revisa las fallas de arriba.")

    # ---------------- Vehiculos ----------------
    print("\nVehículos")
    caso("S2-VEH-01")
    r = api("POST", "/api/v1/vehiculos", A["token"], {"idTipoVehiculo": 1, "identificador": "QA Bicicleta A %s" % corrida})
    bici_a = r.campo("idVehiculo")
    reg("S2-VEH-01", r.status == 201 and bici_a is not None, "%s, idVehiculo=%s" % (r.status, bici_a), r.ms)
    caso("PREPARACION")
    scooter_a = api("POST", "/api/v1/vehiculos", A["token"], {"idTipoVehiculo": 2, "identificador": "QA Scooter A %s" % corrida}).campo("idVehiculo")
    temporal_a = api("POST", "/api/v1/vehiculos", A["token"], {"idTipoVehiculo": 1, "identificador": "QA Temporal A %s" % corrida}).campo("idVehiculo")
    bici_b = api("POST", "/api/v1/vehiculos", B["token"], {"idTipoVehiculo": 1, "identificador": "QA Bicicleta B %s" % corrida}).campo("idVehiculo")
    if None in (bici_a, scooter_a, temporal_a, bici_b):
        sys.exit("\nNo pude crear los vehiculos de prueba. Sin ellos no se puede seguir.")
    CREADOS.append("Vehículos de prueba %s, %s y %s (usuario A) y %s (usuario B)" % (bici_a, scooter_a, temporal_a, bici_b))
    caso("S2-VEH-02")
    r = api("POST", "/api/v1/vehiculos", A["token"], {"idTipoVehiculo": 999, "identificador": "QA tipo malo"})
    reg("S2-VEH-02", r.status == 400, r.breve(), r.ms)
    caso("S2-VEH-03")
    r = api("POST", "/api/v1/vehiculos", A["token"], {"idTipoVehiculo": 1})
    reg("S2-VEH-03", r.status == 400, r.breve(), r.ms)
    caso("S2-VEH-04")
    r = api("GET", "/api/v1/vehiculos/usuario/%s" % A["id"], A["token"])
    lista = r.cuerpo if isinstance(r.cuerpo, list) else []
    reg("S2-VEH-04", r.status == 200 and any(x.get("idVehiculo") == bici_a for x in lista), "%s, %d vehículos" % (r.status, len(lista)), r.ms)
    caso("S2-VEH-05")
    r = api("DELETE", "/api/v1/vehiculos/%s" % bici_a, B["token"])
    reg("S2-VEH-05", r.status == 403, r.breve(), r.ms)
    caso("S2-VEH-06")
    r = api("DELETE", "/api/v1/vehiculos/%s" % temporal_a, A["token"])
    lista = api("GET", "/api/v1/vehiculos/usuario/%s" % A["id"], A["token"]).cuerpo or []
    listado = any(x.get("idVehiculo") == temporal_a for x in lista)
    reg("S2-VEH-06", r.status == 204 and not listado, "%s; %s" % (r.status, "sigue listado" if listado else "ya no se lista"), r.ms)
    caso("S2-VEH-07")
    r = api("POST", "/api/v1/reservas", A["token"], {"idBahia": b1["id"], "idVehiculo": temporal_a})
    reg("S2-VEH-07", r.status == 400, r.breve(), r.ms)
    deshacer_reserva(r, A["token"])

    # ---------------- Reservas ----------------
    print("\nReservas")
    caso("S2-RES-01")
    r = api("POST", "/api/v1/reservas", A["token"], {"idBahia": b1["id"], "idVehiculo": scooter_a})
    reg("S2-RES-01", r.status == 409, r.breve(), r.ms)
    deshacer_reserva(r, A["token"])
    caso("S2-RES-02")
    r = api("POST", "/api/v1/reservas", A["token"], {"idBahia": b1["id"], "idVehiculo": bici_b})
    reg("S2-RES-02", r.status == 400, r.breve(), r.ms)
    deshacer_reserva(r, A["token"])
    caso("S2-RES-03")
    r = api("POST", "/api/v1/reservas", A["token"], {"idBahia": INEXISTENTE, "idVehiculo": bici_a})
    reg("S2-RES-03", r.status == 404, r.breve(), r.ms)
    deshacer_reserva(r, A["token"])

    caso("S2-RES-05")
    salida, barrera = {}, threading.Barrier(2)

    def reservar(clave, u, vehiculo):
        barrera.wait()
        try:
            salida[clave] = api("POST", "/api/v1/reservas", u["token"], {"idBahia": b1["id"], "idVehiculo": vehiculo})
        except SinConexion as ex:
            salida[clave] = ex
    hilos = [threading.Thread(target=reservar, args=("A", A, bici_a)), threading.Thread(target=reservar, args=("B", B, bici_b))]
    for h in hilos:
        h.start()
    for h in hilos:
        h.join()
    for v in salida.values():
        if isinstance(v, SinConexion):
            raise v
    codigos = sorted(salida[k].status for k in ("A", "B"))
    e = estado_bahia(admin, b1["id"])
    reg("S2-RES-05", codigos == [201, 409] and e == RESERVADA, "%s y %s; bahía %s" % (codigos[0], codigos[1], nom(e)),
        max(salida["A"].ms, salida["B"].ms))
    ganador, reserva_ganadora = None, None
    for clave, u in (("A", A), ("B", B)):
        if salida[clave].status == 201:
            ganador, reserva_ganadora = u, salida[clave].campo("idReserva")
            CREADOS.append("Reserva %s (cancelada)" % reserva_ganadora)
    # Si las dos se crearon (falla de concurrencia), se cancelan ambas para poder seguir.
    caso("S2-RES-06")
    if ganador:
        r = api("PUT", "/api/v1/reservas/%s/cancelar" % reserva_ganadora, ganador["token"])
        e = estado_bahia(admin, b1["id"])
        reg("S2-RES-06", r.status == 200 and r.campo("estadoReserva") == "CANCELADA" and e == DISPONIBLE,
            "%s %s; bahía %s" % (r.status, r.campo("estadoReserva"), nom(e)), r.ms)
        caso("S2-RES-07")
        r = api("PUT", "/api/v1/reservas/%s/cancelar" % reserva_ganadora, ganador["token"])
        reg("S2-RES-07", r.status == 409, r.breve(), r.ms)
        caso("PREPARACION")
        for clave, u in (("A", A), ("B", B)):
            if salida[clave].status == 201 and u is not ganador:
                api("PUT", "/api/v1/reservas/%s/cancelar" % salida[clave].campo("idReserva"), u["token"])
    else:
        reg("S2-RES-06", False, "No se creó ninguna reserva en el caso anterior")
        reg("S2-RES-07", False, "No se creó ninguna reserva en el caso anterior")

    caso("S2-RES-08")
    r = api("POST", "/api/v1/reservas", A["token"], {"idBahia": b1["id"], "idVehiculo": bici_a})
    reserva = r.campo("idReserva")
    ini, fin = instante(r.campo("fechaSolicitud")), instante(r.campo("fechaExpiracion"))
    minutos = round((fin - ini).total_seconds() / 60.0, 1) if ini and fin else None
    e = estado_bahia(admin, b1["id"])
    ok = r.status == 201 and r.campo("estadoReserva") == "PENDIENTE" and minutos == float(args.reserva_min) and e == RESERVADA
    reg("S2-RES-08", ok, "%s %s; ventana de %s min; bahía %s" % (r.status, r.campo("estadoReserva"),
        ("%g" % minutos) if minutos is not None else "?", nom(e)), r.ms)
    if reserva is None:
        print("\n  No se pudo crear la reserva válida: se omiten los casos que dependen de ella.")
    else:
        CREADOS.append("Reserva %s del usuario A (concretada)" % reserva)
        caso("S2-RES-04")
        r = api("POST", "/api/v1/reservas", B["token"], {"idBahia": b1["id"], "idVehiculo": bici_b})
        reg("S2-RES-04", r.status == 409, r.breve(), r.ms)
        deshacer_reserva(r, B["token"])
        caso("S2-RES-09")
        r = api("POST", "/api/v1/reservas", A["token"], {"idBahia": b1["id"], "idVehiculo": bici_a})
        reg("S2-RES-09", r.status == 409, r.breve(), r.ms)
        deshacer_reserva(r, A["token"])
        caso("S2-RES-10")
        r = api("GET", "/api/v1/reservas/usuario/%s" % A["id"], A["token"])
        lista = r.cuerpo if isinstance(r.cuerpo, list) else []
        reg("S2-RES-10", r.status == 200 and [x.get("idReserva") for x in lista] == [reserva], "%s con %d" % (r.status, len(lista)), r.ms)
        caso("S2-RES-11")
        r = api("PUT", "/api/v1/reservas/%s/cancelar" % reserva, B["token"])
        reg("S2-RES-11", r.status == 403, r.breve(), r.ms)
        caso("S2-RES-12")
        r = api("DELETE", "/api/v1/reservas/%s" % reserva, admin)
        sigue = any(x.get("idReserva") == reserva for x in (api("GET", "/api/v1/reservas/usuario/%s" % A["id"], admin).cuerpo or []))
        reg("S2-RES-12", r.status in (404, 405) and sigue, "%s; la reserva %s" % (r.status, "sigue" if sigue else "YA NO ESTÁ"), r.ms)

        # ---------------- Check-in, check-out, historial ----------------
        print("\nCheck-in, check-out e historial")
        caso("S2-TX-01")
        r = api("POST", "/api/v1/transacciones/iniciar", B["token"], {"idReserva": reserva})
        reg("S2-TX-01", r.status == 403, r.breve(), r.ms)
        caso("S2-TX-02")
        r = api("POST", "/api/v1/transacciones/iniciar", A["token"], {"idReserva": INEXISTENTE})
        reg("S2-TX-02", r.status == 404, r.breve(), r.ms)
        caso("S2-TX-03")
        r = api("POST", "/api/v1/transacciones/iniciar", A["token"], {})
        reg("S2-TX-03", r.status == 400, r.breve(), r.ms)
        caso("S2-TX-04")
        r = api("POST", "/api/v1/transacciones/iniciar", A["token"], {"idReserva": reserva, "idBahia": b2["id"]})
        e = estado_bahia(admin, b1["id"])
        reg("S2-TX-04", r.status == 409 and e == RESERVADA, "%s; bahía %s" % (r.breve(), nom(e)), r.ms)
        caso("S2-TX-05")
        r = api("POST", "/api/v1/transacciones/iniciar", A["token"], {"idReserva": reserva, "idBahia": b1["id"], "idVehiculo": bici_a})
        uso = r.campo("idTransaccion")
        e = estado_bahia(admin, b1["id"])
        pendientes = api("GET", "/api/v1/reservas/usuario/%s" % A["id"], A["token"]).cuerpo
        ok = r.status == 200 and r.campo("estadoTransaccion") == "ACTIVA" and r.ms < 2000 and e == OCUPADA and pendientes == []
        reg("S2-TX-05", ok, "%s %s en %d ms; bahía %s; %s reservas pendientes" % (
            r.breve(), r.campo("estadoTransaccion") or "", r.ms, nom(e),
            "sin" if pendientes == [] else "CON"), r.ms)
        if uso is None:
            print("\n  El check-in no funcionó: se omiten los casos que dependen de él."
                  + ("" if ctx["mock"] else " Revisa que el backend esté levantado con el perfil \"mock\"."))
        else:
            CREADOS.append("Uso %s del usuario A en la bahía %s (finalizado)" % (uso, b1["id"]))
            caso("S2-TX-06")
            r = api("POST", "/api/v1/transacciones/iniciar", A["token"], {"idReserva": reserva})
            reg("S2-TX-06", r.status == 409, r.breve(), r.ms)
            caso("S2-TX-07")
            r = api("PUT", "/api/v1/reservas/%s/cancelar" % reserva, A["token"])
            reg("S2-TX-07", r.status == 409, r.breve(), r.ms)
            caso("S2-TX-08")
            r = api("POST", "/api/v1/reservas", B["token"], {"idBahia": b1["id"], "idVehiculo": bici_b})
            reg("S2-TX-08", r.status == 409, r.breve(), r.ms)
            deshacer_reserva(r, B["token"])
            caso("S2-TX-09")
            r = api("POST", "/api/v1/transacciones/%s/finalizar" % uso, B["token"])
            reg("S2-TX-09", r.status == 403, r.breve(), r.ms)
            caso("S2-TX-10")
            r = api("POST", "/api/v1/transacciones/%s/finalizar" % uso, A["token"])
            t_ini, t_fin = instante(r.campo("fechaInicio")), instante(r.campo("fechaFin"))
            e = estado_bahia(admin, b1["id"])
            ok = r.status == 200 and r.campo("estadoTransaccion") == "FINALIZADA" and t_ini is not None and t_fin is not None \
                and t_fin >= t_ini and e == DISPONIBLE
            reg("S2-TX-10", ok, "%s %s; bahía %s" % (r.breve(), r.campo("estadoTransaccion") or "", nom(e)), r.ms)
            caso("S2-TX-11")
            r = api("POST", "/api/v1/transacciones/%s/finalizar" % uso, A["token"])
            reg("S2-TX-11", r.status == 409, r.breve(), r.ms)
            caso("S2-TX-12")
            r = api("GET", "/api/v1/transacciones/usuario/%s" % A["id"], A["token"])
            lista = r.cuerpo if isinstance(r.cuerpo, list) else []
            p = lista[0] if lista else {}
            ok = r.status == 200 and p.get("idTransaccion") == uso and p.get("codigoIot") == b1["codigo"] \
                and bool(p.get("ubicacion")) and bool(p.get("vehiculo")) and p.get("minutos") is not None
            reg("S2-TX-12", ok, "%s: %s, %s, %s, %s min" % (r.status, p.get("codigoIot"), p.get("ubicacion"), p.get("vehiculo"), p.get("minutos")), r.ms)
            caso("S2-TX-13")
            r = api("DELETE", "/api/v1/transacciones/%s" % uso, admin)
            sigue = any(x.get("idTransaccion") == uso for x in (api("GET", "/api/v1/transacciones/usuario/%s" % A["id"], admin).cuerpo or []))
            reg("S2-TX-13", r.status in (404, 405) and sigue, "%s; el uso %s" % (r.status, "sigue" if sigue else "YA NO ESTÁ"), r.ms)

    # Los casos de tickets parten con la bahia DISPONIBLE.
    caso("PREPARACION")
    if estado_bahia(admin, b1["id"]) != DISPONIBLE:
        for x in (api("GET", "/api/v1/reservas/usuario/%s" % A["id"], admin).cuerpo or []):
            api("PUT", "/api/v1/reservas/%s/cancelar" % x.get("idReserva"), admin)
        api("PUT", "/api/v1/bahias/%s" % b1["id"], admin, {"idEstado": DISPONIBLE})

    # ---------------- Tickets ----------------
    print("\nTickets de mantención")

    def ticket(id_ticket):
        for x in (api("GET", "/api/v1/tickets", admin).cuerpo or []):
            if x.get("idTicket") == id_ticket:
                return x
        return {}
    caso("S2-TKT-01")
    r = api("POST", "/api/v1/tickets", A["token"], {"idBahia": b1["id"], "descripcionFalla": "QA regresion %s: candado de prueba trabado" % corrida})
    t1 = r.campo("idTicket")
    e = estado_bahia(admin, b1["id"])
    reg("S2-TKT-01", r.status == 201 and t1 is not None and e == FUERA_DE_SERVICIO, "%s; bahía %s" % (r.breve(), nom(e)), r.ms)
    caso("S2-TKT-03")
    r = api("POST", "/api/v1/tickets", A["token"], {"idBahia": b1["id"]})
    reg("S2-TKT-03", r.status == 400, r.breve(), r.ms)
    caso("S2-TKT-06")
    r = api("PUT", "/api/v1/tickets/%s" % INEXISTENTE, admin, {"estadoTicket": "EN_REVISION"})
    reg("S2-TKT-06", r.status == 404, r.breve(), r.ms)
    if t1 is None:
        print("\n  No se pudo crear el ticket: se omiten los casos que dependen de él.")
    else:
        CREADOS.append("Ticket %s sobre la bahía %s (resuelto)" % (t1, b1["id"]))
        caso("S2-TKT-07")
        r = api("GET", "/api/v1/tickets", admin, params={"estado": "ABIERTO"})
        lista = r.cuerpo if isinstance(r.cuerpo, list) else []
        ok = r.status == 200 and any(x.get("idTicket") == t1 for x in lista) and all(x.get("estadoTicket") == "ABIERTO" for x in lista)
        reg("S2-TKT-07", ok, "%s, %d tickets abiertos" % (r.status, len(lista)), r.ms)
        caso("S2-TKT-05")
        r = api("PUT", "/api/v1/tickets/%s" % t1, admin, {"estadoTicket": "EN_REVISION"})
        est, e = ticket(t1).get("estadoTicket"), estado_bahia(admin, b1["id"])
        reg("S2-TKT-05", r.status == 200 and est == "EN_REVISION" and e == FUERA_DE_SERVICIO, "%s; ticket %s; bahía %s" % (r.breve(), est, nom(e)), r.ms)
        caso("S2-TKT-04")
        r = api("PUT", "/api/v1/tickets/%s" % t1, admin, {"estadoTicket": "INVENTADO"})
        reg("S2-TKT-04", r.status == 400, r.breve(), r.ms)
        caso("S2-TKT-08")
        r = api("PUT", "/api/v1/tickets/%s" % t1, admin, {"estadoTicket": "RESUELTO"})
        tk, e = ticket(t1), estado_bahia(admin, b1["id"])
        ok = r.status == 200 and tk.get("estadoTicket") == "RESUELTO" and tk.get("fechaResolucion") is not None and e == DISPONIBLE
        reg("S2-TKT-08", ok, "%s; ticket %s, %s fecha de resolución; bahía %s" % (r.breve(), tk.get("estadoTicket"),
            "con" if tk.get("fechaResolucion") is not None else "SIN", nom(e)), r.ms)
        caso("S2-TKT-02")
        r = api("POST", "/api/v1/tickets", admin, {"idBahia": b1["id"], "descripcionFalla": "QA regresion %s: ticket para anular" % corrida})
        t2 = r.campo("idTicket")
        e = estado_bahia(admin, b1["id"])
        reg("S2-TKT-02", r.status == 201 and t2 is not None and e == FUERA_DE_SERVICIO, "%s; bahía %s" % (r.breve(), nom(e)), r.ms)
        caso("S2-TKT-09")
        r = api("POST", "/api/v1/tickets", admin, {"idBahia": INEXISTENTE, "descripcionFalla": "QA bahia inexistente"})
        reg("S2-TKT-09", r.status == 404, r.breve(), r.ms)
        if t2 is not None:
            CREADOS.append("Ticket %s sobre la bahía %s (anulado)" % (t2, b1["id"]))
            caso("S2-TKT-10")
            r = api("DELETE", "/api/v1/tickets/%s" % t2, admin)
            est, e = ticket(t2).get("estadoTicket"), estado_bahia(admin, b1["id"])
            reg("S2-TKT-10", r.status == 204 and est == "ANULADO" and e == DISPONIBLE, "%s; ticket %s; bahía %s" % (r.status, est, nom(e)), r.ms)

    # ---------------- Usuarios ----------------
    print("\nUsuarios")
    C = {"rut": rut(), "email": "qa.c.%s@duocuc.cl" % corrida, "clave": secrets.token_urlsafe(12)}
    nuevo = {"rut": C["rut"], "nombreCompleto": "QA Regresion C (ignorar)", "emailInstitucional": C["email"],
             "passwordPrototipo": C["clave"], "idRol": 2}
    caso("S2-USR-01")
    r = api("POST", "/api/v1/usuarios", admin, nuevo)
    C["id"] = r.campo("idUsuario")
    reg("S2-USR-01", r.status == 201 and C["id"] is not None, "%s, idUsuario=%s" % (r.status, C["id"]), r.ms)
    caso("S2-USR-02")
    r = api("POST", "/api/v1/usuarios", admin, dict(nuevo, emailInstitucional="qa.c2.%s@duocuc.cl" % corrida))
    reg("S2-USR-02", r.status == 409, r.breve(), r.ms)
    caso("S2-USR-03")
    r = api("POST", "/api/v1/usuarios", admin, dict(nuevo, rut=rut(), emailInstitucional=C["email"].upper()))
    reg("S2-USR-03", r.status == 409, r.breve(), r.ms)
    caso("S2-USR-04")
    r = api("POST", "/api/v1/usuarios", admin, dict(nuevo, rut=rut(), emailInstitucional="qa.c4.%s@duocuc.cl" % corrida, idRol=9))
    reg("S2-USR-04", r.status == 400, r.breve(), r.ms)
    caso("S2-USR-05")
    r = api("POST", "/api/v1/usuarios", admin, dict(nuevo, rut=rut(), emailInstitucional="no-es-un-correo"))
    reg("S2-USR-05", r.status == 400, r.breve(), r.ms)
    caso("S2-USR-13")
    r = api("PUT", "/api/v1/usuarios/%s" % INEXISTENTE, admin, {"nombreCompleto": "QA no existe"})
    reg("S2-USR-13", r.status == 404, r.breve(), r.ms)
    caso("S2-USR-12")
    r = api("DELETE", "/api/v1/usuarios/%s" % id_admin, admin)
    sigue = api("GET", "/api/v1/auth/me", admin).campo("estadoSincronizacion")
    reg("S2-USR-12", r.status == 409 and sigue == "VIGENTE", "%s; el administrador sigue %s" % (r.breve(), sigue), r.ms)
    if C["id"] is None:
        print("\n  No se pudo crear el usuario: se omiten los casos que dependen de él.")
    else:
        CREADOS.append("Usuario \"QA Regresion C (ignorar)\", ID %s" % C["id"])

        def estado_usuario(id_usuario):
            for x in (api("GET", "/api/v1/usuarios", admin).cuerpo or []):
                if x.get("idUsuario") == id_usuario:
                    return x.get("estadoSincronizacion")
            return None
        caso("S2-USR-06")
        r = login(C["email"], C["clave"])
        C["token"] = r.campo("token")
        quien[C["token"]] = "usuario C"
        reg("S2-USR-06", r.status == 200 and (r.campo("usuario") or {}).get("idRol") == 2,
            "%s, idRol=%s" % (r.status, (r.campo("usuario") or {}).get("idRol")), r.ms)
        caso("S2-USR-07")
        r = api("PUT", "/api/v1/usuarios/%s" % C["id"], admin, {"estadoSincronizacion": "BLOQUEADO"})
        r2 = login(C["email"], C["clave"])
        reg("S2-USR-07", r.status == 200 and r2.status == 403, "bloqueo %s; login %s" % (r.status, r2.breve()), r2.ms)
        caso("S2-USR-08")
        if C["token"]:
            r = api("GET", "/api/v1/auth/me", C["token"])
            reg("S2-USR-08", r.status in (401, 403), "%s%s" % (r.status, "; el token sigue aceptado" if r.status == 200 else ""), r.ms)
        caso("S2-USR-09")
        r = api("PUT", "/api/v1/usuarios/%s" % C["id"], admin, {"estadoSincronizacion": "RARO"})
        reg("S2-USR-09", r.status == 400, r.breve(), r.ms)
        caso("S2-USR-10")
        r = api("PUT", "/api/v1/usuarios/%s" % C["id"], admin, {"estadoSincronizacion": "VIGENTE", "idRol": 3})
        r2 = login(C["email"], C["clave"])
        rol = (r2.campo("usuario") or {}).get("idRol")
        reg("S2-USR-10", r.status == 200 and r2.status == 200 and rol == 3, "%s; login %s, idRol=%s" % (r.status, r2.status, rol), r.ms)
        caso("S2-USR-11")
        r = api("DELETE", "/api/v1/usuarios/%s" % C["id"], admin)
        est = estado_usuario(C["id"])
        r2 = login(C["email"], C["clave"])
        reg("S2-USR-11", r.status == 204 and est == "INACTIVO" and r2.status == 403, "%s, %s, login %s" % (r.status, est, r2.status), r.ms)

    # ---------------- Documentacion ----------------
    print("\nDocumentación de la API")
    caso("S2-DOC-01")
    r = api("GET", "/swagger-ui.html", cabeceras={"Accept": "text/html"})
    r2 = api("GET", "/v3/api-docs")
    rutas = len(r2.campo("paths") or {})
    reg("S2-DOC-01", r.status == 200 and r2.status == 200 and rutas > 0, "%s y %s, %d rutas documentadas" % (r.status, r2.status, rutas), r.ms)

    # ---------------- Simulador IoT ----------------
    print("\nSimulador IoT")
    lectura = {"direccionMac": b2["mac"], "tipoEvento": "LECTURA_SENSOR",
               "payloadRecibido": json.dumps({"candadoCerrado": True, "bateria": 80, "estadoConexion": "ONLINE"})}
    caso("S3-IOT-01")
    r = api("POST", "/api/v1/iot/telemetria", cuerpo=lectura)
    reg("S3-IOT-01", r.status == 401, r.breve(), r.ms)
    caso("S3-IOT-02")
    llave = llave_iot()
    if not llave:
        reg("S3-IOT-02", False, "No encontré la llave de dispositivos (IOT_API_KEY)", resultado="Omitido")
    else:
        r = api("POST", "/api/v1/iot/telemetria", cuerpo=lectura, cabeceras={"X-IOT-KEY": llave})
        e = estado_bahia(admin, b2["id"])
        reg("S3-IOT-02", r.status == 201 and r.campo("idLog") is not None and e == DISPONIBLE,
            "%s, idLog=%s; bahía %s" % (r.breve(), r.campo("idLog"), nom(e)), r.ms)
    caso("S3-IOT-07")
    r = api("POST", "/api/mock-iot/comando", cuerpo={"direccionMac": "FF:FF:FF:FF:FF:FE", "comando": "LIBERAR_CERROJO"})
    ctx["mock"] = r.status == 404 and r.campo("status") == "ERROR"
    reg("S3-IOT-07", ctx["mock"], "%s %s" % (r.status, r.campo("status") or r.mensaje or "(sin simulador)"), r.ms)
    caso("S3-IOT-05")
    r = api("POST", "/api/mock-iot/simular", params={"mac": "FF:FF:FF:FF:FF:FE", "evento": "LECTURA_SENSOR"})
    reg("S3-IOT-05", r.status == 404 and "registrado" in r.mensaje, r.breve(), r.ms)
    caso("S3-IOT-06")
    r = api("POST", "/api/mock-iot/comando", cuerpo={"direccionMac": b2["mac"], "comando": "LIBERAR_CERROJO"})
    reg("S3-IOT-06", r.status == 200 and r.campo("status") == "EJECUTADO", "%s %s" % (r.status, r.campo("status") or r.mensaje), r.ms)
    caso("S3-IOT-03")
    r = api("POST", "/api/mock-iot/simular", params={"mac": b2["mac"], "evento": "ALERTA_FALLA"})
    e = estado_bahia(admin, b2["id"])
    reg("S3-IOT-03", r.status == 200 and e == FUERA_DE_SERVICIO, "%s; bahía %s" % (r.breve(), nom(e)), r.ms)
    caso("S3-IOT-04")
    r = api("POST", "/api/v1/reservas", A["token"], {"idBahia": b2["id"], "idVehiculo": scooter_a})
    reg("S3-IOT-04", r.status == 409, r.breve(), r.ms)
    deshacer_reserva(r, A["token"])

    # ---------------- Analitica ----------------
    print("\nAnalítica")
    caso("S4-ANA-01")
    r = api("GET", "/api/v1/analitica/embed-token", admin)
    if r.status == 503:
        reg("S4-ANA-01", True, r.breve() + " (Power BI no configurado; el panel usa sus gráficos, CC-24)", r.ms)
    else:
        reg("S4-ANA-01", r.status == 200 and bool(r.campo("embedUrl")), "%s%s" % (r.breve(), " con URL" if r.campo("embedUrl") else ""), r.ms)
    caso("S4-ANA-02")
    r = api("GET", "/api/v1/analitica/resumen", admin, params={"dias": 30})
    ind = r.campo("indicadores") or {}
    horas = r.campo("usoPorHora") or []
    ok = r.status == 200 and "reservas" in ind and r.campo("agrupacion") == "DIA" and len(horas) >= 16
    reg("S4-ANA-02", ok, "%s; %s reservas, %s usos, %s horas" % (r.breve(), ind.get("reservas"), ind.get("usos"), len(horas)), r.ms)
    caso("S4-ANA-03")
    r = api("GET", "/api/v1/analitica/resumen", admin, params={"dias": 15})
    reg("S4-ANA-03", r.status == 400, r.breve(), r.ms)
    caso("S4-ANA-04")
    r = api("GET", "/api/v1/analitica/resumen", A["token"], params={"dias": 30})
    reg("S4-ANA-04", r.status == 403, r.breve(), r.ms)

    # ---------------- Sprint 4: faltas, lista de espera y avisos ----------------
    print("\nFaltas, lista de espera y avisos")
    caso("PREPARACION")
    for x in (api("GET", "/api/v1/reservas/usuario/%s" % A["id"], A["token"]).cuerpo or []):
        api("PUT", "/api/v1/reservas/%s/cancelar" % x.get("idReserva"), A["token"])
    b3 = {"codigo": "QA-%s-B3" % corrida, "mac": mac()}
    r = api("POST", "/api/v1/bahias", admin, {"codigoIot": b3["codigo"], "ubicacion": ubic, "idEstado": 1, "idTipoPermitido": 1, "direccionMac": b3["mac"]})
    b3["id"] = r.campo("idBahia")
    if b3["id"] is not None:
        CREADOS.append("Bahía %s (bicicleta), ID %s, con dispositivo IoT" % (b3["codigo"], b3["id"]))

    caso("S4-EST-01")
    r = api("GET", "/api/v1/mi-estado", A["token"])
    ok = (r.status == 200 and r.campo("maxFaltas") == 3 and r.campo("faltasVigentes") == 0 and r.campo("reservasBloqueadas") is False
          and r.campo("minutosReserva") == args.reserva_min and bool((r.campo("horario") or {}).get("mensaje")))
    reg("S4-EST-01", ok, "%s; %s de %s faltas; ventana %s min" % (r.status, r.campo("faltasVigentes"), r.campo("maxFaltas"), r.campo("minutosReserva")), r.ms)
    caso("S4-ESP-01")
    r = api("POST", "/api/v1/lista-espera", A["token"], {"idVehiculo": bici_a})
    reg("S4-ESP-01", r.status == 409, r.breve(), r.ms)
    if r.status == 201:
        api("DELETE", "/api/v1/lista-espera", A["token"])
    caso("S4-ESP-02")
    r = api("DELETE", "/api/v1/lista-espera", A["token"])
    reg("S4-ESP-02", r.status == 404, r.breve(), r.ms)
    caso("S4-ESP-03")
    r = api("POST", "/api/v1/lista-espera/confirmar", A["token"])
    reg("S4-ESP-03", r.status == 404, r.breve(), r.ms)
    caso("S4-ESP-04")
    r = api("GET", "/api/v1/lista-espera/mia", A["token"])
    reg("S4-ESP-04", r.status == 204, r.breve(), r.ms)
    caso("S4-ESP-05")
    r = api("GET", "/api/v1/lista-espera/activa", A["token"])
    r2 = api("GET", "/api/v1/lista-espera/activa", admin)
    reg("S4-ESP-05", r.status == 403 and r2.status == 200, "usuario %s; admin %s" % (r.breve(), r2.breve()), r.ms)

    caso("S4-RES-14")
    if b3["id"] is None:
        reg("S4-RES-14", False, "No se pudo crear la bahía de prueba")
    else:
        r = api("POST", "/api/v1/reservas", A["token"], {"idBahia": b3["id"], "idVehiculo": bici_a})
        res14 = r.campo("idReserva")
        if res14 is None:
            reg("S4-RES-14", False, "No se pudo crear la reserva: %s" % r.breve(), r.ms)
        else:
            CREADOS.append("Reserva %s del usuario A (cancelada por ticket)" % res14)
            rt = api("POST", "/api/v1/tickets", admin, {"idBahia": b3["id"], "descripcionFalla": "QA regresion %s: falla sobre bahía reservada" % corrida})
            pendientes = api("GET", "/api/v1/reservas/usuario/%s" % A["id"], A["token"]).cuerpo
            e = estado_bahia(admin, b3["id"])
            avisos = api("GET", "/api/v1/notificaciones", A["token"]).cuerpo or []
            hay_aviso = any(x.get("tipo") == "RESERVA_CANCELADA" for x in avisos if isinstance(x, dict))
            faltas = api("GET", "/api/v1/mi-estado", A["token"]).campo("faltasVigentes")
            ok = rt.status == 201 and pendientes == [] and e == FUERA_DE_SERVICIO and hay_aviso and faltas == 0
            reg("S4-RES-14", ok, "ticket %s; %s reservas pendientes; bahía %s; aviso %s; faltas %s" % (
                rt.status, "sin" if pendientes == [] else "CON", nom(e), "sí" if hay_aviso else "NO", faltas), rt.ms)

    caso("S4-NOT-02")
    avisos = api("GET", "/api/v1/notificaciones", A["token"]).cuerpo or []
    id_aviso = avisos[0].get("idNotificacion") if avisos and isinstance(avisos[0], dict) else None
    if id_aviso is None:
        reg("S4-NOT-02", False, "El usuario A no tiene avisos para probar")
    else:
        r = api("PUT", "/api/v1/notificaciones/%s/leida" % id_aviso, B["token"])
        reg("S4-NOT-02", r.status == 403, r.breve(), r.ms)
    caso("S4-NOT-01")
    r = api("PUT", "/api/v1/notificaciones/leidas", A["token"])
    sin_leer = api("GET", "/api/v1/mi-estado", A["token"]).campo("notificacionesNoLeidas")
    reg("S4-NOT-01", r.status == 200 and sin_leer == 0, "%s; %s sin leer" % (r.breve(), sin_leer), r.ms)

    caso("S4-FAL-01")
    r = api("GET", "/api/v1/usuarios/%s/faltas" % A["id"], admin)
    reg("S4-FAL-01", r.status == 200 and r.cuerpo == [], "%s con %s" % (r.status, len(r.cuerpo) if isinstance(r.cuerpo, list) else "?"), r.ms)
    caso("S4-FAL-02")
    r = api("PUT", "/api/v1/usuarios/%s/desbloquear" % A["id"], admin)
    reg("S4-FAL-02", r.status == 409, r.breve(), r.ms)
    caso("S4-FAL-03")
    r = api("GET", "/api/v1/usuarios/%s/faltas" % A["id"], A["token"])
    r2 = api("GET", "/api/v1/mi-estado/faltas", A["token"])
    reg("S4-FAL-03", r.status == 403 and r2.status == 200, "ruta admin %s; propia %s" % (r.breve(), r2.breve()), r.ms)
    caso("S4-FAL-04")
    r = api("GET", "/api/v1/usuarios", admin)
    lista = r.cuerpo if isinstance(r.cuerpo, list) else []
    reg("S4-FAL-04", r.status == 200 and lista and all("faltasVigentes" in x for x in lista),
        "%s, %d usuarios%s" % (r.status, len(lista), "" if all("faltasVigentes" in x for x in lista) else " SIN faltasVigentes"), r.ms)

    # ---------------- Expiracion de la reserva (opcional) ----------------
    if args.esperar_expiracion:
        print("\nReservas: expiración automática")
        caso("S2-RES-13")
        r = api("POST", "/api/v1/reservas", A["token"], {"idBahia": b1["id"], "idVehiculo": bici_a})
        res13 = r.campo("idReserva")
        if res13 is None:
            reg("S2-RES-13", False, "No se pudo crear la reserva: %s" % r.breve(), r.ms)
        else:
            CREADOS.append("Reserva %s del usuario A (expirada)" % res13)
            espera = args.reserva_min * 60 + 50      # el backend revisa las vencidas cada 30 s
            fin_espera = time.time() + espera
            while time.time() < fin_espera:
                falta = int(fin_espera - time.time())
                sys.stdout.write("\r  Esperando la ventana de reserva: faltan %2d min %02d s " % (falta // 60, falta % 60))
                sys.stdout.flush()
                time.sleep(min(10, max(1, falta)))
            sys.stdout.write("\r" + " " * 60 + "\r")
            pendientes = api("GET", "/api/v1/reservas/usuario/%s" % A["id"], A["token"]).cuerpo
            e = estado_bahia(admin, b1["id"])
            r = api("POST", "/api/v1/transacciones/iniciar", A["token"], {"idReserva": res13})
            ok = pendientes == [] and e == DISPONIBLE and r.status == 409 and "EXPIRADA" in r.mensaje
            reg("S2-RES-13", ok, "A los %d min: %s reservas pendientes; bahía %s; check-in tardío %s" % (
                args.reserva_min, "sin" if pendientes == [] else "CON", nom(e), r.breve()))

            # Sprint 4: la reserva vencida deja una falta y el admin la puede anular
            caso("S4-FAL-05")
            est = api("GET", "/api/v1/mi-estado", A["token"])
            avisos = api("GET", "/api/v1/notificaciones", A["token"]).cuerpo or []
            hay_aviso = any(x.get("tipo") == "FALTA" for x in avisos if isinstance(x, dict))
            reg("S4-FAL-05", est.campo("faltasVigentes") == 1 and hay_aviso,
                "%s de %s faltas; aviso %s" % (est.campo("faltasVigentes"), est.campo("maxFaltas"), "sí" if hay_aviso else "NO"), est.ms)
            caso("S4-FAL-06")
            r = api("PUT", "/api/v1/usuarios/%s/desbloquear" % A["id"], admin)
            despues = api("GET", "/api/v1/mi-estado", A["token"]).campo("faltasVigentes")
            reg("S4-FAL-06", r.status == 200 and r.campo("faltasAnuladas") == 1 and despues == 0,
                "%s; %s anuladas; quedan %s" % (r.breve(), r.campo("faltasAnuladas"), despues), r.ms)
    else:
        for c in ("S2-RES-13", "S4-FAL-05", "S4-FAL-06"):
            RESULTADOS[c] = {"obtenido": "Requiere esperar la ventana completa; ejecutar con --esperar-expiracion",
                             "ms": None, "resultado": "Omitido"}

    # ---------------- Cierre: borrado logico de la bahia y limpieza ----------------
    print("\nBahías: borrado lógico")
    caso("S2-BAH-12")
    r = api("DELETE", "/api/v1/bahias/%s" % b1["id"], admin)
    e = estado_bahia(admin, b1["id"])
    reg("S2-BAH-12", r.status == 204 and e == FUERA_DE_SERVICIO, "%s; bahía %s" % (r.status, nom(e)), r.ms)
    caso("LIMPIEZA")
    api("DELETE", "/api/v1/bahias/%s" % b2["id"], admin)
    if b3.get("id") is not None:
        api("DELETE", "/api/v1/bahias/%s" % b3["id"], admin)
    for u in (A, B, COLAB):
        api("DELETE", "/api/v1/usuarios/%s" % u["id"], admin)
    return ctx


# ------------------------------------------------------------------------------
# Reporte
# ------------------------------------------------------------------------------
def celda(texto):
    return str(texto).replace("|", "\\|").replace("\n", " ")


def resumen():
    filas, total = [], {"casos": 0, "ok": 0, "falla": 0, "otros": 0}
    for modulo in MODULOS:
        f = {"modulo": modulo, "casos": 0, "ok": 0, "falla": 0, "otros": 0}
        for c in PLAN:
            if c[1] != modulo:
                continue
            res = RESULTADOS.get(c[0], {}).get("resultado", "No ejecutado")
            f["casos"] += 1
            f["ok" if res == "OK" else "falla" if res.startswith("FALLA") else "otros"] += 1
        filas.append(f)
        for k in total:
            total[k] += f[k]
    return filas, total


def escribir_reporte(args, ctx, inicio, duracion):
    DIR_REPORTES.mkdir(parents=True, exist_ok=True)
    sello = inicio.strftime("%Y-%m-%d_%H%M")
    ruta_md = DIR_REPORTES / ("regresion_api_%s.md" % sello)
    ruta_det = DIR_REPORTES / ("regresion_api_%s_detalle.txt" % sello)
    filas, total = resumen()
    L = []
    L.append("# OmniDock — Regresión de la API")
    L.append("")
    L.append("- **Fecha de ejecución:** %s, de %s a %s (hora local)" % (
        inicio.strftime("%d/%m/%Y"), inicio.strftime("%H:%M:%S"), (inicio + datetime.timedelta(seconds=duracion)).strftime("%H:%M:%S")))
    L.append("- **Ejecutado por:** %s" % args.ejecutor)
    L.append("- **Ambiente:** backend en `%s`; simulador IoT (perfil `mock`) %s" % (BASE, "activo" if ctx.get("mock") else "NO detectado"))
    L.append("- **Método:** script `backend/pruebas/regresion_api.py`. Cada caso es una llamada HTTP real a la API; se revisa el código de respuesta, el cuerpo y el estado en que queda la bahía")
    L.append("- **Datos:** el script crea sus propios usuarios, bahías y vehículos de prueba; no modifica los datos existentes")
    L.append("- **Detalle de cada llamada:** `%s`" % ruta_det.name)
    L.append("")
    L.append("## Resultado global")
    L.append("")
    L.append("**Casos: %d. Pasan: %d. Fallan: %d. Omitidos o no aplican: %d.**" % (total["casos"], total["ok"], total["falla"], total["otros"]))
    L.append("")
    L.append("| Módulo | Casos | Pasan | Fallan | Otros |")
    L.append("| --- | --- | --- | --- | --- |")
    for f in filas:
        L.append("| %s | %d | %d | %d | %d |" % (f["modulo"], f["casos"], f["ok"], f["falla"], f["otros"]))
    L.append("")
    fallas = [c for c in PLAN if RESULTADOS.get(c[0], {}).get("resultado", "").startswith("FALLA")]
    if fallas:
        L.append("## Fallas")
        L.append("")
        for c in fallas:
            x = RESULTADOS[c[0]]
            L.append("- **%s** %s. Esperado: %s. Obtenido: %s. %s" % (c[0], c[3], c[4], x["obtenido"],
                     "Defecto conocido %s." % DEFECTOS_CONOCIDOS[c[0]] if c[0] in DEFECTOS_CONOCIDOS else ""))
        L.append("")
    tiempos = [x["ms"] for x in RESULTADOS.values() if x.get("ms") is not None]
    if tiempos:
        L.append("Tiempo de respuesta más alto de un caso: %d ms (límite del ERS: 2000 ms)." % max(tiempos))
        L.append("")
    for modulo in MODULOS:
        L.append("## %s" % modulo)
        L.append("")
        L.append("| ID | Ref. | Caso | Esperado | Obtenido | ms | Resultado |")
        L.append("| --- | --- | --- | --- | --- | --- | --- |")
        for c in PLAN:
            if c[1] != modulo:
                continue
            x = RESULTADOS.get(c[0], {"obtenido": "—", "ms": None, "resultado": "No ejecutado"})
            res = x["resultado"]
            L.append("| %s | %s | %s | %s | %s | %s | %s |" % (
                c[0], celda(c[2]), celda(c[3]), celda(c[4]), celda(x["obtenido"]),
                "—" if x["ms"] is None else x["ms"], "**%s**" % res if res.startswith("FALLA") else res))
        L.append("")
    L.append("## Datos de prueba que quedaron en la base")
    L.append("")
    L.append("El sistema no borra físicamente (RF-04). Estos registros quedan desactivados hasta que se recargue la base con los scripts `00` a `03`:")
    L.append("")
    for x in CREADOS:
        L.append("- %s" % x)
    L.append("")
    ruta_md.write_text("\n".join(L), encoding="utf-8")

    D = ["OmniDock - Regresion de la API - detalle de cada llamada",
         "Ejecucion del %s contra %s. Las claves y los tokens se reemplazan por <oculto>." % (inicio.strftime("%d/%m/%Y %H:%M:%S"), BASE), ""]
    for x in LLAMADAS:
        D.append("[%s] %s  %s %s  (%s)" % (x["caso"], x["hora"], x["metodo"], x["ruta"], x["como"]))
        if x["cabeceras"]:
            D.append("  cabeceras: %s" % ", ".join("%s: <oculto>" % c if c.lower() in CLAVES_OCULTAS else c for c in x["cabeceras"]))
        if x["envio"] is not None:
            D.append("  envio: %s" % json.dumps(x["envio"], ensure_ascii=False))
        resp = x["respuesta"] if isinstance(x["respuesta"], str) else json.dumps(x["respuesta"], ensure_ascii=False)
        D.append("  respuesta: %s en %d ms" % (x["status"], x["ms"]))
        if resp:
            D.append("  %s" % (resp if len(resp) <= 1500 else resp[:1500] + " ... (recortado)"))
        D.append("")
    ruta_det.write_text("\n".join(D), encoding="utf-8")
    return ruta_md, ruta_det


def main():
    global BASE
    p = argparse.ArgumentParser(description="Regresion de la API de OmniDock")
    p.add_argument("--url", default=os.environ.get("OMNIDOCK_URL", "http://localhost:8080"), help="direccion del backend")
    p.add_argument("--ejecutor", default=os.environ.get("OMNIDOCK_EJECUTOR") or getpass.getuser(), help="quien ejecuta las pruebas")
    p.add_argument("--reserva-min", type=int, default=int(os.environ.get("RESERVA_MINUTOS", "60")), help="minutos de la ventana de reserva esperada")
    p.add_argument("--esperar-expiracion", action="store_true", help="incluye S2-RES-13 (espera la ventana de reserva completa)")
    p.add_argument("--sin-reporte", action="store_true", help="no escribe archivos en docs/qa")
    args = p.parse_args()
    BASE = args.url.rstrip("/")

    print("OmniDock - regresion de la API contra %s" % BASE)
    try:
        api("GET", "/v3/api-docs")
    except SinConexion as e:
        sys.exit("\nNo pude conectarme al backend en %s (%s).\nLevantalo primero, por ejemplo:\n"
                 "    cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=mock\n" % (BASE, e))
    inicio, t0, ctx = datetime.datetime.now(), time.time(), {}
    try:
        ctx = ejecutar(args)
    except SinConexion as e:
        print("\nSe perdio la conexion con el backend (%s). Se informa lo ejecutado hasta aqui." % e)
    except KeyboardInterrupt:
        print("\nEjecucion interrumpida. Se informa lo ejecutado hasta aqui.")
    duracion = time.time() - t0

    filas, total = resumen()
    print("\n" + "=" * 72)
    print("%-34s %6s %6s %6s %6s" % ("Módulo", "Casos", "Pasan", "Fallan", "Otros"))
    for f in filas:
        print("%-34s %6d %6d %6d %6d" % (f["modulo"], f["casos"], f["ok"], f["falla"], f["otros"]))
    print("%-34s %6d %6d %6d %6d" % ("TOTAL", total["casos"], total["ok"], total["falla"], total["otros"]))
    inesperadas = [c[0] for c in PLAN if RESULTADOS.get(c[0], {}).get("resultado") == "FALLA"]
    conocidas = [c[0] for c in PLAN if RESULTADOS.get(c[0], {}).get("resultado", "").startswith("FALLA (")]
    if conocidas:
        print("Fallas por defectos conocidos: %s" % ", ".join(conocidas))
    if inesperadas:
        print("Fallas nuevas: %s" % ", ".join(inesperadas))
    if not args.sin_reporte:
        ruta_md, ruta_det = escribir_reporte(args, ctx, inicio, duracion)
        print("\nReporte:  %s\nDetalle:  %s" % (ruta_md, ruta_det))
    sys.exit(1 if inesperadas else 0)


if __name__ == "__main__":
    main()
