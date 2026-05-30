import { Router, Request, Response } from 'express';
import { ErroresRepo } from '../data/erroresRepository';
import logger from '../log/logger';

const router: Router = Router();

// Ingesta: recibe un batch de errores desde una instalacion.
// EasySalesApi lo llama cada ~15 minutos con los errores acumulados.
router.post('/batch', async (req: Request, res: Response) => {
    try {
        const { terminal, idApp, batch_id, errores } = req.body;

        if (!terminal || !idApp) {
            return res.status(400).json({ error: 'terminal e idApp son requeridos' });
        }

        if (!Array.isArray(errores) || errores.length === 0) {
            return res.json({ ok: true, procesados: 0 });
        }

        if (batch_id) {
            const yaProcesado = await ErroresRepo.verificarBatchProcesado(terminal, batch_id);
            if (yaProcesado) {
                return res.json({ ok: true, procesados: 0, duplicado: true });
            }
        }

        await ErroresRepo.registrarBatch(terminal, idApp, errores);

        if (batch_id) {
            await ErroresRepo.registrarBatchId(terminal, batch_id);
        }

        return res.json({ ok: true, procesados: errores.length });

    } catch (error: any) {
        logger.error('Error al registrar batch de errores. ' + error.message);
        return res.status(500).json({ error: 'No se pudo registrar el batch de errores' });
    }
});

// Lectura — panel de AdminServer

// Errores agregados por codigo para una app.
// Devuelve: codigo, cantidad_total, instalaciones_afectadas, primera/ultima_ocurrencia.
router.get('/agregado/:idApp', async (req: Request, res: Response) => {
    try {
        const idApp = Number(req.params.idApp);
        if (!idApp) return res.status(400).json({ error: 'idApp invalido' });

        const rows = await ErroresRepo.ObtenerErroresAgregados(idApp);
        return res.json(rows);
    } catch (error: any) {
        logger.error('Error al obtener errores agregados. ' + error.message);
        return res.status(500).json({ error: 'No se pudieron obtener los errores agregados' });
    }
});

// Drill-down: instalaciones que reportaron un codigo especifico.
// Devuelve: cliente, DNI, cantidad, primera/ultima_ocurrencia, mensaje.
router.get('/codigo/:idApp/:codigo', async (req: Request, res: Response) => {
    try {
        const idApp  = Number(req.params.idApp);
        const codigo = req.params.codigo;
        if (!idApp || !codigo) return res.status(400).json({ error: 'idApp y codigo son requeridos' });

        const rows = await ErroresRepo.ObtenerDetalleError(idApp, codigo);
        return res.json(rows);
    } catch (error: any) {
        logger.error('Error al obtener detalle de error. ' + error.message);
        return res.status(500).json({ error: 'No se pudo obtener el detalle del error' });
    }
});

export default router;
