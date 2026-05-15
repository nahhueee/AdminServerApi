-- ============================================================
-- MIGRATION FASE 2 — AdminServer
-- Idempotencia de batches de errores
--
-- Propósito:
--   Evitar que un reenvío por timeout de red duplique el conteo
--   de errores en errores_instalaciones.
--
--   EasySalesApi envía un batch_id (UUID v4) en cada POST a /errores/batch.
--   AdminServer verifica si ese batch_id ya fue procesado para esa terminal.
--   Si ya existe → responde OK sin reprocesar.
--   Si no existe → procesa e inserta el batch_id.
--
-- TTL: los registros se eliminan a los 7 días via cron en AdminServer
--      (index.ts → ErroresRepo.limpiarBatchesViejos(), intervalo 24h).
-- ============================================================

USE dbadminserver;

-- ------------------------------------------------------------
-- 1. batches_procesados — registro de batches ya procesados
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS batches_procesados (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  terminal  VARCHAR(36)  NOT NULL,
  batch_id  VARCHAR(50)  NOT NULL,
  fecha     DATETIME     NOT NULL DEFAULT NOW(),

  UNIQUE KEY uk_terminal_batch (terminal, batch_id),
  INDEX idx_fecha (fecha)
) ENGINE=InnoDB;
