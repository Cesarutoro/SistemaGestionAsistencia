const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const excelFile = path.join(__dirname, '..', 'todos los alumnos agrupados por curso 2026.xlsx');

async function populate() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: {
                rejectUnauthorized: false
            }
        });

        console.log('--- Iniciando importación robusta ---');

        const workbook = XLSX.readFile(excelFile);
        const sheetNames = workbook.SheetNames;

        for (const cursoNombre of sheetNames) {
            console.log(`\n>>> Procesando hoja: ${cursoNombre}`);
            
            // 1. Insertar Curso
            const [cursoResult] = await connection.execute(
                'INSERT IGNORE INTO cursos (nombre) VALUES (?)',
                [cursoNombre]
            );
            
            let cursoId;
            const [rows] = await connection.execute('SELECT id FROM cursos WHERE nombre = ?', [cursoNombre]);
            cursoId = rows[0].id;

            const worksheet = workbook.Sheets[cursoNombre];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            let headerIndex = -1;
            let colIndices = { rut: -1, nombre: -1, sexo: -1 };

            // Buscar cabecera
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row) continue;
                const rowStr = row.map(c => String(c).toUpperCase());
                if (rowStr.includes('RUT') && rowStr.includes('ESTUDIANTE')) {
                    headerIndex = i;
                    colIndices.rut = rowStr.indexOf('RUT');
                    colIndices.nombre = rowStr.indexOf('ESTUDIANTE');
                    colIndices.sexo = rowStr.indexOf('SEXO');
                    break;
                }
            }

            if (headerIndex === -1) {
                console.log(`Cabecera no encontrada en ${cursoNombre}, saltando...`);
                continue;
            }

            let inserted = 0;
            for (let i = headerIndex + 1; i < data.length; i++) {
                const row = data[i];
                if (!row || !row[colIndices.rut]) continue;

                const rutRaw = String(row[colIndices.rut]).trim();
                const fullNombre = String(row[colIndices.nombre]).trim();
                const sexo = row[colIndices.sexo] ? String(row[colIndices.sexo]).trim() : 'M';

                if (!rutRaw || rutRaw === 'undefined' || !fullNombre) continue;

                // Limpiar RUT (remover puntos y espacios, mantener guion)
                const rut = rutRaw.replace(/\./g, '').replace(/\s/g, '');

                // Parsear Nombre y Apellido
                let apellido = '';
                let nombre = '';
                if (fullNombre.includes(',')) {
                    const parts = fullNombre.split(',');
                    apellido = parts[0].trim();
                    nombre = parts[1].trim();
                } else {
                    const parts = fullNombre.split(' ');
                    if (parts.length >= 2) {
                        apellido = parts.slice(0, 2).join(' ');
                        nombre = parts.slice(2).join(' ');
                    } else {
                        nombre = fullNombre;
                    }
                }

                try {
                    await connection.execute(
                        'INSERT INTO estudiantes (rut, nombre, apellido, curso_id, sexo) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre=?, apellido=?, curso_id=?, sexo=?',
                        [rut, nombre, apellido, cursoId, sexo, nombre, apellido, cursoId, sexo]
                    );
                    inserted++;
                } catch (err) {
                    // console.error(`Error en ${rut}: ${err.message}`);
                }
            }
            console.log(`Hecho: ${inserted} estudiantes importados.`);
        }

        console.log('\n--- Población finalizada con éxito ---');

    } catch (error) {
        console.error('Error fatal:', error);
    } finally {
        if (connection) await connection.end();
    }
}

populate();
