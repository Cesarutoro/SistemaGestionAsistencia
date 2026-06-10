const pool = require('./backend/src/db');
const bcrypt = require('./backend/node_modules/bcryptjs');

async function setupAuth() {
    try {
        console.log('Creando tabla de usuarios...');
<<<<<<< HEAD

        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                rol VARCHAR(20) DEFAULT 'inspector',
                activo BOOLEAN DEFAULT TRUE,
                creado_en TIMESTAMPTZ DEFAULT NOW()
=======
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                rol ENUM('admin', 'inspector', 'director') DEFAULT 'inspector',
                activo TINYINT(1) DEFAULT 1,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
>>>>>>> 3bacafe8ef9191b67f196f80412e8e4d03d6592c
            )
        `);
        console.log('Tabla "usuarios" creada correctamente.');

<<<<<<< HEAD
=======
        // Crear usuario admin por defecto
>>>>>>> 3bacafe8ef9191b67f196f80412e8e4d03d6592c
        const adminPassword = await bcrypt.hash('admin123', 10);
        const inspectorPassword = await bcrypt.hash('inspector123', 10);
        const directorPassword = await bcrypt.hash('director123', 10);

<<<<<<< HEAD
        const users = [
            ['Administrador', 'admin@colegio.cl', adminPassword, 'admin'],
            ['Inspector', 'inspector@colegio.cl', inspectorPassword, 'inspector'],
            ['Director', 'director@colegio.cl', directorPassword, 'director'],
        ];

        for (const [nombre, email, password_hash, rol] of users) {
            await pool.query(
                `INSERT INTO usuarios (nombre, email, password_hash, rol)
                 VALUES (?, ?, ?, ?)
                 ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre`,
                [nombre, email, password_hash, rol],
            );
        }

        console.log('\nUsuarios creados exitosamente:');
        console.log('  admin@colegio.cl       / admin123       (admin)');
        console.log('  inspector@colegio.cl   / inspector123   (inspector)');
        console.log('  director@colegio.cl    / director123    (director)');
        console.log('\nIMPORTANTE: Cambia las contraseñas antes de entregar al colegio.');
    } catch (err) {
        console.error('Error en setup:', err.message);
        process.exit(1);
=======
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
>>>>>>> 3bacafe8ef9191b67f196f80412e8e4d03d6592c
    } finally {
        process.exit();
    }
}

setupAuth();
