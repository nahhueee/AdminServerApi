-- ============================================================
-- MIGRATION FASE 3 — AdminServer
-- Backup Health Check
--
-- Agrega validación estructural de archivos .sql a backups_registro.
-- La validación se dispara asincrónicamente en el endpoint de upload
-- y actualiza las dos columnas nuevas sin bloquear al cliente.
--
-- Estado inicial de filas existentes: 'pendiente' (sin validar aún).
-- ============================================================

USE dbadminserver;

-- ------------------------------------------------------------
-- 1. Extender backups_registro con resultado de validación
-- ------------------------------------------------------------

ALTER TABLE backups_registro
  ADD COLUMN validacion_estado  VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  ADD COLUMN validacion_detalle TEXT NULL,
  ADD INDEX idx_validacion (validacion_estado);

-- Nota: el estado de backup se calcula dinámicamente en appsClienteRepository
-- (ObtenerFlota), no en una vista, para mantener consistencia con el resto del
-- codebase (no se usan vistas en ningún otro módulo).


alter table apps_cliente modify version_back VARCHAR(10) DEFAULT "";
alter table apps_cliente modify version_back VARCHAR(10) DEFAULT "";
