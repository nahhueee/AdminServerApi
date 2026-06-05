import {AppsClienteRepo} from '../data/appsClienteRepository';
import {Router, Request, Response} from 'express';
import logger from '../log/logger';
const router : Router  = Router();

//Obtiene la terminal del cliente asociada a su DNI, para una app especifica
router.get('/obtener/:dni/:idApp', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsClienteRepo.ObtenerAppCliente({dni:req.params.dni, idApp:req.params.idApp}));
    } catch(error:any){
        let msg = "Error al intentar obtener los datos de la app del cliente.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

//Obtiene la terminal del cliente asociada a su DNI y su mac, para una app especifica
//Borrar proximamente
router.get('/obtener/:dni/:idApp/:mac', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsClienteRepo.ObtenerAppClienteMac({dni:req.params.dni, idApp:req.params.idApp, mac: req.params.mac}));
    } catch(error:any){
        let msg = "Error al intentar obtener los datos de la app del cliente.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

//Verifica si el cliente y mac estan habilitados 
//Borrar proximamente
router.get('/habilitado/:dni/:idApp/:mac', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsClienteRepo.EstaHabilitado({dni:req.params.dni, idApp:req.params.idApp, mac: req.params.mac}));
    } catch(error:any){
        let msg = "Error al intentar obtener la terminal del cliente.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

//Verifica si el cliente esta habilitado
router.get('/habilitado/:terminal/:idApp', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsClienteRepo.TerminalHabilitada({idApp:req.params.idApp, terminal: req.params.terminal}));
    } catch(error:any){
        let msg = "Error al intentar obtener la verificacion para el cliente.";
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
router.get('/informar/:tipo/:terminal/:version', async (req:Request, res:Response) => {
    try{ 
        if(req.params.tipo == "backend"){
            res.json(await AppsClienteRepo.InformarVersionBackend(req.params.terminal, req.params.version));
        }
        if(req.params.tipo == "frontend"){
            res.json(await AppsClienteRepo.InformarVersionFrontend(req.params.terminal, req.params.version));
        }

        res.status(401);
    } catch(error:any){
        let msg = "Error al intentar informar la versión de la app.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});


router.put('/actualizar-estado', async (req:Request, res:Response) => {
    try{ 
        res.json(await AppsClienteRepo.ActualizarEstadoTerminal(req.body));

    } catch(error:any){
        let msg = "Error al intentar actualizar el estado de la terminal.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

router.delete('/eliminar/:idTerminal', async (req:Request, res:Response) => {
    try{
        res.json(await AppsClienteRepo.EliminarTerminal(req.params.idTerminal));

    } catch(error:any){
        let msg = "Error al intentar eliminar la terminal.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

// Ordena un rollback para una terminal específica.
// La terminal recibirá la instrucción en la respuesta del próximo heartbeat.
router.post('/rollback', async (req:Request, res:Response) => {
    try{
        const { terminal, idApp, versionOrigen } = req.body;
        if (!terminal || !idApp || !versionOrigen) {
            return res.status(400).send('terminal, idApp y versionOrigen son requeridos');
        }
        await AppsClienteRepo.OrdenarRollback(terminal, idApp, versionOrigen);
        return res.json('OK');
    } catch(error:any){
        let msg = "Error al ordenar el rollback.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

// Cancela la orden de rollback pendiente de una terminal
router.delete('/rollback/:terminal/:idApp', async (req:Request, res:Response) => {
    try{
        await AppsClienteRepo.CancelarRollback(req.params.terminal, req.params.idApp);
        return res.json('OK');
    } catch(error:any){
        let msg = "Error al cancelar el rollback.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

// Ordena un rollback de FRONTEND para una terminal.
// Requiere la versión destino y la URL del ZIP del installer.
router.post('/rollback-front', async (req:Request, res:Response) => {
    try{
        const { terminal, idApp, versionDestino, zipUrl } = req.body;
        if (!terminal || !idApp || !versionDestino || !zipUrl) {
            return res.status(400).send('terminal, idApp, versionDestino y zipUrl son requeridos');
        }
        await AppsClienteRepo.OrdenarRollbackFront(terminal, idApp, versionDestino, zipUrl);
        return res.json('OK');
    } catch(error:any){
        let msg = "Error al ordenar el rollback de front.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

// Cancela la orden de rollback de front pendiente de una terminal
router.delete('/rollback-front/:terminal/:idApp', async (req:Request, res:Response) => {
    try{
        await AppsClienteRepo.CancelarRollbackFront(req.params.terminal, req.params.idApp);
        return res.json('OK');
    } catch(error:any){
        let msg = "Error al cancelar el rollback de front.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});

// Panel de flota: estado de todas las terminales de una app
router.get('/flota/:idApp', async (req:Request, res:Response) => {
    try{
        res.json(await AppsClienteRepo.ObtenerFlota(req.params.idApp));
    } catch(error:any){
        let msg = "Error al obtener la flota de la app.";
        logger.error(msg + " " + error.message);
        res.status(500).send(msg);
    }
});


// Export the router
export default router;
