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

router.get('/obtener/:id', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsRepo.ObtenerAplicacion(req.params.id));

    } catch(error:any){
        let msg = "Error al intentar obtener la aplicación nro " + req.params.idApp;
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion

// Export the router
export default router; 