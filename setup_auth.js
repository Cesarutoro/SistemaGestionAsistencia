const pool = require('./backend/src/db');
const bcrypt = require('./backend/node_modules/bcryptjs');

async function setupAuth() {
    try {
        console.log('Creando tabla de usuarios...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                rol ENUM('admin', 'inspector', 'director') DEFAULT 'inspector',
                activo TINYINT(1) DEFAULT 1,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Tabla "usuarios" creada correctamente.');

        // Crear usuario admin por defecto
        const adminPassword = await bcrypt.hash('admin123', 10);
        const inspectorPassword = await bcrypt.hash('inspector123', 10);
        const directorPassword = await bcrypt.hash('director123', 10);

        await pool.query(`
            INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
            ('Administrador', 'admin@colegio.cl', ?, 'admin'),
            ('Inspector', 'inspector@colegio.cl', ?, 'inspector'),
            ('Director', 'director@colegio.cl', ?, 'director')
            ON DUPLICATE KEY UPDATE nombre = nombre
        `, [adminPassword, inspectorPassword, directorPassword]);

        console.log('\n✅ Usuarios creados exitosamente:');
        console.log('  📧 admin@colegio.cl       🔑 admin123       👤 Rol: admin');
        console.log('  📧 inspector@colegio.cl   🔑 inspector123   👤 Rol: inspector');
        console.log('  📧 director@colegio.cl    🔑 director123    👤 Rol: director');
        console.log('\n⚠️  IMPORTANTE: Cambia las contraseñas antes de entregar al colegio.');

    } catch (err) {
        console.error('Error en setup:', err.message);
    } finally {
        process.exit();
    }
}

setupAuth();
