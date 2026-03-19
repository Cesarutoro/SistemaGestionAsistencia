const pool = require('./db');

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

        console.log('[migrations] OK');
    } catch (err) {
        console.error('[migrations] Error:', err.message);
    }
}

module.exports = { runMigrations };
