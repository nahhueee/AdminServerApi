import db from '../db';
import { App } from '../models/App';

class AplicacionesRepository{

    async ObtenerAplicaciones(){
        const connection = await db.getConnection();
        
        try {
            let consulta = "SELECT * FROM aplicaciones ORDER BY id DESC";

            const [rows] = await connection.query(consulta);

            const apps:App[] = [];
            if (Array.isArray(rows)) {
                for (let i = 0; i < rows.length; i++) { 
                    const row = rows[i];
                    
                    let app:App = new App();
                    app.id = row['id'];
                    app.portada = row['portada'];
                    app.nombre = row['nombre'];
                    app.version = await ObtenerUltimaVersion(connection, app.id);
                    apps.push(app)
                }
            }

            return apps;

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    
    async ObtenerAplicacion(id:string){
        const connection = await db.getConnection();
        
        try {
            let consulta = "SELECT a.*, COUNT(ac.idApp) AS total_clientes FROM aplicaciones a " + 
                           "LEFT JOIN apps_cliente ac ON a.id = ac.idApp " +
                           "WHERE a.id = ? " +
                           "GROUP BY a.id ";

            const rows = await connection.query(consulta, [id]);
            let app:App = new App();
            app.id          = rows[0][0].id;
            app.portada     = rows[0][0].portada;
            app.nombre      = rows[0][0].nombre;
            app.clientes    = rows[0][0].total_clientes;
            app.versionBackend  = await ObtenerUltimaVersionPorTipo(connection, app.id, 'backend');
            app.versionFrontend = await ObtenerUltimaVersionPorTipo(connection, app.id, 'frontend');
            // version legacy — apunta al backend para no romper clientes existentes
            app.version = app.versionBackend ?? '1.0.0';

            return app;

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
   
}

// Usada en ObtenerAplicaciones (listado) — devuelve última versión sin filtrar por tipo
async function ObtenerUltimaVersion(connection, idApp) {
    try {
        const consulta = "SELECT version FROM actualizaciones WHERE idApp = ? ORDER BY fecha_publicacion DESC, id DESC LIMIT 1";
        const rows = await connection.query(consulta, [idApp]);
        return (rows[0] && rows[0].length > 0) ? rows[0][0].version : '1.0.0';
    } catch(error) {
        throw error;
    }
}

// Usada en ObtenerAplicacion (detalle) — devuelve la última versión en produccion por tipo
async function ObtenerUltimaVersionPorTipo(connection, idApp, tipo: 'backend' | 'frontend'): Promise<string | undefined> {
    try {
        const consulta = `
            SELECT version FROM actualizaciones
            WHERE idApp = ? AND tipo = ? AND estado = 'produccion'
            ORDER BY fecha_publicacion DESC, id DESC
            LIMIT 1
        `;
        const rows = await connection.query(consulta, [idApp, tipo]);
        return (rows[0] && rows[0].length > 0) ? rows[0][0].version : undefined;
    } catch(error) {
        throw error;
    }
}

export const AppsRepo = new AplicacionesRepository();


