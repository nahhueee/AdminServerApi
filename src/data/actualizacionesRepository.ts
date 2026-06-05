import moment from 'moment';
import db from '../db';
import { Actualizacion } from '../models/Actualizacion';
import { FiltroActualizacion } from '../models/Filtros/FiltroActualizacion';
import { RowDataPacket } from 'mysql2';

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

    async ObtenerUltimaVersionFrontend(idApp, backendVersion, terminal: string | null = null){
        const connection = await db.getConnection();

        try {
            let sql = `
                        SELECT
                            a.version,
                            a.link,
                            a.resumen,
                            a.mejoras,
                            a.correcciones,
                            a.firma,
                            a.fecha_publicacion
                        FROM actualizaciones a
                        INNER JOIN compatibilidad_front_backend c
                            ON c.idApp = a.idApp
                            AND c.version_frontend = a.version
                            AND c.version_backend = ?
                        WHERE
                            a.idApp = ?
                            AND a.tipo = 'frontend'
                            AND (
                                a.estado = 'produccion'
                                OR (
                                    a.estado = 'canary' AND ? IS NOT NULL
                                    AND EXISTS (
                                        SELECT 1 FROM canary_terminals ct
                                        WHERE ct.terminal = ? AND ct.idApp = a.idApp AND ct.activo = 1
                                    )
                                )
                            )
                        ORDER BY
                            a.fecha_publicacion DESC,
                            a.id DESC
                        LIMIT 1
                    `;

            const [rows] = await connection.query<RowDataPacket[]>(sql, [backendVersion, idApp, terminal, terminal]);
            if (!rows || rows.length === 0) {
                return null; // No hay update
            }

            const datos = rows[0];

            const response = {
                version: datos.version,
                resumen: datos.resumen,
                mejoras: datos.mejoras,
                correcciones: datos.correcciones,
                pub_date: new Date(datos.fecha_publicacion).toISOString(),
                platforms: {
                    "windows-x86_64": {
                    url: datos.link,
                    signature: datos.firma
                    }
                },
            };

            return response;

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async ObtenerUltimaVersionBackend(idApp, terminal){
        const connection = await db.getConnection();

        try {
            const sql = `
                SELECT
                    version,
                    link,
                    resumen,
                    mejoras,
                    correcciones,
                    fecha_publicacion,
                    estado,
                    requiere_npm_install,
                    tamano_bytes
                FROM actualizaciones
                WHERE
                    idApp = ?
                    AND tipo = 'backend'
                    AND (
                        estado = 'produccion'
                        OR (
                            estado = 'canary'
                            AND EXISTS (
                                SELECT 1 FROM canary_terminals ct
                                WHERE ct.terminal = ? AND ct.idApp = actualizaciones.idApp AND ct.activo = 1
                            )
                        )
                    )
                ORDER BY fecha_publicacion DESC, id DESC
                LIMIT 1
            `;

            const [rows] = await connection.query(sql, [idApp, terminal]);
            const row = rows[0];

            if (!row) return null;

            return {
                version:            row.version,
                link:               row.link,
                resumen:            row.resumen,
                mejoras:            row.mejoras,
                correcciones:       row.correcciones,
                fecha_publicacion:  row.fecha_publicacion,
                estado:             row.estado,
                requiereNpmInstall: row.requiere_npm_install === 1,
                tamanoBytes:        row.tamano_bytes ?? null,
            };

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    // Devuelve versiones backend en estado produccion/canary para el selector del modal de frontend
    async ObtenerVersionesBackend(idApp: number): Promise<{ version: string, estado: string }[]> {
        const connection = await db.getConnection();

        try {
            const sql = `
                SELECT version, estado, MAX(fecha_publicacion) AS fp
                FROM actualizaciones
                WHERE idApp = ?
                  AND tipo = 'backend'
                  AND (estado = 'produccion' OR estado = 'canary')
                GROUP BY version, estado
                ORDER BY fp DESC, MAX(id) DESC
            `;
            const [rows] = await connection.query<RowDataPacket[]>(sql, [idApp]);
            return (rows as any[]).map(r => ({ version: r.version, estado: r.estado }));

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    // Devuelve las versiones backend con las que un frontend ya está marcado como compatible
    async ObtenerCompatibilidades(idApp: number, versionFrontend: string): Promise<string[]> {
        const connection = await db.getConnection();

        try {
            const [rows] = await connection.query<RowDataPacket[]>(
                'SELECT version_backend FROM compatibilidad_front_backend WHERE idApp = ? AND version_frontend = ?',
                [idApp, versionFrontend]
            );
            return (rows as any[]).map(r => r.version_backend);

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    //#region ABM

    async AgregarDesdeCI(data:any): Promise<string>{
        const connection = await db.getConnection();

        try {
            const consulta = "INSERT INTO actualizaciones(idApp, resumen, version, link, ambiente, fecha_publicacion, estado, tipo, firma) VALUES (?,?,?,?,?,?,?,?,?)";
            const parametros = [data.idApp, data.resumen, data.version, data.link, 'test', moment(data.fecha_publicacion).format('YYYY-MM-DD'), 'borrador', data.tipo, data.firma];

            await connection.query(consulta, parametros);
            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async Agregar(data:any): Promise<string>{
        const connection = await db.getConnection();

        try {
            if (data.tipo === 'backend') {
                const consulta = `INSERT INTO actualizaciones
                    (idApp, resumen, mejoras, correcciones, version, link, ambiente, fecha_publicacion, estado, tipo, requiere_npm_install, tamano_bytes)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
                const parametros = [
                    data.idApp, data.resumen, data.mejoras, data.correcciones,
                    data.version, data.link, 'prod',
                    moment(data.fechaPublicacion).format('YYYY-MM-DD'),
                    data.estado, data.tipo,
                    data.requiereNpmInstall ? 1 : 0,
                    data.tamanoBytes ?? null
                ];
                await connection.query(consulta, parametros);

            } else {
                // frontend
                const consulta = `INSERT INTO actualizaciones
                    (idApp, resumen, mejoras, correcciones, version, link, ambiente, fecha_publicacion, estado, tipo)
                    VALUES (?,?,?,?,?,?,?,?,?,?)`;
                const parametros = [
                    data.idApp, data.resumen, data.mejoras, data.correcciones,
                    data.version, data.link, 'prod',
                    moment(data.fechaPublicacion).format('YYYY-MM-DD'),
                    data.estado, data.tipo
                ];
                await connection.query(consulta, parametros);

                // Sincronizar compatibilidades
                if (data.versionesBackendCompatibles?.length) {
                    await this._sincronizarCompatibilidades(connection, data.idApp, data.version, data.versionesBackendCompatibles);
                }
            }

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
            if (data.tipo === 'backend') {
                const consulta = `UPDATE actualizaciones SET
                    idApp = ?, resumen = ?, mejoras = ?, correcciones = ?,
                    version = ?, link = ?, ambiente = ?, fecha_publicacion = ?,
                    estado = ?, tipo = ?,
                    requiere_npm_install = ?, tamano_bytes = ?
                    WHERE id = ?`;
                const parametros = [
                    data.idApp, data.resumen, data.mejoras, data.correcciones,
                    data.version, data.link, data.ambiente ?? 'prod',
                    moment(data.fechaPublicacion).format('YYYY-MM-DD'),
                    data.estado, data.tipo,
                    data.requiereNpmInstall ? 1 : 0,
                    data.tamanoBytes ?? null,
                    data.id
                ];
                await connection.query(consulta, parametros);

            } else {
                // frontend
                const consulta = `UPDATE actualizaciones SET
                    idApp = ?, resumen = ?, mejoras = ?, correcciones = ?,
                    version = ?, link = ?, ambiente = ?, fecha_publicacion = ?,
                    estado = ?, tipo = ?
                    WHERE id = ?`;
                const parametros = [
                    data.idApp, data.resumen, data.mejoras, data.correcciones,
                    data.version, data.link, data.ambiente ?? 'prod',
                    moment(data.fechaPublicacion).format('YYYY-MM-DD'),
                    data.estado, data.tipo, data.id
                ];
                await connection.query(consulta, parametros);

                // Reemplazar compatibilidades para esta versión
                // Nota: si la versión cambió, las compat de la versión anterior quedan huérfanas (edge case aceptable)
                if (data.versionesBackendCompatibles != null) {
                    await this._sincronizarCompatibilidades(connection, data.idApp, data.version, data.versionesBackendCompatibles);
                }
            }

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

    // DELETE + INSERT de compatibilidades para (idApp, versionFrontend)
    private async _sincronizarCompatibilidades(
        connection: any,
        idApp: number,
        versionFrontend: string,
        versiones: string[]
    ): Promise<void> {
        await connection.query(
            'DELETE FROM compatibilidad_front_backend WHERE idApp = ? AND version_frontend = ?',
            [idApp, versionFrontend]
        );
        if (versiones.length > 0) {
            const values = versiones.map(v => [idApp, versionFrontend, v]);
            await connection.query(
                'INSERT INTO compatibilidad_front_backend (idApp, version_frontend, version_backend) VALUES ?',
                [values]
            );
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
