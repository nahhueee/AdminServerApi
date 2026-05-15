import db from '../db';

export interface HeartbeatRespuesta {
    rollback: true | null;
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
                    db_status, tiempo_activo, errores_recientes,
                    ultimo_backup_fecha, ultimo_backup_ok, terminales_lan_activas
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.terminal,
                    data.idApp,
                    data.versionBack ?? null,
                    data.versionFront ?? null,
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

            // Verifica si existe una orden de rollback pendiente para esta terminal.
            const [rows]: any = await connection.query(
                `SELECT id, version_origen FROM ordenes_rollback
                 WHERE terminal = ? AND idApp = ? AND estado = 'pendiente'
                 LIMIT 1`,
                [data.terminal, data.idApp]
            );

            const orden = rows[0] ?? null;

            if (!orden) {
                return { rollback: null };
            }

            // Si la versión reportada ya es distinta a la versión "mala" → rollback aplicado.
            if (data.versionBack && data.versionBack !== orden.version_origen) {
                await connection.query(
                    `UPDATE ordenes_rollback
                     SET estado = 'aplicada', fecha_aplicada = NOW()
                     WHERE id = ?`,
                    [orden.id]
                );
                return { rollback: null };
            }

            // Aún sigue en la versión mala → seguir instruyendo rollback.
            return { rollback: true };

        } catch (error: any) {
            throw error;
        } finally {
            connection.release();
        }
    }
}

export const HeartbeatRepo = new HeartbeatRepository();
