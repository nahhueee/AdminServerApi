-- =====================================================================
-- Migration fase 4 — Cierre del updater de frontend (EasySalesApp)
-- Ver handoff_adminserver_updater_front.docx
--
-- Cubre:
--   1. Tabla ordenes_rollback_front (análoga a ordenes_rollback del back).
--   2. Columna maquina en eventos_actualizacion (PA1 — trazabilidad por PC).
--   3. Columna confirmacion_front_pendiente en heartbeats (PA2 — estado transitorio).
--   4. Unificación de tamaños de columna de versión a VARCHAR(20)
--      (consistencia: evita truncado silencioso con sufijos tipo "2.4.9-rc1").
--
-- Idempotente donde el motor lo permite. Aplicar una sola vez.
-- =====================================================================

-- 1. Órdenes de rollback de frontend ----------------------------------
CREATE TABLE IF NOT EXISTS ordenes_rollback_front (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    terminal        VARCHAR(100) NOT NULL,
    idApp           INT NOT NULL,
    version_destino VARCHAR(20)  NOT NULL,
    zip_url         VARCHAR(500) NOT NULL,
    estado          ENUM('pendiente','aplicada','cancelada') DEFAULT 'pendiente',
    fecha           DATETIME DEFAULT NOW(),
    fecha_aplicada  DATETIME NULL,
    INDEX idx_terminal_app_estado (terminal, idApp, estado)
);

-- 2. Trazabilidad por máquina en eventos de update --------------------
--    El payload eventoActualizacionFront trae COMPUTERNAME de la PC cliente.
ALTER TABLE eventos_actualizacion
    ADD COLUMN maquina VARCHAR(100) NULL AFTER terminal;

-- 3. Estado transitorio "front actualizando / confirmando boot" -------
--    Es estado puntual del último heartbeat, no histórico.
ALTER TABLE heartbeats
    ADD COLUMN confirmacion_front_pendiente TINYINT(1) NULL DEFAULT 0 AFTER version_front;

-- 4. Unificación de tamaños de versión --------------------------------
--    De VARCHAR(10) a VARCHAR(20) para soportar sufijos de pre-release.
ALTER TABLE eventos_actualizacion MODIFY version      VARCHAR(20) NULL;
ALTER TABLE heartbeats            MODIFY version_back  VARCHAR(20) NULL;
ALTER TABLE heartbeats            MODIFY version_front VARCHAR(20) NULL;
ALTER TABLE apps_cliente          MODIFY version_back  VARCHAR(20) NULL;
ALTER TABLE apps_cliente          MODIFY version_front VARCHAR(20) NULL;
