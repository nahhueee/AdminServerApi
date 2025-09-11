import {PagoCliRepo} from '../data/pagosClienteRepository';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
const router : Router  = Router();

//#region OBTENER
router.post('/obtener', async (req:Request, res:Response) => {
    try{ 
        res.json(await PagoCliRepo.Obtener(req.body));

    } catch(error:any){
        let msg = "Error al obtener el listado de pagos para el cliente.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion


//#region ABM
router.post('/agregar', async (req:Request, res:Response) => {
    try{ 
        res.json(await PagoCliRepo.Agregar(req.body));

    } catch(error:any){
        let msg = "Error al intentar agregar el pago.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.delete('/eliminar/:id', async (req:Request, res:Response) => {
    try{ 
        res.json(await PagoCliRepo.Eliminar(req.params.id));

    } catch(error:any){
        let msg = "Error al intentar eliminar el pago.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion

// Export the router
export default router; 