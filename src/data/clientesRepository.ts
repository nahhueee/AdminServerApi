import db from '../db';
import { App } from '../models/App';
import { Appcliente } from '../models/AppCliente';
import { Cliente } from '../models/Cliente';

class ClientesRepository{

     async Obtener(filtros:any){
        const connection = await db.getConnection();
        
        try {
             //Obtengo la query segun los filtros
            let queryRegistros = await ObtenerQuery(filtros,false);
            let queryTotal = await ObtenerQuery(filtros,true);

            //Obtengo la lista de registros y el total
            const rows = await connection.query(queryRegistros);
            const resultado = await connection.query(queryTotal);

            return {total:resultado[0][0].total, registros:rows[0]};

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async ObtenerCliente(idCliente:string){
        const connection = await db.getConnection();
        
        try {
            let consulta = "SELECT * FROM clientes " +
                           "WHERE id = ? ";

            const rows = await connection.query(consulta, [idCliente]);
            const row = rows[0][0];
            let cliente:Cliente = new Cliente({
                id: row['id'],
                nombre: row['nombre'],
                DNI: row['DNI'],
                email: row['email'],
                descripcion: row['descripcion'],
                fechaAlta: row['fechaAlta']
            });

            cliente.apps = await ObtenerApps(connection, cliente.DNI!);
            
            return cliente;

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
            let existe = await ValidarExistencia(connection, data, false);
            if(existe)//Verificamos si ya existe un cliente con el mismo DNI 
                return "Ya existe un cliente con el mismo DNI.";
            
            const consulta = "INSERT INTO clientes(DNI, nombre, email, descripcion, fechaAlta) VALUES (?,?,?,?,NOW())";
            const parametros = [data.DNI, data.nombre.toUpperCase(), data.email, data.descripcion];
            
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
            let existe = await ValidarExistencia(connection, data, true);
            if(existe)//Verificamos si ya existe un cliente con el mismo DNI 
                return "Ya existe un cliente con el mismo DNI.";
            
            const consulta = `UPDATE clientes 
                            SET DNI = ?, nombre = ?, email = ?, descripcion = ?
                            WHERE id = ? `;

            const parametros = [data.DNI, data.nombre.toUpperCase(), data.email, data.descripcion, data.id];
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
            await connection.query("UPDATE clientes SET fechaBaja = NOW() WHERE id = ?", [id]);
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
        if (filtros.busqueda != null && filtros.busqueda != "") 
            filtro += " WHERE c.nombre LIKE '%"+ filtros.busqueda + "%' ";
        if (filtros.idCliente != null && filtros.idCliente != 0) 
            filtro += " WHERE c.id = "+ filtros.idCliente;
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
            " SELECT c.* " +
            " FROM clientes c" +
            filtro +
            " ORDER BY c.id DESC" +
            paginado +
            endCount;

        return query;
            
    } catch (error) {
        throw error; 
    }
}

async function ObtenerApps(connection, DNI:string){
    try {
        const consulta = "SELECT ac.*, a.nombre nombreApp, a.version versionApp, a.id idApp FROM apps_cliente ac " +
                         "INNER JOIN aplicaciones a on ac.idApp = a.id " +
                         "WHERE ac.DNI = ?" ;

        const [rows] = await connection.query(consulta, [DNI]);
        const apps:Appcliente[] = [];

        if (Array.isArray(rows)) {
            for (let i = 0; i < rows.length; i++) { 
                const row = rows[i];
                
                let aplicacion:Appcliente = new Appcliente();
                aplicacion.terminal = row['terminal'];
                aplicacion.mac = row['mac'];
                aplicacion.version = row['version'];
                aplicacion.actualizacion = row['actualizacion'];
                aplicacion.habilitado = row['habilitado'] == 1 ? true : false;
               
                aplicacion.app = new App({
                    id: row['idApp'],
                    nombre: row['nombreApp'],
                    version: row['versionApp'],
                });


                apps.push(aplicacion)
              }
        }

        return apps;

    } catch (error) {
        throw error; 
    }
    
}

async function ValidarExistencia(connection, data:any, modificando:boolean):Promise<boolean>{
    try {
        let consulta = " SELECT id FROM clientes WHERE DNI = ? ";
        if(modificando) consulta += " AND id <> ? ";

        const parametros = [data.DNI, data.id];

        const rows = await connection.query(consulta,parametros);
        if(rows[0].length > 0) return true;

        return false;
    } catch (error) {
        throw error; 
    }
}

export const ClienteRepo = new ClientesRepository();


