import db from '../db';
import { App } from '../models/App';

class AplicacionesRepository{

    async ObtenerAplicaciones(){
        const connection = await db.getConnection();
        
        try {
            let consulta = "SELECT a.*, COUNT(ac.idApp) AS total_clientes FROM aplicaciones a " + 
                           "LEFT JOIN apps_cliente ac ON a.id = ac.idApp " +
                           "GROUP BY a.id ";

            const rows = await connection.query(consulta);
            return rows[0];

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
            return rows[0][0];

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async Actualizar(aplicacion:App){
        const connection = await db.getConnection();
        
        try {
            let consulta = " UPDATE aplicaciones " +
                           " SET estado = ?, version = ?, link = ?, info = ? " +
                           " WHERE id = ? "

            await connection.query(consulta, [aplicacion.estado, aplicacion.version, aplicacion.link, aplicacion.info, aplicacion.id]);
            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
}

export const AppsRepo = new AplicacionesRepository();


