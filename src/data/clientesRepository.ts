import db from '../db';

class ClientesRepository{

    async ObtenerCliente(DNI:string){
        const connection = await db.getConnection();
        
        try {
            let consulta = "SELECT id, nombre FROM clientes " +
                           "WHERE dni = ? ";

            const rows = await connection.query(consulta, [DNI]);
            return rows[0][0];

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
}

export const ClienteRepo = new ClientesRepository();


