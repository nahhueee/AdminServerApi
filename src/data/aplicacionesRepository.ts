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
            app.id = rows[0][0].id;
            app.portada = rows[0][0].portada;
            app.nombre = rows[0][0].nombre;
            app.clientes = rows[0][0].total_clientes;
            app.version = await ObtenerUltimaVersion(connection, app.id);

            return app;

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
   
}

async function ObtenerUltimaVersion(connection, idApp) {
    try {
        let consulta = "SELECT version FROM actualizaciones WHERE idApp = ? ORDER BY fecha_publicacion DESC, id DESC LIMIT 1";
        const rows = await connection.query(consulta, [idApp]);
        if(rows[0] && rows[0].length > 0){
            return rows[0][0].version;
        }else{
            return "1.0.0";
        }
    }catch(error){
        throw error;
    }
}

export const AppsRepo = new AplicacionesRepository();


