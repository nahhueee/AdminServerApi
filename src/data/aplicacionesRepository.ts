import db from '../db';

class AplicacionesRepository{

    async ObtenerVersion(idApp){
        const connection = await db.getConnection();
        
        try {
            let consulta = "SELECT version, link, info, estado FROM aplicaciones " +
                           "WHERE id = ? ";

            const rows = await connection.query(consulta, [idApp]);
            return rows[0][0];

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
}

export const AppsRepo = new AplicacionesRepository();


