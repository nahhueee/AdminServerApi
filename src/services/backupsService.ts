import * as fs from 'fs/promises';
import * as path from 'path';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import moment from 'moment';

class BackupsService{
    async GuardarRespaldo(app, dni) {
        const backupsFolder = path.join(__dirname, '../../backups');
        const uploadsFolder = path.join(__dirname, '../uploads');

        try {
            let subfolder = '';

            switch (app) {
                case "1":
                    subfolder = '/easysales';
                    break;
                case "2":
                    subfolder = '/easyresto';
                    break;
            }

            // Filtramos los archivos que contengan el DNI en el nombre
            const archivos = await fs.readdir(uploadsFolder);
            const archivo = archivos.find(nombre => nombre.includes(dni));

            if (!archivo) 
                throw new Error(`No se encontró ningún archivo con el DNI ${dni}`);
                
            const finalPath = path.join(backupsFolder, subfolder, archivo);
            const rutaArchivo =  path.join(uploadsFolder, archivo);

            await eliminarArchivo(finalPath);
            await fs.rename(rutaArchivo, finalPath);

            await verificarRespaldos(dni, path.join(backupsFolder, subfolder));

            return "OK";

        } catch (error) {
            throw error;
        }
    }

}

//Verifica que la cantidad maxima de respaldos sea 3
//Elimina el respaldo más antiguo
async function verificarRespaldos(DNI: string, carpeta:string) {
    const backups = await fs.readdir(carpeta);
    const archivosUsuario = backups.filter(nombre => nombre.includes(DNI));

    //Solo eliminamos si tiene mas de 3 backups
    if(archivosUsuario.length <=3)
        return;

    // Ordenar por fecha ascendente
    const archivosOrdenados = archivosUsuario.sort((a, b) => {
        const fechaA = extraerFecha(a);
        const fechaB = extraerFecha(b);
        return fechaA.getTime() - fechaB.getTime();
    });

    const archivoMasAntiguo = archivosOrdenados[0];
    const rutaArchivo = path.join(carpeta, archivoMasAntiguo);

    await fs.unlink(rutaArchivo);

    return true;
}

//Extrae del nombre de un archivo backup.sql la fecha 
function extraerFecha(nombreArchivo: string): Date {
    const partes = nombreArchivo.split('_');
    if (partes.length < 2) return new Date(0); 

    const fechaStr = partes[1].replace('.sql', '');
    return moment(fechaStr, 'DD-MM-YYYY').toDate();
}

async function eliminarArchivo(filePath: string) {
    if (existsSync(filePath)) { // Verifica si el archivo existe
        try {
            await unlink(filePath); // Elimina el archivo
        } catch (error) {
            throw error;
        }
    } 
}

export const BackupServ = new BackupsService();