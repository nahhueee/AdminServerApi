import {BackupServ} from '../services/backupsService';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
import multer from 'multer';
import path from 'path';

const router : Router  = Router();

// Configuración de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); 
    }
});
const upload = multer({ storage });


router.post('/upload', upload.single('backup'), async (req:Request, res:Response) => {
       
    try{ 
        const { app, dni } = req.body;
        res.json(await BackupServ.GuardarRespaldo(app,dni));

    } catch(error:any){
        let msg = "No se pudo subir el respaldo.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

// Export the router
export default router; 