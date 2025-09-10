import {ClienteRepo} from '../data/clientesRepository';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
const router : Router  = Router();

//#region OBTENER
router.post('/obtener', async (req:Request, res:Response) => {
    try{ 
        res.json(await ClienteRepo.Obtener(req.body));

    } catch(error:any){
        let msg = "Error al obtener el listado de clientes.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});


router.get('/obtener/:dni', async (req:Request, res:Response) => {
    try{ 

        const resultado = await ClienteRepo.ObtenerCliente(req.params.dni)
        res.json(resultado);

    } catch(error:any){
        let msg = "Error al intentar obtener el cliente con DNI " + req.params.dni;
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});
//#endregion

// Export the router
export default router; 