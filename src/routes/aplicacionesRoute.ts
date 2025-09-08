import {AppsRepo} from '../data/aplicacionesRepository';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
const router : Router  = Router();

//#region OBTENER
router.get('/obtener/:idApp', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsRepo.ObtenerVersion(req.params.idApp));

    } catch(error:any){
        let msg = "Error al intentar obtener la versión de la aplicación " + req.params.idApp;
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion

// Export the router
export default router; 