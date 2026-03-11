const pool = require('./backend/src/db');

async function testConnection() {
    try {
        console.log('Probando conexión a la BD...');
        const [rows] = await pool.query('SHOW TABLES');
        console.log('Tablas encontradas:', rows.map(r => Object.values(r)[0]));
        
        const [asistenciaFields] = await pool.query('DESCRIBE asistencia');
        console.log('Campos de tabla asistencia:', asistenciaFields.map(f => f.Field));
        
        const [estudiantes] = await pool.query('SELECT COUNT(*) as count FROM estudiantes');
        console.log('Cantidad de estudiantes:', estudiantes[0].count);
        
    } catch (err) {
        console.error('Error en la prueba:', err);
    } finally {
        process.exit();
    }
}

testConnection();
