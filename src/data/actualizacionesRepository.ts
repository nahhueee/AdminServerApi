import moment from 'moment';
import db from '../db';
import { Actualizacion } from '../models/Actualizacion';

class ActualizacionesRepository{

    async Obtener(filtros:any){
        const connection = await db.getConnection();
        
        try {
             //Obtengo la query segun los filtros
            let queryRegistros = await ObtenerQuery(filtros,false);
            let queryTotal = await ObtenerQuery(filtros,true);

            //Obtengo la lista de registros y el total
            const [rows] = await connection.query(queryRegistros);
            const resultado = await connection.query(queryTotal);

            const actualizaciones:Actualizacion[] = [];

            if (Array.isArray(rows)) {
                for (let i = 0; i < rows.length; i++) { 
                    const row = rows[i];
                    
                    let actualizacion:Actualizacion = new Actualizacion();
                    actualizacion.id = row['id'];
                    actualizacion.resumen = row['resumen'];
                    actualizacion.mejoras = row['mejoras'];
                    actualizacion.correcciones = row['correcciones'];
                    actualizacion.version = row['version'];
                    actualizacion.link = row['link'];
                    actualizacion.front = row['front'] == 1 ? true : false;
                    actualizacion.fecha = row['fecha'];
                    actualizacion.estado = row['estado'];

                    actualizaciones.push(actualizacion)
                }
            }

            return {total:resultado[0][0].total, registros:actualizaciones};

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async ObtenerUltimaVersionApp(idApp){
        const connection = await db.getConnection();
        
        try {
             //Obtengo la query segun los filtros
            let queryRegistros = await ObtenerQuery({idApp},false);

            //Obtengo la lista de registros y el total
            const [rows] = await connection.query(queryRegistros);

            let actualizacion:Actualizacion = new Actualizacion();
            if (Array.isArray(rows)) {

                const row = rows[0];
                actualizacion.id = row['id'];
                actualizacion.resumen = row['resumen'];
                actualizacion.mejoras = row['mejoras'];
                actualizacion.correcciones = row['correcciones'];
                actualizacion.version = row['version'];
                actualizacion.link = row['link'];
                actualizacion.front = row['front'] == 1 ? true : false;
                actualizacion.fecha = row['fecha'];
                actualizacion.estado = row['estado'];
            }

            return actualizacion;

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
            const consulta = "INSERT INTO actualizaciones(idApp, resumen, mejoras, correcciones, version, link, front, fecha, estado) VALUES (?,?,?,?,?,?,?,?,?)";
            const parametros = [data.idApp, data.resumen, data.mejoras, data.correcciones, data.version, data.link, data.front ? 1 : 0, moment(data.fecha).format('YYYY-MM-DD'), data.estado];
            
            await connection.query(consulta, parametros);
            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async Modificar(data:any): Promise<string>{
        const connection = await db.getConnection();
        
        try {
            const consulta = "UPDATE actualizaciones SET idApp = ?, resumen = ?, mejoras = ?, correcciones = ?, version = ?, link = ?, front = ?, fecha = ?, estado = ? WHERE id = ?";
            const parametros = [data.idApp, data.resumen, data.mejoras, data.correcciones, data.version, data.link, data.front ? 1 : 0, moment(data.fecha).format('YYYY-MM-DD'), data.estado, data.id];  
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
            await connection.query("DELETE FROM actualizaciones WHERE id = ?", [id]);
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
        if (filtros.idApp != null && filtros.idApp != 0) 
            filtro += " WHERE idApp = "+ filtros.idApp;
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
            " FROM actualizaciones " +
            filtro +
            " ORDER BY fecha DESC, id DESC" +
            paginado +
            endCount;

        return query;
            
    } catch (error) {
        throw error; 
    }
}

export const ActualizacionRepo = new ActualizacionesRepository();


