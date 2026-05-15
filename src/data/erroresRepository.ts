import db from '../db';

class ErroresRepository {

    /**
     * Registra un batch de errores de una instalación.
     * Si el mismo código ya existe para esa terminal, incrementa cantidad
     * y actualiza fecha_ultimo y mensaje.
     */
    async registrarBatch(terminal: string, idApp: number, errores: any[]): Promise<void> {
        if (!errores || errores.length === 0) return;

        const connection = await db.getConnection();

        try {
            for (const error of errores) {
                await connection.query(
                    `INSERT INTO errores_instalaciones
                        (terminal, idApp, codigo, mensaje, cantidad, fecha_primero, fecha_ultimo)
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        cantidad     = cantidad + VALUES(cantidad),
                        mensaje      = VALUES(mensaje),
                        fecha_ultimo = VALUES(fecha_ultimo)`,
                    [
                        terminal,
                        idApp,
                        error.codigo,
                        error.mensaje      ?? null,
                        error.cantidad     ?? 1,
                        error.fechaPrimero ?? new Date(),
                        error.fechaUltimo  ?? new Date(),
                    ]
                );
            }
        } catch (error: any) {
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Verifica si un batch_id ya fue procesado para esta terminal.
     * Usado para garantizar idempotencia ante reenvíos por timeout.
     */
    async verificarBatchProcesado(terminal: string, batchId: string): Promise<boolean> {
        const connection = await db.getConnection();
        try {
            const [rows]: any = await connection.query(
                'SELECT 1 FROM batches_procesados WHERE terminal = ? AND batch_id = ?',
                [terminal, batchId]
            );
            return rows.length > 0;
        } finally {
            connection.release();
        }
    }

    /**
     * Registra un batch_id como procesado para esta terminal.
     * INSERT IGNORE: si por race condition se inserta dos veces, no falla.
     */
    async registrarBatchId(terminal: string, batchId: string): Promise<void> {
        const connection = await db.getConnection();
        try {
            await connection.query(
                'INSERT IGNORE INTO batches_procesados (terminal, batch_id) VALUES (?, ?)',
                [terminal, batchId]
            );
        } finally {
            connection.release();
        }
    }

    /**
     * Elimina registros de batches_procesados con más de 7 días de antigüedad.
     * Llamado por el cron de limpieza en index.ts.
     */
    async limpiarBatchesViejos(): Promise<void> {
        const connection = await db.getConnection();
        try {
            await connection.query(
                'DELETE FROM batches_procesados WHERE fecha < DATE_SUB(NOW(), INTERVAL 7 DAY)'
            );
        } finally {
            connection.release();
        }
    }
}

export const ErroresRepo = new ErroresRepository();
