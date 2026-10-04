-- ==============================================================================
-- PROYECTO: OmniDock - Sprint 1 (Arquitectura Completa)
-- AUTOR: Crisler Romero (Arquitectura de Datos)
-- MOTOR: Oracle SQL
-- ORDEN: 00_drop.sql -> 01_ddl.sql -> 02_insert.sql -> 03_verificar.sql
-- En el caso de existir tablas, primero eliminar todo antes de ejecutar el resto de archivos SQL en orden.
-- ==============================================================================

DROP TABLE TICKET_MANTENIMIENTO CASCADE CONSTRAINTS;
DROP TABLE LOG_EVENTO_IOT CASCADE CONSTRAINTS;
DROP TABLE TRANSACCION_USO CASCADE CONSTRAINTS;
DROP TABLE RESERVA CASCADE CONSTRAINTS;
DROP TABLE DISPOSITIVO_IOT CASCADE CONSTRAINTS;
DROP TABLE BAHIA CASCADE CONSTRAINTS;
DROP TABLE VEHICULO CASCADE CONSTRAINTS;
DROP TABLE USUARIO CASCADE CONSTRAINTS;
DROP TABLE ESTADO_BAHIA CASCADE CONSTRAINTS;
DROP TABLE TIPO_VEHICULO CASCADE CONSTRAINTS;
DROP TABLE ROL CASCADE CONSTRAINTS;
