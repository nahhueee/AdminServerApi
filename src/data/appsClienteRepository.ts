import db from '../db';

class AppsClienteRepository{

    async ObtenerAppCliente(data:any){
        const connection = await db.getConnection();
        
        try {
            let consulta = "SELECT ac.terminal, ac.habilitado, ac.mac, c.DNI, c.nombre FROM apps_cliente ac " +
                           "INNER JOIN clientes c on ac.DNI = c.DNI " +
                           "WHERE ac.DNI = ? && ac.idApp = ? ";

            const rows = await connection.query(consulta, [data.dni, data.idApp]);
            if(rows[0][0]){
                if(rows[0][0].mac == data.mac) //Existe la terminal y se está conectando de la maquina correcta
                    return rows[0][0]
                else
                    return {terminal:0, mac:""} //Existe la terminal pero no es correcta la mac
            }

            return null; //No existe terminal, se procede a generar una 

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async EstaHabilitado(data:any){
        const connection = await db.getConnection();
        try {
            let consulta = "SELECT habilitado FROM apps_cliente " +
                           "WHERE DNI = ? && idApp = ? && mac = ? ";

            const rows = await connection.query(consulta, [data.dni, data.idApp, data.mac]);
            if(rows[0][0]){
                if(rows[0][0].habilitado==1)
                    return true;
            }

            return false;

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
 
    async GenerarAppCliente(data:any): Promise<any>{
        const connection = await db.getConnection();
        
        try {
            let existeAppCliente = await ValidarExistencia(connection, data);
            if(!existeAppCliente){//Verificamos si ya existe una app para este cliente
                const consulta = "INSERT INTO apps_cliente(DNI, mac, idApp, habilitado) VALUES (?,?,?,?)";
                const parametros = [data.dni, data.mac, data.idApp, 1];
                
                //Insertamos la app 
                await connection.query(consulta, parametros);
    
                //Obtenemos la app insertada para devolverla
                return await this.ObtenerAppCliente(data)
            }

            return null;

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async InformarActualizacion(DNI:string, idApp:string, version:string): Promise<any>{
        const connection = await db.getConnection();
        
        try {
            const consulta = "UPDATE apps_cliente SET " + 
                             "version = ?, " +
                             "actualizacion = NOW() " +
                             "WHERE DNI = ? && idApp = ? ";

            const parametros = [version, DNI, idApp];
            
            await connection.query(consulta, parametros);

            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
}

async function ValidarExistencia(connection, data:any):Promise<boolean>{
    try {
        let consulta = "SELECT terminal FROM apps_cliente " +
                       "WHERE idApp = ? AND DNI = ? ";
        const rows = await connection.query(consulta,[data.idApp, data.dni,  data.mac]);
        if(rows[0].length > 0) return true;

        return false;
    } catch (error) {
        throw error; 
    }
}

export const AppsClienteRepo = new AppsClienteRepository();





