import db from '../db';
import { App } from '../models/App';
import { Appcliente } from '../models/AppCliente';
import { Cliente } from '../models/Cliente';

class ClientesRepository{

    async ObtenerCliente(DNI:string){
        const connection = await db.getConnection();
        
        try {
            let consulta = "SELECT * FROM clientes " +
                           "WHERE dni = ? ";

            const rows = await connection.query(consulta, [DNI]);
            const row = rows[0][0];
            let cliente:Cliente = new Cliente({
                id: row['id'],
                nombre: row['nombre'],
                DNI: row['DNI'],
                email: row['email'],
                descripcion: row['descripcion'],
                fechaAlta: row['fechaAlta']
            });

            cliente.apps = await ObtenerApps(connection, DNI);
            
            return cliente;

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
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

export const ClienteRepo = new ClientesRepository();


