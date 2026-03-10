const pool = require('./backend/src/db');

async function migrate() {
    try {
        console.log('Migrando base de datos...');
        await pool.query('ALTER TABLE asistencia ADD COLUMN justificado TINYINT(1) DEFAULT 0');
        console.log('Columna "justificado" agregada correctamente.');
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log('La columna "justificado" ya existe.');
        } else {
            console.error('Error al migrar:', err);
        }
    } finally {
        process.exit();
    }
}

migrate();
