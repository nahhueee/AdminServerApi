import { Router, Request, Response } from 'express';
import { HeartbeatRepo } from '../data/heartbeatRepository';
import logger from '../log/logger';

const router: Router = Router();

// Recibe el pulso periódico de una instalación.
// EasySalesApi lo llama cada ~10 minutos desde la PC servidora.
router.post('/', async (req: Request, res: Response) => {
    try {
        const { terminal, idApp } = req.body;

        if (!terminal || !idApp) {
            return res.status(400).json({ error: 'terminal e idApp son requeridos' });
        }

        const respuesta = await HeartbeatRepo.registrar(req.body);
        return res.json({ ok: true, rollback: respuesta.rollback });

    } catch (error: any) {
        logger.error('Error al registrar heartbeat. ' + error.message);
        return res.status(500).json({ error: 'No se pudo registrar el heartbeat' });
    }
});

export default router;
