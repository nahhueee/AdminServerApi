import { BackupServ } from '../services/backupsService';
import { Router, Request, Response } from 'express';
import logger from '../log/logger';
import multer from 'multer';
import path from 'path';

const router: Router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// Recibe y almacena un backup enviado por EasySalesApi
router.post('/upload', upload.single('backup'), async (req: Request, res: Response) => {
    try {
        const { app, dni } = req.body;
        if (!app || !dni) {
            return res.status(400).send('app y dni son requeridos');
        }
        res.json(await BackupServ.GuardarRespaldo(app, dni));
    } catch (error: any) {
        const msg = 'No se pudo guardar el respaldo.';
        logger.error(msg + ' ' + error.message);
        res.status(500).send(msg);
    }
});

// Lista los backups disponibles para un cliente
router.get('/listar/:idApp/:dni', async (req: Request, res: Response) => {
    try {
        res.json(await BackupServ.ListarBackups(req.params.dni, Number(req.params.idApp)));
    } catch (error: any) {
        const msg = 'No se pudo obtener el listado de backups.';
        logger.error(msg + ' ' + error.message);
        res.status(500).send(msg);
    }
});

export default router;
