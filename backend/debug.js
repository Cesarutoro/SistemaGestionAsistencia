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
        const query = 'SELECT id, nombre, apellido FROM estudiantes WHERE nombre LIKE ? AND apellido LIKE ?';
        const [students] = await connection.query(query, ['%Florencia%', '%Arancibia%']);
        console.log('Students found:', students.length);
        
        for (const s of students) {
            console.log(`ID: ${s.id}, Name: ${s.nombre} ${s.apellido}`);
            const [attendance] = await connection.query('SELECT * FROM asistencia WHERE estudiante_id = ?', [s.id]);
            console.log('Attendance records:', JSON.stringify(attendance, null, 2));
        }
    } catch (err) {
        console.error('Query error:', err);
    } finally {
        await connection.end();
    }
}

check().catch(console.error);
