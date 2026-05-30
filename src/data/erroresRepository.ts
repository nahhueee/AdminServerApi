import db from '../db';

class ErroresRepository {

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

    // Errores agregados por codigo para una app.
    // Suma cantidades y cuenta instalaciones (DNI) distintas afectadas.
    async ObtenerErroresAgregados(idApp: number): Promise<any[]> {
        const connection = await db.getConnection();
        try {
            const [rows]: any = await connection.query(
                `SELECT
                    ei.codigo,
                    SUM(ei.cantidad)       AS cantidad_total,
                    COUNT(DISTINCT ac.DNI) AS instalaciones_afectadas,
                    MIN(ei.fecha_primero)  AS primera_ocurrencia,
                    MAX(ei.fecha_ultimo)   AS ultima_ocurrencia
                FROM errores_instalaciones ei
                INNER JOIN apps_cliente ac
                    ON ei.terminal = ac.terminal AND ei.idApp = ac.idApp
                WHERE ei.idApp = ?
                GROUP BY ei.codigo
                ORDER BY cantidad_total DESC`,
                [idApp]
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    // Detalle de un codigo de error: que instalaciones lo reportaron y cuantas veces.
    // Agrupa por DNI (instalacion) para una fila por comercio.
    async ObtenerDetalleError(idApp: number, codigo: string): Promise<any[]> {
        const connection = await db.getConnection();
        try {
            const [rows]: any = await connection.query(
                `SELECT
                    c.nombre               AS cliente,
                    ac.DNI,
                    SUM(ei.cantidad)       AS cantidad,
                    MIN(ei.fecha_primero)  AS primera_ocurrencia,
                    MAX(ei.fecha_ultimo)   AS ultima_ocurrencia,
                    MAX(ei.mensaje)        AS mensaje
                FROM errores_instalaciones ei
                INNER JOIN apps_cliente ac
                    ON ei.terminal = ac.terminal AND ei.idApp = ac.idApp
                INNER JOIN clientes c
                    ON ac.DNI = c.DNI
                WHERE ei.idApp = ? AND ei.codigo = ?
                GROUP BY ac.DNI, c.nombre
                ORDER BY cantidad DESC`,
                [idApp, codigo]
            );
            return rows;
        } finally {
            connection.release();
        }
    }
}

export const ErroresRepo = new ErroresRepository();
