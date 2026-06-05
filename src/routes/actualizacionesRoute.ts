import {ActualizacionRepo} from '../data/actualizacionesRepository';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
import { AppsClienteRepo } from '../data/appsClienteRepository';
const router : Router  = Router();

//#region OBTENER
router.get('/versiones-backend/:idApp', async (req:Request, res:Response) => {
    try {
        res.json(await ActualizacionRepo.ObtenerVersionesBackend(Number(req.params.idApp)));
    } catch(error:any){
        logger.error("Error al obtener versiones backend. " + error.message);
        res.status(500).send("Error al obtener versiones backend.");
    }
});

router.get('/compatibilidades/:idApp/:versionFrontend', async (req:Request, res:Response) => {
    try {
        res.json(await ActualizacionRepo.ObtenerCompatibilidades(Number(req.params.idApp), req.params.versionFrontend));
    } catch(error:any){
        logger.error("Error al obtener compatibilidades. " + error.message);
        res.status(500).send("Error al obtener compatibilidades.");
    }
});

router.post('/obtener', async (req:Request, res:Response) => {
    try{ 
        res.json(await ActualizacionRepo.Obtener(req.body));

    } catch(error:any){
        let msg = "Error al obtener el listado de actualizaciones de la app.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.get('/ultima-version/:idApp', async (req:Request, res:Response) => {
    try{ 
        res.json(await ActualizacionRepo.ObtenerUltimaVersionApp(req.params.idApp));

    } catch(error:any){
        let msg = "Error al obtener la ultima version de la app.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.get('/ultima-version-frontend/:idApp/:backendVersion', async (req:Request, res:Response) => {
    try{
        const terminal = (req.query.terminal as string) ?? null;
        const release = await ActualizacionRepo.ObtenerUltimaVersionFrontend(req.params.idApp, req.params.backendVersion, terminal);
        // Sin update disponible → 204 No Content (contrato que entiende el updater
        // de Tauri). Devolver `200 null` rompe la deserialización del cliente.
        if (!release) return res.status(204).send();
        res.json(release);
    } catch(error:any){
        let msg = "Error al obtener la ultima version de la app.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.get('/ultima-version-backend/:idApp/:terminal', async (req:Request, res:Response) => {
    try{ 
        const habilitado = await AppsClienteRepo.TerminalHabilitada({
        terminal: req.params.terminal,
        idApp: req.params.idApp
    });

    if (!habilitado) {
        return res.status(403).json({
            error: true,
            mensaje: 'Terminal no habilitada para actualizar'
        });
    }

    const version = await ActualizacionRepo.ObtenerUltimaVersionBackend(
        req.params.idApp,
        req.params.terminal
    );

    if (!version) {
        return res.status(404).json({
            error: true,
            mensaje: 'No hay versiones disponibles'
        });
    }

    return res.json(version);

    } catch(error:any){
        let msg = "Error al obtener la ultima version de la app.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion


//#region ABM
router.post('/agregar', async (req:Request, res:Response) => {
    try{ 
        res.json(await ActualizacionRepo.Agregar(req.body));

    } catch(error:any){
        let msg = "Error al intentar agregar la actualizacion.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.put('/modificar', async (req:Request, res:Response) => {
    try{ 
        res.json(await ActualizacionRepo.Modificar(req.body));

    } catch(error:any){
        let msg = "Error al intentar modificar la actualizacion.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});


router.delete('/eliminar/:id', async (req:Request, res:Response) => {
    try{ 
        res.json(await ActualizacionRepo.Eliminar(req.params.id));

    } catch(error:any){
        let msg = "Error al intentar eliminar la actualizacion.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion

// Export the router
export default router; 