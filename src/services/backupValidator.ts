/**
 * VALIDADOR ESTRUCTURAL DE BACKUPS
 * ==================================
 * Valida que un archivo .sql generado por mysqldump sea estructuralmente
 * coherente. No restaura ni ejecuta — solo lee el stream de líneas.
 *
 * Checks implementados:
 *  1. Existencia del archivo y tamaño mínimo (10 KB)
 *  2. Encabezado de mysqldump en las primeras 5 líneas
 *  3. Línea "-- Dump completed" en las últimas 5 líneas (detecta truncamiento)
 *  4. CREATE TABLE para tablas críticas: ventas, cajas, productos, clientes
 *  5. Al menos 20 líneas INSERT INTO (dump no vacío)
 */

import * as fs       from 'fs';
import * as readline from 'readline';

export interface ResultadoValidacion {
    estado:   'ok' | 'corrupto';
    detalle?: string;
}

const TABLAS_REQUERIDAS = ['ventas', 'cajas', 'productos', 'clientes', 'ventas_detalle'];
const TAMANIO_MINIMO    = 10 * 1024; // 10 KB
const MIN_INSERTS       = 20;

export async function validarBackup(rutaArchivo: string): Promise<ResultadoValidacion> {

    // Check 1: existencia y tamaño mínimo
    try {
        const stat = fs.statSync(rutaArchivo);
        if (stat.size < TAMANIO_MINIMO) {
            return {
                estado:  'corrupto',
                detalle: `Archivo demasiado pequeño (${stat.size} bytes, mínimo ${TAMANIO_MINIMO})`,
            };
        }
    } catch {
        return { estado: 'corrupto', detalle: 'Archivo no encontrado o inaccesible' };
    }

    const tablasEncontradas = new Set<string>();
    let insertCount = 0;
    let headerOk    = false;
    let lineNumber  = 0;
    const ultimas5: string[] = [];

    await new Promise<void>((resolve, reject) => {
        const rl = readline.createInterface({
            input:     fs.createReadStream(rutaArchivo, { encoding: 'utf8' }),
            crlfDelay: Infinity,
        });

        rl.on('line', (line) => {
            lineNumber++;

            // Check 2: encabezado mysqldump en las primeras 5 líneas
            if (lineNumber <= 5 && /^-- (MySQL|MariaDB) dump/i.test(line)) {
                headerOk = true;
            }

            // Check 4: CREATE TABLE para tablas requeridas
            const m = line.match(/^CREATE TABLE `?(\w+)`?/i);
            if (m && TABLAS_REQUERIDAS.includes(m[1].toLowerCase())) {
                tablasEncontradas.add(m[1].toLowerCase());
            }

            // Check 5: conteo de INSERT INTO
            if (/^INSERT INTO/i.test(line)) {
                insertCount++;
            }

            // Buffer deslizante para últimas 5 líneas (Check 3)
            ultimas5.push(line);
            if (ultimas5.length > 5) ultimas5.shift();
        });

        rl.on('close', resolve);
        rl.on('error', reject);
    });

    // Check 2: encabezado
    if (!headerOk) {
        return {
            estado:  'corrupto',
            detalle: 'Encabezado de mysqldump no encontrado en las primeras líneas',
        };
    }

    // Check 3: línea de finalización (detecta dumps truncados)
    if (!ultimas5.some(l => /-- Dump completed/i.test(l))) {
        return {
            estado:  'corrupto',
            detalle: 'Línea de finalización ausente — posible dump truncado',
        };
    }

    // Check 4: tablas críticas presentes
    const faltantes = TABLAS_REQUERIDAS.filter(t => !tablasEncontradas.has(t));
    if (faltantes.length > 0) {
        return {
            estado:  'corrupto',
            detalle: `Tablas faltantes en el dump: ${faltantes.join(', ')}`,
        };
    }

    // Check 5: dump no vacío
    if (insertCount < MIN_INSERTS) {
        return {
            estado:  'corrupto',
            detalle: `Registros insuficientes: ${insertCount} INSERT INTO (mínimo ${MIN_INSERTS})`,
        };
    }

    return { estado: 'ok' };
}
