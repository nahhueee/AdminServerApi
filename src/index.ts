import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import config from './conf/app.config';
import { ErroresRepo } from './data/erroresRepository';
const path = require('path');

const app = express();

//setings
app.set('port', process.env.Port || config.port);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors());
app.use(express.static(path.join(__dirname, 'upload')));

//Starting the server
app.listen(app.get('port'), () => {
    console.log('server ' + process.env.NODE_ENV + ' on port ' + app.get('port'));
});

//#region Rutas
import appsClienteRoute from './routes/appsClienteRoute';
import clientesRoute from './routes/clientesRoute';
import appsRoute from './routes/aplicacionesRoute';
import backupsRoute from './routes/backupsRoute';
import pagosCliRoute from './routes/pagosClienteRoute';
import actualizacionesRoute from './routes/actualizacionesRoute';
import uploadsRoute from './routes/uploadsRoute';
import heartbeatRoute from './routes/heartbeatRoute';
import erroresRoute from './routes/erroresRoute';

app.use('/adminserver/appscliente', appsClienteRoute);
app.use('/adminserver/clientes', clientesRoute);
app.use('/adminserver/apps', appsRoute);
app.use('/adminserver/pagoscliente', pagosCliRoute);
app.use('/adminserver/backups', backupsRoute);
app.use('/adminserver/actualizaciones', actualizacionesRoute);
app.use('/adminserver/uploads', uploadsRoute);
app.use('/adminserver/heartbeat', heartbeatRoute);
app.use('/adminserver/errores', erroresRoute);
//#endregion

//Index Route
app.get('/adminserver', (req, res) => {
    res.status(200).send('Servidor de AdminServer funcionando en este puerto.');
});

// Limpieza periódica de batches_procesados (TTL 7 días).
// Se ejecuta al arrancar y luego cada 24 horas.
const limpiarBatchesViejos = async () => {
    try {
        await ErroresRepo.limpiarBatchesViejos();
    } catch (e: any) {
        console.error('[cron] Error limpiando batches_procesados:', e.message);
    }
};
limpiarBatchesViejos();
setInterval(limpiarBatchesViejos, 24 * 60 * 60 * 1000);

//404
app.use((_req, res) => {
    res.status(404).send('No se encontró el recurso solicitado.');
});
  
