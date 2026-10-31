#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OmniDock - Prueba de carga simple de la API (Sprint 4)

Simula a muchos usuarios usando la app al mismo tiempo y mide cuanto se demora
el backend. Revisa los dos requisitos de rendimiento del ERS:

  RNF-01  la respuesta para abrir el candado (check-in) no pasa de 2 segundos bajo carga normal
  RNF-02  las reservas simultaneas no generan bloqueos ni errores en la asignacion de bahias

Que hace:

  1. Preparacion: crea N usuarios de prueba, cada uno con su bicicleta, y N bahias de prueba.
  2. Ciclo completo en paralelo: los N usuarios parten al mismo tiempo y cada uno hace
     login -> ver bahias -> mi estado -> reservar su bahia -> check-in -> check-out.
     Se repite las veces que diga --rondas.
  3. Carrera por una sola bahia: los N usuarios intentan reservar la MISMA bahia al mismo
     tiempo. Debe ganar uno solo y el resto recibir 409, sin errores 500.
  4. Limpieza: cancela lo que haya quedado y desactiva usuarios y bahias de prueba.

Uso (backend levantado con el perfil "mock" y HORARIO_ACTIVO=false):

    python3 backend/pruebas/prueba_carga.py --usuarios 50 --rondas 3 --ejecutor "Nombre Apellido"

