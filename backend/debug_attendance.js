const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const studentId = 2; // Florencia
        const query = 'SELECT DATE_FORMAT(fecha, "%Y-%m-%d") as fecha, hora_ingreso FROM asistencia WHERE estudiante_id = ? AND es_atraso = 1 ORDER BY fecha DESC';
        console.log('Running query:', query);
        const [rows] = await connection.query(query, [studentId]);
        console.log('Rows found:', rows.length);
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error('Query error:', err);
    } finally {
        await connection.end();
    }
}

check().catch(console.error);
