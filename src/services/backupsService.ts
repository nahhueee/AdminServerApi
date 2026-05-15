import * as fs from 'fs/promises';
import * as path from 'path';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import moment from 'moment';
import db from '../db';
import { validarBackup } from './backupValidator';

class BackupsService {

    async GuardarRespaldo(app: string, dni: string): Promise<string> {
        const backupsFolder = path.join(__dirname, '../../backups');
        const uploadsFolder = path.join(__dirname, '../uploads');

        let subfolder = '';
        switch (app) {
            case '1': subfolder = '/easysales';  break;
            case '2': subfolder = '/easyresto';  break;
            default:
                throw new Error(`App desconocida: ${app}`);
        }

        // Busca el archivo subido que contenga el DNI en el nombre
        const archivos = await fs.readdir(uploadsFolder);
        const archivo = archivos.find(nombre => nombre.includes(dni));

        if (!archivo)
            throw new Error(`No se encontró archivo con DNI ${dni} en uploads`);

        const carpetaDestino = path.join(backupsFolder, subfolder);
        const rutaFinal      = path.join(carpetaDestino, archivo);
        const rutaOrigen     = path.join(uploadsFolder, archivo);

        // Si ya existe uno del mismo día, lo reemplaza
        await eliminarArchivo(rutaFinal);
        await fs.rename(rutaOrigen, rutaFinal);

        // Registra en DB antes de rotar (para que el conteo sea correcto)
        const fecha = extraerFecha(archivo);
        await RegistrarBackup(dni, Number(app), archivo, fecha);

        // Mantiene máximo 3 backups por cliente
        await rotarBackups(dni, Number(app), carpetaDestino);

        // Validación estructural asíncrona — no bloquea la respuesta al cliente
        setImmediate(() => {
            ValidarYActualizar(rutaFinal, dni, Number(app), archivo);
        });

        return 'OK';
    }

    async ListarBackups(dni: string, idApp: number): Promise<BackupInfo[]> {
        const connection = await db.getConnection();
        try {
            const [rows]: any = await connection.query(
                `SELECT nombre, fecha, fecha_registro
                 FROM backups_registro
                 WHERE DNI = ? AND idApp = ?
                 ORDER BY fecha DESC`,
                [dni, idApp]
            );
            return rows;
        } finally {
            connection.release();
        }
    }
}

interface BackupInfo {
    nombre:         string;
    fecha:          Date;
    fecha_registro: Date;
}

async function RegistrarBackup(dni: string, idApp: number, nombre: string, fecha: Date) {
    const connection = await db.getConnection();
    try {
        // Upsert por nombre: si ya existe el mismo archivo (reenvío), no duplicar
        await connection.query(
            `INSERT INTO backups_registro (DNI, idApp, nombre, fecha)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE fecha_registro = NOW()`,
            [dni, idApp, nombre, fecha]
        );
    } finally {
        connection.release();
    }
}

async function rotarBackups(dni: string, idApp: number, carpeta: string) {
    const connection = await db.getConnection();
    try {
        // Obtiene todos los backups ordenados por fecha ASC (el más antiguo primero)
        const [rows]: any = await connection.query(
            `SELECT nombre FROM backups_registro
             WHERE DNI = ? AND idApp = ?
             ORDER BY fecha ASC`,
            [dni, idApp]
        );

        if (rows.length <= 3) return;

        // Elimina el más antiguo del filesystem y de la DB
        const masAntiguo: string = rows[0].nombre;
        const rutaArchivo = path.join(carpeta, masAntiguo);

        await eliminarArchivo(rutaArchivo);

        await connection.query(
            `DELETE FROM backups_registro WHERE DNI = ? AND idApp = ? AND nombre = ?`,
            [dni, idApp, masAntiguo]
        );
    } finally {
        connection.release();
    }
}

function extraerFecha(nombreArchivo: string): Date {
    // Formato esperado: {DNI}_{DD-MM-YYYY}.sql
    const partes = nombreArchivo.split('_');
    if (partes.length < 2) return new Date();
    const fechaStr = partes[1].replace('.sql', '');
    const fecha = moment(fechaStr, 'DD-MM-YYYY');
    return fecha.isValid() ? fecha.toDate() : new Date();
}

async function ValidarYActualizar(rutaArchivo: string, dni: string, idApp: number, nombre: string): Promise<void> {
    try {
        const resultado = await validarBackup(rutaArchivo);

        const connection = await db.getConnection();
        try {
            await connection.query(
                `UPDATE backups_registro
                 SET validacion_estado  = ?,
                     validacion_detalle = ?
                 WHERE DNI = ? AND idApp = ? AND nombre = ?`,
                [resultado.estado, resultado.detalle ?? null, dni, idApp, nombre]
            );
        } finally {
            connection.release();
        }
    } catch {
        // Fallo silencioso: la validación es informativa, no bloquea el flujo
    }
}

async function eliminarArchivo(filePath: string) {
    if (existsSync(filePath)) {
        await unlink(filePath);
    }
}

export const BackupServ = new BackupsService();
