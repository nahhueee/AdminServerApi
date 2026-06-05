import db from '../db';
import { randomUUID } from 'crypto';

class AppsClienteRepository{

    async ObtenerAppClienteMac(data:any){
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

    async ObtenerAppCliente(data:any){
        const connection = await db.getConnection();
        
        try {
            let consulta = "SELECT ac.id, ac.terminal, ac.habilitado, c.DNI, c.nombre cliente FROM apps_cliente ac " +
                           "INNER JOIN clientes c on ac.DNI = c.DNI " +
                           "WHERE ac.DNI = ? && ac.idApp = ? ";

            const rows = await connection.query(consulta, [data.dni, data.idApp]);
            if(rows[0][0]){
               return rows[0][0]
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

    async TerminalHabilitada(data:any){
        const connection = await db.getConnection();
        try {
            let consulta = "SELECT habilitado FROM apps_cliente " +
                           "WHERE terminal = ? && idApp = ? ";

            const rows = await connection.query(consulta, [data.terminal, data.idApp]);
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
                const terminal = randomUUID();
                const consulta = "INSERT INTO apps_cliente(DNI, idApp, terminal, habilitado) VALUES (?,?,?,?)";
                const parametros = [data.dni, data.idApp, terminal, 1];
                
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

    //Quitar luego
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
    async InformarVersionBackend(terminal:string, version:string): Promise<any>{
        const connection = await db.getConnection();
        
        try {
            const consulta = "UPDATE apps_cliente SET " + 
                             "version_back = ?, " +
                             "fecha_back = NOW() " +
                             "WHERE terminal = ? ";

            const parametros = [version, terminal];
            
            await connection.query(consulta, parametros);

            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
    async InformarVersionFrontend(terminal:string, version:string): Promise<any>{
        const connection = await db.getConnection();
        
        try {
            const consulta = "UPDATE apps_cliente SET " + 
                             "version_front = ?, " +
                             "fecha_front = NOW() " +
                             "WHERE terminal = ? ";

            const parametros = [version, terminal];
            
            await connection.query(consulta, parametros);

            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async ActualizarEstadoTerminal(data:any){
        const connection = await db.getConnection();
        try {
            let consulta = "UPDATE apps_cliente SET " + 
                           "habilitado = ? " +
                           "WHERE DNI = ? && idApp = ?";

            await connection.query(consulta, [data.habilitado ? 1 : 0, data.DNI, data.idApp]);
            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async EliminarTerminal(idTerminal:string){
        const connection = await db.getConnection();
        try {
            let consulta = "DELETE FROM apps_cliente " +
                           "WHERE id = ?";

            await connection.query(consulta, [idTerminal]);
            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async OrdenarRollback(terminal: string, idApp: string, versionOrigen: string): Promise<void> {
        const connection = await db.getConnection();
        try {
            // Cancela órdenes previas pendientes antes de insertar la nueva.
            await connection.query(
                `UPDATE ordenes_rollback SET estado = 'cancelada'
                 WHERE terminal = ? AND idApp = ? AND estado = 'pendiente'`,
                [terminal, idApp]
            );
            await connection.query(
                `INSERT INTO ordenes_rollback (terminal, idApp, version_origen)
                 VALUES (?, ?, ?)`,
                [terminal, idApp, versionOrigen]
            );
        } catch (error: any) {
            throw error;
        } finally {
            connection.release();
        }
    }

    async CancelarRollback(terminal: string, idApp: string): Promise<void> {
        const connection = await db.getConnection();
        try {
            await connection.query(
                `UPDATE ordenes_rollback SET estado = 'cancelada'
                 WHERE terminal = ? AND idApp = ? AND estado = 'pendiente'`,
                [terminal, idApp]
            );
        } catch (error: any) {
            throw error;
        } finally {
            connection.release();
        }
    }

    // Rollback de FRONTEND. La terminal recibe la orden en la respuesta del
    // próximo heartbeat (rollbackFront) y descarga el ZIP del installer.
    async OrdenarRollbackFront(terminal: string, idApp: string, versionDestino: string, zipUrl: string): Promise<void> {
        const connection = await db.getConnection();
        try {
            // Cancela órdenes previas pendientes antes de insertar la nueva.
            await connection.query(
                `UPDATE ordenes_rollback_front SET estado = 'cancelada'
                 WHERE terminal = ? AND idApp = ? AND estado = 'pendiente'`,
                [terminal, idApp]
            );
            await connection.query(
                `INSERT INTO ordenes_rollback_front (terminal, idApp, version_destino, zip_url)
                 VALUES (?, ?, ?, ?)`,
                [terminal, idApp, versionDestino, zipUrl]
            );
        } catch (error: any) {
            throw error;
        } finally {
            connection.release();
        }
    }

    async CancelarRollbackFront(terminal: string, idApp: string): Promise<void> {
        const connection = await db.getConnection();
        try {
            await connection.query(
                `UPDATE ordenes_rollback_front SET estado = 'cancelada'
                 WHERE terminal = ? AND idApp = ? AND estado = 'pendiente'`,
                [terminal, idApp]
            );
        } catch (error: any) {
            throw error;
        } finally {
            connection.release();
        }
    }

    async ObtenerFlota(idApp: string) {
        const connection = await db.getConnection();
        try {
            const sql = `
                SELECT
                    ac.terminal,
                    ac.habilitado,
                    ac.ultimo_heartbeat,
                    c.nombre            AS cliente,
                    c.DNI,
                    h.version_back,
                    h.version_front,
                    h.db_status,
                    h.tiempo_activo,
                    h.errores_recientes,
                    h.terminales_lan_activas,
                    h.ultimo_backup_fecha,
                    h.ultimo_backup_ok,
                    h.confirmacion_front_pendiente,
                    COALESCE(e.total_errores, 0) AS total_errores,
                    evb.tipo         AS evento_back_tipo,
                    evb.version      AS evento_back_version,
                    evb.fecha        AS evento_back_fecha,
                    evf.tipo         AS evento_front_tipo,
                    evf.maquina      AS evento_front_maquina,
                    evf.version      AS evento_front_version,
                    evf.error        AS evento_front_error,
                    evf.fecha        AS evento_front_fecha,
                    (ct.terminal IS NOT NULL) AS es_canary,
                    COALESCE(bk.total_backups, 0) AS total_backups,
                    bk.ultimo_backup,
                    br_lat.validacion_estado  AS backup_validacion_estado,
                    br_lat.validacion_detalle AS backup_validacion_detalle
                FROM apps_cliente ac
                INNER JOIN clientes c ON ac.DNI = c.DNI
                LEFT JOIN heartbeats h
                    ON  h.terminal = ac.terminal
                    AND h.idApp    = ac.idApp
                    AND h.id = (
                        SELECT MAX(id) FROM heartbeats
                        WHERE terminal = ac.terminal AND idApp = ac.idApp
                    )
                LEFT JOIN (
                    SELECT terminal, idApp, COUNT(*) AS total_errores
                    FROM errores_instalaciones
                    WHERE idApp = ?
                    GROUP BY terminal, idApp
                ) e ON e.terminal = ac.terminal AND e.idApp = ac.idApp
                LEFT JOIN eventos_actualizacion evb
                    ON evb.terminal = ac.terminal
                    AND evb.idApp   = ac.idApp
                    AND evb.id = (
                        SELECT MAX(id) FROM eventos_actualizacion
                        WHERE terminal = ac.terminal AND idApp = ac.idApp
                          AND tipo NOT LIKE 'front\\_%'
                    )
                LEFT JOIN eventos_actualizacion evf
                    ON evf.terminal = ac.terminal
                    AND evf.idApp   = ac.idApp
                    AND evf.id = (
                        SELECT MAX(id) FROM eventos_actualizacion
                        WHERE terminal = ac.terminal AND idApp = ac.idApp
                          AND tipo LIKE 'front\\_%'
                    )
                LEFT JOIN canary_terminals ct
                    ON  ct.terminal = ac.terminal
                    AND ct.idApp    = ac.idApp
                    AND ct.activo   = 1
                LEFT JOIN (
                    SELECT DNI, idApp,
                           COUNT(*)   AS total_backups,
                           MAX(fecha) AS ultimo_backup
                    FROM backups_registro
                    WHERE idApp = ?
                    GROUP BY DNI, idApp
                ) bk ON bk.DNI = c.DNI AND bk.idApp = ac.idApp
                LEFT JOIN backups_registro br_lat
                    ON  br_lat.DNI   = c.DNI
                    AND br_lat.idApp = ac.idApp
                    AND br_lat.id = (
                        SELECT MAX(id) FROM backups_registro
                        WHERE DNI = c.DNI AND idApp = ac.idApp
                    )
                WHERE ac.idApp = ?
                ORDER BY c.nombre ASC
            `;

            const [rows] = await connection.query(sql, [idApp, idApp, idApp]);
            return rows;

        } catch (error: any) {
            throw error;
        } finally {
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





