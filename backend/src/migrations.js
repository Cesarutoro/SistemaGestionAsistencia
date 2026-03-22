const pool = require('./db');
const { MODULES, getDefaultPermissionEntriesForRole } = require('./utils/modulePermissions');

/**
 * Ejecuta migraciones necesarias al arrancar el servidor.
 * Usa CREATE TABLE IF NOT EXISTS para que sea idempotente (se puede correr N veces).
 */
async function runMigrations() {
    try {
        await pool.query(`
            ALTER TABLE asistencia
            ADD COLUMN IF NOT EXISTS justificacion_descripcion TEXT
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS modulos_permisos (
                id SERIAL PRIMARY KEY,
                clave VARCHAR(80) NOT NULL UNIQUE,
                nombre VARCHAR(120) NOT NULL
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuario_permisos (
                usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                modulo_id INT NOT NULL REFERENCES modulos_permisos(id) ON DELETE CASCADE,
                read_only BOOLEAN NOT NULL DEFAULT FALSE,
                creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (usuario_id, modulo_id)
            )
        `);

        await pool.query(`
            ALTER TABLE usuario_permisos
            ADD COLUMN IF NOT EXISTS read_only BOOLEAN NOT NULL DEFAULT FALSE
        `);

        for (const modulo of MODULES) {
            await pool.query(
                `INSERT INTO modulos_permisos (clave, nombre)
                 VALUES ($1, $2)
                 ON CONFLICT (clave) DO UPDATE SET nombre = EXCLUDED.nombre`,
                [modulo.clave, modulo.nombre],
            );
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id          SERIAL PRIMARY KEY,
                usuario_id  INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                token       TEXT NOT NULL UNIQUE,
                expira_en   TIMESTAMPTZ NOT NULL,
                creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                revocado    BOOLEAN NOT NULL DEFAULT FALSE,
                ip          VARCHAR(45),
                user_agent  TEXT
            )
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token
                ON refresh_tokens(token)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario_id
                ON refresh_tokens(usuario_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expira_en
                ON refresh_tokens(expira_en)
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id          BIGSERIAL PRIMARY KEY,
                usuario_id  INT REFERENCES usuarios(id) ON DELETE SET NULL,
                accion      VARCHAR(100) NOT NULL,
                entidad     VARCHAR(50),
                entidad_id  INT,
                detalle     JSONB,
                ip          VARCHAR(45),
                user_agent  TEXT,
                creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_id
                ON audit_log(usuario_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_audit_log_accion
                ON audit_log(accion)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_audit_log_creado_en
                ON audit_log(creado_en DESC)
        `);

        const roleSeeds = [
            ['admin', getDefaultPermissionEntriesForRole('admin')],
            ['director', getDefaultPermissionEntriesForRole('director')],
            ['inspector', getDefaultPermissionEntriesForRole('inspector')],
        ];

        for (const [role, permissions] of roleSeeds) {
            if (permissions.length === 0) {
                continue;
            }

            await pool.query(
                `INSERT INTO usuario_permisos (usuario_id, modulo_id, read_only)
                 SELECT u.id, m.id, FALSE
                 FROM usuarios u
                 JOIN modulos_permisos m ON m.clave = ANY($1::text[])
                 WHERE u.rol = $2
                 ON CONFLICT DO NOTHING`,
                [permissions.map((permission) => permission.clave), role],
            );
        }

        console.log('[migrations] OK');
    } catch (err) {
        console.error('[migrations] Error:', err.message);
    }
}

module.exports = { runMigrations };
