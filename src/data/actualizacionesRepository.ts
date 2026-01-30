import moment from 'moment';
import db from '../db';
import { Actualizacion } from '../models/Actualizacion';
import { FiltroActualizacion } from '../models/Filtros/FiltroActualizacion';

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
            return {total:resultado[0][0].total, registros:[rows][0]};

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async ObtenerUltimaVersionApp(idApp){
        const connection = await db.getConnection();
        
        try {
            const filtro = new FiltroActualizacion();
            filtro.idApp = idApp;

            //Obtengo la query segun los filtros
            let queryRegistros = await ObtenerQuery(filtro,false);

            //Obtengo la lista de registros y el total
            const [rows] = await connection.query(queryRegistros);
            return rows[0];

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async ObtenerUltimaVersion(idApp, ambiente, tipo){
        const connection = await db.getConnection();
        
        try {
            //Obtengo la query segun los filtros
            let sql = "SELECT version, link, resumen, mejoras, correcciones, fecha_publicacion, ambiente " +
                      "FROM actualizaciones " +
                      "WHERE idApp = ? AND ambiente = ? AND tipo = ? AND estado = 'publicada' " +
                      "ORDER BY fecha_publicacion DESC, id DESC LIMIT 1";

            const [rows] = await connection.query(sql, [idApp, ambiente, tipo]);
            return [rows][0];

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
            const consulta = "INSERT INTO actualizaciones(idApp, resumen, mejoras, correcciones, version, link, ambiente, fecha_publicacion, estado, tipo) VALUES (?,?,?,?,?,?,?,?,?,?)";
            const parametros = [data.idApp, data.resumen, data.mejoras, data.correcciones, data.version, data.link, data.ambiente, moment(data.fecha_publicacion).format('YYYY-MM-DD'), data.estado, data.tipo];
            
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
            const consulta = "UPDATE actualizaciones SET idApp = ?, resumen = ?, mejoras = ?, correcciones = ?, version = ?, link = ?, ambiente = ?, fecha_publicacion = ?, estado = ?, tipo = ? WHERE id = ?";
            const parametros = [data.idApp, data.resumen, data.mejoras, data.correcciones, data.version, data.link, data.ambiente, moment(data.fecha_publicacion).format('YYYY-MM-DD'), data.estado, data.tipo, data.id];  
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

async function ObtenerQuery(filtros:FiltroActualizacion,esTotal:boolean):Promise<string>{
    try {
        //#region VARIABLES
        let query:string;
        let filtro:string = "";
        let paginado:string = "";
    
        let count:string = "";
        let endCount:string = "";
        //#endregion

        // #region FILTROS
        if (filtros.idApp && filtros.idApp != 0) 
            filtro += " AND idApp = " + filtros.idApp;
        if(filtros.ambiente && filtros.ambiente != "")
            filtro += " AND ambiente = '" + filtros.ambiente +"'";
        if(filtros.estado && filtros.estado != "")
            filtro += " AND estado = '" + filtros.estado +"'";
        if(filtros.tipo && filtros.tipo != "")
            filtro += " AND tipo = '" + filtros.tipo +"'";
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
            " WHERE 1=1 " +
            filtro +
            " ORDER BY fecha_publicacion DESC, id DESC" +
            paginado +
            endCount;

        return query;
            
    } catch (error) {
        throw error; 
    }
}

export const ActualizacionRepo = new ActualizacionesRepository();