Usa las mismas credenciales y funciones que regresion_api.py y solo la biblioteca
estandar de Python. Deja el reporte en docs/qa/prueba_carga_AAAA-MM-DD_HHMM.md.
Los datos de prueba llevan el prefijo "QA Carga" y quedan desactivados (RF-04).
"""
import argparse
import datetime
import getpass
import os
import random
import secrets
import sys
import threading
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import regresion_api as ra  # noqa: E402

LIMITE_MS = 2000
MEDICIONES = []                 # (operacion, ms, status, ok)
_candado = threading.Lock()
CREADOS = {"usuarios": [], "bahias": []}


def medir(operacion, r, esperados):
    ok = r.status in esperados
    with _candado:
        MEDICIONES.append((operacion, r.ms, r.status, ok))
    return ok


def rut():
    return "%d-%d" % (random.randint(10000000, 99999999), random.randint(0, 9))


def mac():
    return "0C:" + ":".join("%02X" % random.randint(0, 255) for _ in range(5))


def percentil(valores, p):
    if not valores:
        return 0
    v = sorted(valores)
    k = max(0, min(len(v) - 1, int(round(p / 100.0 * len(v) + 0.5)) - 1))
    return v[k]


# ------------------------------------------------------------------------------
# Preparacion
# ------------------------------------------------------------------------------
def preparar(admin, n, corrida):
    print("Preparando %d usuarios y %d bahías de prueba..." % (n, n))
    usuarios = []
    for i in range(1, n + 1):
        u = {"email": "qa.carga%02d.%s@duocuc.cl" % (i, corrida), "clave": secrets.token_urlsafe(12)}
        r = ra.api("POST", "/api/v1/usuarios", admin, {
            "rut": rut(), "nombreCompleto": "QA Carga %02d (ignorar)" % i,
            "emailInstitucional": u["email"], "passwordPrototipo": u["clave"], "idRol": 2})
        if r.status != 201:
            raise RuntimeError("No pude crear el usuario de prueba %d: %s" % (i, r.breve()))
        u["id"] = r.campo("idUsuario")
        CREADOS["usuarios"].append(u["id"])
        u["token"] = ra.login(u["email"], u["clave"]).campo("token")
        r = ra.api("POST", "/api/v1/vehiculos", u["token"], {"idTipoVehiculo": 1, "identificador": "QA Carga bici %02d" % i})
        u["vehiculo"] = r.campo("idVehiculo")
        if not (u["token"] and u["vehiculo"]):
            raise RuntimeError("El usuario de prueba %d no pudo iniciar sesión o registrar su bicicleta" % i)
        usuarios.append(u)

    bahias = []
    for i in range(1, n + 2):              # una extra para la carrera
        codigo = "QA-C%s-%02d" % (corrida, i)
        r = ra.api("POST", "/api/v1/bahias", admin, {
            "codigoIot": codigo, "ubicacion": "QA Carga %s" % corrida, "idEstado": 1,
            "idTipoPermitido": 1, "direccionMac": mac()})
        if r.status != 201:
            raise RuntimeError("No pude crear la bahía de prueba %s: %s" % (codigo, r.breve()))
        bahias.append(r.campo("idBahia"))
        CREADOS["bahias"].append(r.campo("idBahia"))
    return usuarios, bahias


# ------------------------------------------------------------------------------
# Escenarios
# ------------------------------------------------------------------------------
def ciclo(u, id_bahia, barrera, errores):
    try:
        barrera.wait()
        r = ra.login(u["email"], u["clave"])
        medir("Login", r, (200,))
        token = r.campo("token") or u["token"]
        medir("Ver bahías", ra.api("GET", "/api/v1/bahias", token), (200,))
        medir("Mi estado", ra.api("GET", "/api/v1/mi-estado", token), (200,))
        r = ra.api("POST", "/api/v1/reservas", token, {"idBahia": id_bahia, "idVehiculo": u["vehiculo"]})
        if not medir("Reservar", r, (201,)):
            errores.append("Reservar (usuario %s): %s" % (u["id"], r.breve()))
            return
        reserva = r.campo("idReserva")
        r = ra.api("POST", "/api/v1/transacciones/iniciar", token,
                   {"idReserva": reserva, "idBahia": id_bahia, "idVehiculo": u["vehiculo"]})
        if not medir("Check-in (abre el candado)", r, (200,)):
            errores.append("Check-in (usuario %s): %s" % (u["id"], r.breve()))
            ra.api("PUT", "/api/v1/reservas/%s/cancelar" % reserva, token)
            return
        r = ra.api("POST", "/api/v1/transacciones/%s/finalizar" % r.campo("idTransaccion"), token)
        if not medir("Check-out (cierra el candado)", r, (200,)):
            errores.append("Check-out (usuario %s): %s" % (u["id"], r.breve()))
    except ra.SinConexion as e:
        errores.append("Sin conexión: %s" % e)


def carrera(usuarios, id_bahia):
    barrera = threading.Barrier(len(usuarios))
    salida = {}

    def intentar(u):
        barrera.wait()
        try:
            salida[u["id"]] = ra.api("POST", "/api/v1/reservas", u["token"], {"idBahia": id_bahia, "idVehiculo": u["vehiculo"]})
        except ra.SinConexion as e:
            salida[u["id"]] = e

    hilos = [threading.Thread(target=intentar, args=(u,)) for u in usuarios]
    for h in hilos:
        h.start()
    for h in hilos:
        h.join()
    codigos = {}
    for uid, r in salida.items():
        if isinstance(r, Exception):
            codigos["sin conexión"] = codigos.get("sin conexión", 0) + 1
            continue
        medir("Reserva en carrera (misma bahía)", r, (201, 409))
        codigos[r.status] = codigos.get(r.status, 0) + 1
        if r.status == 201:
            dueno = next(u for u in usuarios if u["id"] == uid)
            ra.api("PUT", "/api/v1/reservas/%s/cancelar" % r.campo("idReserva"), dueno["token"])
    return codigos


def limpiar(admin):
    for b in CREADOS["bahias"]:
        ra.api("DELETE", "/api/v1/bahias/%s" % b, admin)
    for u in CREADOS["usuarios"]:
        ra.api("DELETE", "/api/v1/usuarios/%s" % u, admin)


# ------------------------------------------------------------------------------
# Reporte
# ------------------------------------------------------------------------------
def tabla_operaciones():
    orden = []
    for op, _, _, _ in MEDICIONES:
        if op not in orden:
            orden.append(op)
    filas = []
    for op in orden:
        ms = [m for o, m, _, _ in MEDICIONES if o == op]
        err = sum(1 for o, _, s, ok in MEDICIONES if o == op and not ok)
        e5 = sum(1 for o, _, s, _ in MEDICIONES if o == op and s == 500)
        filas.append({"op": op, "n": len(ms), "err": err, "e5": e5, "prom": int(sum(ms) / len(ms)),
                      "p95": percentil(ms, 95), "max": max(ms), "sobre": sum(1 for m in ms if m > LIMITE_MS)})
    return filas


def escribir_reporte(args, inicio, duracion, filas, codigos, errores, veredictos):
    ra.DIR_REPORTES.mkdir(parents=True, exist_ok=True)
    ruta = ra.DIR_REPORTES / ("prueba_carga_%s.md" % inicio.strftime("%Y-%m-%d_%H%M"))
    total = len(MEDICIONES)
    L = ["# OmniDock — Prueba de carga de la API", "",
         "- **Fecha de ejecución:** %s, de %s a %s (hora local)" % (
             inicio.strftime("%d/%m/%Y"), inicio.strftime("%H:%M:%S"),
             (inicio + datetime.timedelta(seconds=duracion)).strftime("%H:%M:%S")),
         "- **Ejecutado por:** %s" % args.ejecutor,
         "- **Ambiente:** backend en `%s` (perfil `mock`), base Oracle en la nube" % ra.BASE,
         "- **Carga:** %d usuarios simultáneos, %d ronda(s) del ciclo completo y una carrera por la misma bahía" % (args.usuarios, args.rondas),
         "- **Método:** script `backend/pruebas/prueba_carga.py`. Todos los usuarios parten al mismo tiempo; cada llamada es HTTP real",
         "- **Llamadas medidas:** %d" % total, "",
         "## Resultado", "",
         "| Requisito | Qué se revisó | Resultado |", "| --- | --- | --- |"]
    for v in veredictos:
        L.append("| %s | %s | %s |" % v)
    if veredictos and any(v[0].startswith("RNF-01") for v in veredictos):
        n502 = sum(1 for o, _, s, _ in MEDICIONES if s in (502, 504))
        if n502:
            L += ["", "**Respuestas 502 (el simulador IoT no respondió en 2 s): %d.** No son errores de concurrencia: la orden al candado no llegó a tiempo y la operación se revirtió sin cambiar datos." % n502]
    L += ["", "## Tiempos por operación", "",
          "| Operación | Llamadas | Errores | Promedio (ms) | p95 (ms) | Máximo (ms) | Sobre 2 s |",
          "| --- | --- | --- | --- | --- | --- | --- |"]
    for f in filas:
        L.append("| %s | %d | %d | %d | %d | %d | %d |" % (f["op"], f["n"], f["err"], f["prom"], f["p95"], f["max"], f["sobre"]))
    L += ["", "p95: el 95 % de las llamadas tardó eso o menos.", "",
          "## Carrera por la misma bahía", "",
          "%d usuarios intentaron reservar la misma bahía al mismo tiempo." % args.usuarios, "",
          "| Respuesta | Cantidad |", "| --- | --- |"]
    for k in sorted(codigos, key=str):
        L.append("| %s | %d |" % (k, codigos[k]))
    L += ["", "Lo esperado: un solo 201 (la reserva ganadora, que luego se cancela) y el resto 409, sin errores 500.", ""]
    if errores:
        L += ["## Errores", ""] + ["- %s" % e for e in errores[:50]] + [""]
    L += ["## Datos de prueba", "",
          "Se crearon %d usuarios (\"QA Carga NN (ignorar)\") y %d bahías (`QA-C...`). Al final quedaron desactivados; "
          "el sistema no borra físicamente (RF-04), así que siguen en la base hasta recargarla con los scripts `00` a `03`."
          % (len(CREADOS["usuarios"]), len(CREADOS["bahias"])), ""]
    ruta.write_text("\n".join(L), encoding="utf-8")
    return ruta


# ------------------------------------------------------------------------------
def main():
    p = argparse.ArgumentParser(description="Prueba de carga simple de la API de OmniDock")
    p.add_argument("--url", default=os.environ.get("OMNIDOCK_URL", "http://localhost:8080"))
    p.add_argument("--usuarios", type=int, default=50, help="usuarios simultáneos (por defecto 50, una por bahía de la sede)")
    p.add_argument("--rondas", type=int, default=3, help="veces que se repite el ciclo completo")
    p.add_argument("--ejecutor", default=os.environ.get("OMNIDOCK_EJECUTOR") or getpass.getuser())
    p.add_argument("--sin-reporte", action="store_true")
    args = p.parse_args()
    ra.BASE = args.url.rstrip("/")

    print("OmniDock - prueba de carga contra %s" % ra.BASE)
    try:
        ra.api("GET", "/v3/api-docs")
    except ra.SinConexion as e:
        sys.exit("No pude conectarme al backend (%s). Levántalo con el perfil mock y HORARIO_ACTIVO=false." % e)
    email, clave, _ = ra.credenciales_admin()
    admin = ra.login(email, clave).campo("token") if email else None
    if not admin:
        sys.exit("No pude iniciar sesión como administrador (revisa OMNIDOCK_ADMIN_EMAIL y OMNIDOCK_ADMIN_PASSWORD).")

    corrida = time.strftime("%m%d%H%M")
    inicio, t0 = datetime.datetime.now(), time.time()
    errores, codigos = [], {}
    try:
        usuarios, bahias = preparar(admin, args.usuarios, corrida)
        horario = ra.api("GET", "/api/v1/mi-estado", usuarios[0]["token"]).campo("horario") or {}
        if horario and not horario.get("reservasAbiertas", True):
            raise RuntimeError("El backend no acepta reservas ahora (fuera de horario). Levántalo con HORARIO_ACTIVO=false.")
        for ronda in range(1, args.rondas + 1):
            print("Ronda %d de %d: %d usuarios a la vez..." % (ronda, args.rondas, len(usuarios)))
            barrera = threading.Barrier(len(usuarios))
            hilos = [threading.Thread(target=ciclo, args=(u, bahias[i], barrera, errores)) for i, u in enumerate(usuarios)]
            for h in hilos:
                h.start()
            for h in hilos:
                h.join()
        print("Carrera: %d usuarios reservan la misma bahía..." % len(usuarios))
        codigos = carrera(usuarios, bahias[-1])
    except (RuntimeError, ra.SinConexion) as e:
        errores.append(str(e))
        print("\n%s" % e)
    except KeyboardInterrupt:
        errores.append("Ejecución interrumpida")
    finally:
        print("Limpiando datos de prueba...")
        try:
            limpiar(admin)
        except ra.SinConexion:
            pass
    duracion = time.time() - t0

    filas = tabla_operaciones()
    checkin = next((f for f in filas if f["op"].startswith("Check-in")), None)
    cinco = sum(1 for o, _, s, _ in MEDICIONES if s == 500)          # errores internos (bloqueos, deadlocks)
    iot = sum(1 for o, _, s, _ in MEDICIONES if s in (502, 504))   # el simulador IoT no respondió a tiempo
    ganadores = codigos.get(201, 0)
    raros = sum(v for k, v in codigos.items() if k not in (201, 409))
    v1_ok = bool(checkin) and checkin["p95"] <= LIMITE_MS
    v2_ok = bool(codigos) and cinco == 0 and ganadores == 1 and raros == 0
    veredictos = [
        ("RNF-01 Rendimiento", "p95 del check-in (orden de apertura) bajo 2 s con %d usuarios a la vez" % args.usuarios,
         ("OK (p95 %d ms, máximo %d ms)" % (checkin["p95"], checkin["max"]) if v1_ok else
          "NO CUMPLE (p95 %s ms)" % (checkin["p95"] if checkin else "sin datos"))),
        ("RNF-02 Concurrencia", "Sin errores internos (500) y un solo ganador en la carrera por la misma bahía",
         "OK (1 ganador, %d rechazos 409, 0 errores 500)" % codigos.get(409, 0) if v2_ok else
         "NO CUMPLE (ganadores: %d, errores 500: %d, otras respuestas: %d)" % (ganadores, cinco, raros)),
    ]

    print("\n%-34s %8s %7s %8s %8s %8s" % ("Operación", "Llamadas", "Errores", "Prom ms", "p95 ms", "Máx ms"))
    for f in filas:
        print("%-34s %8d %7d %8d %8d %8d" % (f["op"], f["n"], f["err"], f["prom"], f["p95"], f["max"]))
    print("Carrera por la misma bahía: %s" % codigos)
    for v in veredictos:
        print("%s: %s" % (v[0], v[2]))
    if errores:
        print("Errores (%d), el primero: %s" % (len(errores), errores[0]))
    if not args.sin_reporte and MEDICIONES:
        print("\nReporte: %s" % escribir_reporte(args, inicio, duracion, filas, codigos, errores, veredictos))
    sys.exit(0 if (v1_ok and v2_ok and not errores) else 1)


if __name__ == "__main__":
    main()
