import {AppsClienteRepo} from '../data/appsClienteRepository';
import {ClienteRepo} from '../data/clientesRepository'
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
const router : Router  = Router();

//Obtiene la terminal del cliente asociada a su DNI y su mac, para una app especifica
router.get('/obtener/:dni/:idApp/:mac', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsClienteRepo.ObtenerAppCliente({dni:req.params.dni, idApp:req.params.idApp, mac: req.params.mac}));
    } catch(error:any){
        let msg = "Error al intentar obtener los datos de la app del cliente.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

//Verifica si el cliente y mac estan habilitados 
router.get('/habilitado/:dni/:idApp/:mac', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsClienteRepo.EstaHabilitado({dni:req.params.dni, idApp:req.params.idApp, mac: req.params.mac}));
    } catch(error:any){
        let msg = "Error al intentar obtener la terminal del cliente.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

//Genera una nueva terminal para el usuario y su mac
router.post('/generar', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsClienteRepo.GenerarAppCliente(req.body));
    } catch(error:any){
        let msg = "Error al intentar generar una nueva app para el cliente.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

//Informa al servidor la versión actual del sistema para la terminal
router.put('/informar', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsClienteRepo.InformarActualizacion(req.body.dni, req.body.idApp, req.body.version));
    } catch(error:any){
        let msg = "Error al intentar informar la versión de la app.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});


// Export the router
export default router; 