import {ActualizacionRepo} from '../data/actualizacionesRepository';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
const router : Router  = Router();

//#region OBTENER
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