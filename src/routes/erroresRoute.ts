import { Router, Request, Response } from 'express';
import { ErroresRepo } from '../data/erroresRepository';
import logger from '../log/logger';

const router: Router = Router();

// Recibe un batch de errores desde una instalación.
// EasySalesApi lo llama cada ~15 minutos con los errores acumulados desde el último envío.
//
// Payload esperado:
// {
//   terminal:  string,
//   idApp:     number,
//   batch_id?: string (UUID v4 — presente en clientes >= Fase 2)
//   errores:   [{ codigo, mensaje, cantidad, fechaPrimero, fechaUltimo }]
// }
//
// Idempotencia: si batch_id está presente y ya fue procesado para esa terminal,
// responde OK sin reprocesar. Esto cubre el caso de reenvío por timeout de red.
router.post('/batch', async (req: Request, res: Response) => {
    try {
        const { terminal, idApp, batch_id, errores } = req.body;

        if (!terminal || !idApp) {
            return res.status(400).json({ error: 'terminal e idApp son requeridos' });
        }

        if (!Array.isArray(errores) || errores.length === 0) {
            return res.json({ ok: true, procesados: 0 });
        }

        // Idempotencia: verificar si este batch ya fue procesado
        if (batch_id) {
            const yaProcesado = await ErroresRepo.verificarBatchProcesado(terminal, batch_id);
            if (yaProcesado) {
                return res.json({ ok: true, procesados: 0, duplicado: true });
            }
        }

        await ErroresRepo.registrarBatch(terminal, idApp, errores);

        // Registrar batch_id para futuras verificaciones (TTL 7 días via cron)
        if (batch_id) {
            await ErroresRepo.registrarBatchId(terminal, batch_id);
        }

        return res.json({ ok: true, procesados: errores.length });

    } catch (error: any) {
        logger.error('Error al registrar batch de errores. ' + error.message);
        return res.status(500).json({ error: 'No se pudo registrar el batch de errores' });
    }
});

export default router;
