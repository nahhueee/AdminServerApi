import db from '../db';

export interface HeartbeatRespuesta {
    rollback:      true | null;
    rollbackFront: { version: string; zipUrl: string } | null;
}

class HeartbeatRepository {

    async registrar(data: any): Promise<HeartbeatRespuesta> {
        const connection = await db.getConnection();

        try {
            // Actualiza el timestamp en apps_cliente.
            await connection.query(
                `UPDATE apps_cliente SET ultimo_heartbeat = NOW()
                 WHERE terminal = ? AND idApp = ?`,
                [data.terminal, data.idApp]
            );

            // Inserta en el historial de heartbeats.
            await connection.query(
                `INSERT INTO heartbeats (
                    terminal, idApp, version_back, version_front,
                    confirmacion_front_pendiente,
                    db_status, tiempo_activo, errores_recientes,
                    ultimo_backup_fecha, ultimo_backup_ok, terminales_lan_activas
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.terminal,
                    data.idApp,
                    data.versionBack ?? null,
                    data.versionFront ?? null,
                    data.confirmacionFrontPendiente ? 1 : 0,
                    data.dbStatus ?? null,
                    data.tiempoActivo ?? null,
                    data.erroresRecientes ?? 0,
                    data.ultimoBackupFecha ?? null,
                    data.ultimoBackupOk !== undefined ? (data.ultimoBackupOk ? 1 : 0) : null,
                    data.terminalesLanActivas ?? 1,
                ]
            );

            // Persiste el evento de actualización si viene en el payload.
            if (data.eventoActualizacion) {
                const ev = data.eventoActualizacion;
                await connection.query(
                    `INSERT INTO eventos_actualizacion
                        (terminal, idApp, tipo, version, error, reintentos, fecha)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        data.terminal,
                        data.idApp,
                        ev.tipo        ?? 'desconocido',
                        ev.version     ?? null,
                        ev.error       ?? null,
                        ev.reintentos  ?? 0,
                        ev.fecha ? new Date(ev.fecha) : new Date(),
                    ]
                );
            }

            // Persiste el evento de actualización del FRONTEND si viene en el payload.
            // Se distingue del back con el prefijo 'front_' en la columna tipo.
            if (data.eventoActualizacionFront) {
                const evf = data.eventoActualizacionFront;
                await connection.query(
                    `INSERT INTO eventos_actualizacion
                        (terminal, maquina, idApp, tipo, version, error, reintentos, fecha)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        data.terminal,
                        evf.maquina ?? null,
                        data.idApp,
                        'front_' + (evf.resultado ?? 'desconocido'),
                        evf.versionActual ?? evf.versionOrigen ?? null,
                        evf.error ?? null,
                        0,
                        evf.timestamp ? new Date(evf.timestamp) : new Date(),
                    ]
                );

                // Si el front booteó OK, una orden de rollback de front pendiente
                // se considera aplicada (confirmación automática).
                if (evf.resultado === 'ok') {
                    await connection.query(
                        `UPDATE ordenes_rollback_front
                         SET estado = 'aplicada', fecha_aplicada = NOW()
                         WHERE terminal = ? AND idApp = ? AND estado = 'pendiente'`,
                        [data.terminal, data.idApp]
                    );
                }
            }

            // --- Rollback de BACKEND ---------------------------------------
            const [rows]: any = await connection.query(
                `SELECT id, version_origen FROM ordenes_rollback
                 WHERE terminal = ? AND idApp = ? AND estado = 'pendiente'
                 LIMIT 1`,
                [data.terminal, data.idApp]
            );

            const orden = rows[0] ?? null;
            let rollback: true | null = null;

            if (orden) {
                // Si la versión reportada ya es distinta a la versión "mala" → rollback aplicado.
                if (data.versionBack && data.versionBack !== orden.version_origen) {
                    await connection.query(
                        `UPDATE ordenes_rollback
                         SET estado = 'aplicada', fecha_aplicada = NOW()
                         WHERE id = ?`,
                        [orden.id]
                    );
                } else {
                    // Aún sigue en la versión mala → seguir instruyendo rollback.
                    rollback = true;
                }
            }

            // --- Rollback de FRONTEND --------------------------------------
            const [rowsFront]: any = await connection.query(
                `SELECT id, version_destino, zip_url FROM ordenes_rollback_front
                 WHERE terminal = ? AND idApp = ? AND estado = 'pendiente'
                 ORDER BY fecha DESC LIMIT 1`,
                [data.terminal, data.idApp]
            );
            const ordenFront = rowsFront[0] ?? null;

            return {
                rollback,
                rollbackFront: ordenFront
                    ? { version: ordenFront.version_destino, zipUrl: ordenFront.zip_url }
                    : null,
            };

        } catch (error: any) {
            throw error;
        } finally {
            connection.release();
        }
    }
}

export const HeartbeatRepo = new HeartbeatRepository();
