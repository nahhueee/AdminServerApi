import {AppsRepo} from '../data/aplicacionesRepository';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
const router : Router  = Router();

//#region OBTENER
router.get('/obtener', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsRepo.ObtenerAplicaciones());

    } catch(error:any){
        let msg = "Error al intentar obtener las aplicaciones.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.get('/obtener/:idApp', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsRepo.ObtenerAplicacion(req.params.idApp));

    } catch(error:any){
        let msg = "Error al intentar obtener la aplicación nro " + req.params.idApp;
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion

router.put('/modificar', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsRepo.Modificar(req.body));

    } catch(error:any){
        let msg = "Error al intentar modificar la aplicación.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

// Export the router
export default router; 