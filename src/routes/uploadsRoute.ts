import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from './../conf/app.config';
import { validarTokenCI } from '../middlewares/ciAuth';
import { ActualizacionRepo } from '../data/actualizacionesRepository';

const router = Router();

const upload = multer({
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (_, file, cb) => {
    if (!file.originalname.endsWith('.zip')) {
      cb(new Error('Solo se permiten archivos ZIP'));
    } else {
      cb(null, true);
    }
  }
});

router.post(
  '/subir-zip',
  validarTokenCI,
  upload.single('file'),
  async (req, res) => {
    try {
      const { version, app, idApp, tipo } = req.body;

      if (!req.file || !version || !app || !idApp || !tipo) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      const ruta = path.join(__dirname, '../../updates/', app, tipo);
      fs.mkdirSync(ruta, { recursive: true });

      const zipName = `update-${version}.zip`;
      const zipPath = path.join(ruta, zipName);

      fs.writeFileSync(zipPath, new Uint8Array(req.file.buffer));

      const server = config.serverUrl;
      const link = `${server}/downloads/${app}/${tipo}/${zipName}`;


      // Mantener solo las últimas 3 versiones
      const files = fs.readdirSync(ruta)
      .map(file => ({
            name: file,
            time: fs.statSync(path.join(ruta, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // más nuevos primero

      if (files.length > 3) {
        const toDelete = files.slice(3); // desde el 4to en adelante

        for (const file of toDelete) {
            const filePath = path.join(ruta, file.name);
            fs.unlinkSync(filePath);
            console.log(`Zip antiguo eliminado: ${file.name}`);
        }
      }


      const data = {
        idApp,
        resumen: `Nueva versión ${tipo} ${version}`,
        version,
        link,
        tipo
      }
      
      const respuesta = await ActualizacionRepo.AgregarDesdeCI(data)
      if(respuesta == "OK"){
            res.json({
            ok: true,
            version,
            estado: 'borrador'
        });
      }else{
        res.json("Se subió el archivo, pero no se pudo crear registro de actualización. " + respuesta)
      }
      
    } catch (err: any) {
      res.status(500).json({
        error: 'Error subiendo actualización',
        detalle: err.message
      });
    }
  }
);

export default router;
