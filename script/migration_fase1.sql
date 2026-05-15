-- ============================================================
-- MIGRATION FASE 1 — AdminServer
-- Estados de release, canary, heartbeat, errores centralizados
--
-- Estados definitivos de actualizaciones:
--   borrador     → subida, no se distribuye a nadie
--   canary       → solo terminales en canary_terminals
--   produccion   → todos los clientes habilitados
--   deshabilitada → retirada, no se distribuye
--
-- Sin 'testing', sin 'staging'. Tu máquina de prueba
-- va en canary_terminals igual que un cliente canary.
-- La distinción es un dato (qué terminal), no un estado.
--
-- El campo `ambiente` se mantiene como metadato organizativo
-- pero NO participa en la lógica de distribución.
-- ============================================================

USE dbadminserver;

-- ------------------------------------------------------------
-- 1. actualizaciones — estados simplificados + flags de release
-- ------------------------------------------------------------

-- Paso 1: ampliar ENUM con valores nuevos antes de migrar datos
ALTER TABLE actualizaciones
  MODIFY COLUMN estado ENUM(
    'borrador','publicada','canary','produccion','deshabilitada'
  ) NOT NULL DEFAULT 'borrador';

-- Paso 2: migrar datos existentes
UPDATE actualizaciones SET estado = 'produccion' WHERE estado = 'publicada';

-- Paso 3: ENUM limpio con los cuatro estados definitivos
ALTER TABLE actualizaciones
  MODIFY COLUMN estado ENUM(
    'borrador','canary','produccion','deshabilitada'
  ) NOT NULL DEFAULT 'borrador';

-- Paso 4: columnas nuevas de release
ALTER TABLE actualizaciones
  ADD COLUMN requiere_npm_install TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN tamano_bytes         BIGINT NULL;

-- ------------------------------------------------------------
-- 2. canary_terminals — terminales que reciben releases canary
--
-- Usá esta tabla tanto para tus máquinas de prueba como
-- para los clientes canary. La distinción es el dato, no la tabla.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS canary_terminals (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  terminal  VARCHAR(36) NOT NULL,
  idApp     INT         NOT NULL,
  activo    TINYINT(1)  NOT NULL DEFAULT 1,
  fechaAlta DATETIME    NOT NULL DEFAULT NOW(),
  UNIQUE KEY uq_terminal_app (terminal, idApp)
);

-- ------------------------------------------------------------
-- 3. apps_cliente — solo el timestamp del último heartbeat
--
-- El detalle completo vive en la tabla heartbeats.
-- Este campo alcanza para saber si una instalación está viva.
-- ------------------------------------------------------------

ALTER TABLE apps_cliente
  ADD COLUMN ultimo_heartbeat DATETIME NULL;

-- ------------------------------------------------------------
-- 4. heartbeats — historial de pulsos (retención recomendada: 30 días)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS heartbeats (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  terminal               VARCHAR(36) NOT NULL,
  idApp                  INT         NOT NULL,
  version_back           VARCHAR(10) NULL,
  version_front          VARCHAR(10) NULL,
  db_status              VARCHAR(20) NULL,
  tiempo_activo        INT         NULL,
  errores_recientes      INT         NOT NULL DEFAULT 0,
  ultimo_backup_fecha    DATETIME    NULL,
  ultimo_backup_ok       TINYINT(1)  NULL,
  terminales_lan_activas INT         NOT NULL DEFAULT 1,
  fecha                  DATETIME    NOT NULL DEFAULT NOW(),

  INDEX idx_terminal_fecha (terminal, fecha),
  INDEX idx_fecha          (fecha)
);

-- ------------------------------------------------------------
-- 5. ordenes_rollback — instrucciones de reversión ordenadas desde AdminServer
--
-- Flujo:
--   1. Admin ordena rollback desde el panel de flota
--   2. El heartbeat devuelve { rollback: true } mientras version_origen no cambie
--   3. Cuando la terminal reporta una versión distinta → estado = 'aplicada'
--
-- version_origen: versión "mala" que debe revertirse (la que tiene la terminal ahora)
-- La terminal revierte al backup local (versión inmediata anterior).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ordenes_rollback (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  terminal       VARCHAR(36)  NOT NULL,
  idApp          INT          NOT NULL,
  version_origen VARCHAR(10)  NOT NULL,
  estado         ENUM('pendiente','aplicada','cancelada') NOT NULL DEFAULT 'pendiente',
  fecha_orden    DATETIME     NOT NULL DEFAULT NOW(),
  fecha_aplicada DATETIME     NULL,

  INDEX idx_terminal_app_estado (terminal, idApp, estado)
);

-- ------------------------------------------------------------
-- 6. eventos_actualizacion — historial de intentos de update/rollback por terminal
--
-- Se registra cada vez que una terminal aplica, falla o revierte una actualización.
-- El heartbeat los transporta desde la terminal a AdminServer.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS eventos_actualizacion (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  terminal        VARCHAR(36)  NOT NULL,
  idApp           INT          NOT NULL,
  tipo            VARCHAR(30)  NOT NULL,   -- aplicacion_exitosa | aplicacion_fallida | rollback_exitoso | rollback_fallido
  version         VARCHAR(10)  NULL,
  error           TEXT         NULL,
  reintentos      INT          NOT NULL DEFAULT 0,
  fecha           DATETIME     NOT NULL,
  fecha_recibido  DATETIME     NOT NULL DEFAULT NOW(),

  INDEX idx_terminal_app  (terminal, idApp),
  INDEX idx_fecha         (fecha)
);

-- ------------------------------------------------------------
-- 7. backups_registro — índice de backups almacenados por cliente
--
-- Se registra cada vez que AdminServer guarda un backup exitoso.
-- Permite consultar en SQL cuántos backups tiene cada terminal
-- sin necesidad de leer el filesystem.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS backups_registro (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  DNI            VARCHAR(20)   NOT NULL,
  idApp          INT           NOT NULL,
  nombre         VARCHAR(100)  NOT NULL,
  fecha          DATE          NOT NULL,
  fecha_registro DATETIME      NOT NULL DEFAULT NOW(),

  INDEX idx_dni_app  (DNI, idApp),
  INDEX idx_fecha    (fecha)
);

-- ------------------------------------------------------------
-- 8. errores_instalaciones — errores centralizados por terminal
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS errores_instalaciones (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  terminal      VARCHAR(36)  NOT NULL,
  idApp         INT          NOT NULL,
  codigo        VARCHAR(100) NOT NULL,
  mensaje       TEXT         NULL,
  cantidad      INT          NOT NULL DEFAULT 1,
  fecha_primero DATETIME     NOT NULL,
  fecha_ultimo  DATETIME     NOT NULL DEFAULT NOW(),

  UNIQUE KEY uq_terminal_app_codigo (terminal, idApp, codigo),
  INDEX idx_terminal    (terminal),
  INDEX idx_codigo      (codigo),
  INDEX idx_fecha_ultimo (fecha_ultimo)
);
