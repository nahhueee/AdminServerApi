import db from '../db';
import { PagoCliente } from '../models/PagoCliente';

class PagosClienteRepository{

     async Obtener(filtros:any){
        const connection = await db.getConnection();
        
        try {
             //Obtengo la query segun los filtros
            let queryRegistros = await ObtenerQuery(filtros,false);
            let queryTotal = await ObtenerQuery(filtros,true);

            //Obtengo la lista de registros y el total
            const [rows] = await connection.query(queryRegistros);
            const resultado = await connection.query(queryTotal);

            const pagos:PagoCliente[] = [];

            if (Array.isArray(rows)) {
                for (let i = 0; i < rows.length; i++) { 
                    const row = rows[i];
                    
                    let pago:PagoCliente = new PagoCliente();
                    pago.id = row['id'];
                    pago.idCliente = row['idCliente'];
                    pago.monto = parseFloat(row['monto']);
                    pago.fecha = row['fecha'];
                    pago.obs = row['obs'];

                    pagos.push(pago)
                }
            }

            return {total:resultado[0][0].total, registros:pagos};

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    //#region ABM
    async Agregar(data:any): Promise<string>{
        const connection = await db.getConnection();
        
        try {
            const consulta = "INSERT INTO pagos_cliente(idCliente, monto, fecha, obs) VALUES (?,?,NOW(),?)";
            const parametros = [data.idCliente, data.monto, data.obs];
            
            await connection.query(consulta, parametros);
            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async Eliminar(id:string): Promise<string>{
        const connection = await db.getConnection();
        
        try {
            await connection.query("DELETE FROM pagos_cliente WHERE id = ?", [id]);
            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
    //#endregion
}

async function ObtenerQuery(filtros:any,esTotal:boolean):Promise<string>{
    try {
        //#region VARIABLES
        let query:string;
        let filtro:string = "";
        let paginado:string = "";
    
        let count:string = "";
        let endCount:string = "";
        //#endregion

        // #region FILTROS
        if (filtros.idCliente != null && filtros.idCliente != 0) 
            filtro += " WHERE idCliente = "+ filtros.idCliente;
        // #endregion

        if (esTotal)
        {//Si esTotal agregamos para obtener un total de la consulta
            count = "SELECT COUNT(*) AS total FROM ( ";
            endCount = " ) as subquery";
        }
        else
        {//De lo contrario paginamos
            if (filtros.tamanioPagina != null)
                paginado = " LIMIT " + filtros.tamanioPagina + " OFFSET " + ((filtros.pagina - 1) * filtros.tamanioPagina);
        }
            
        //Arma la Query con el paginado y los filtros correspondientes
        query = count +
            " SELECT * " +
            " FROM pagos_cliente " +
            filtro +
            " ORDER BY fecha DESC, id DESC" +
            paginado +
            endCount;

        return query;
            
    } catch (error) {
        throw error; 
    }
}

export const PagoCliRepo = new PagosClienteRepository();


