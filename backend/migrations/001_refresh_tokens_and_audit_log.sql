-- Migración 001: Refresh tokens y audit log
-- Ejecutar manualmente o via script de migración.
-- Compatible con PostgreSQL (Aiven).

-- ─────────────────────────────────────────────
-- Tabla: refresh_tokens
-- Almacena tokens de refresco por sesión.
-- Un mismo usuario puede tener múltiples sesiones (distintos dispositivos).
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          SERIAL PRIMARY KEY,
    usuario_id  INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    expira_en   TIMESTAMPTZ NOT NULL,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revocado    BOOLEAN NOT NULL DEFAULT FALSE,
    ip          VARCHAR(45),
    user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token      ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario_id ON refresh_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expira_en  ON refresh_tokens(expira_en);

-- ─────────────────────────────────────────────
-- Tabla: audit_log
-- Registra acciones relevantes de cada usuario.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  INT REFERENCES usuarios(id) ON DELETE SET NULL,
    accion      VARCHAR(100) NOT NULL,   -- e.g. 'LOGIN', 'LOGOUT', 'CREAR_ESTUDIANTE'
    entidad     VARCHAR(50),             -- e.g. 'estudiantes', 'usuarios'
    entidad_id  INT,                     -- id del registro afectado
    detalle     JSONB,                   -- datos extra (payload, cambios, etc.)
    ip          VARCHAR(45),
    user_agent  TEXT,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_id ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_accion     ON audit_log(accion);
CREATE INDEX IF NOT EXISTS idx_audit_log_creado_en  ON audit_log(creado_en DESC);
