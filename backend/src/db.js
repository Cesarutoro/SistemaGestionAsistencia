const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

function resolveSslConfig() {
    if (process.env.DB_SSL === 'true') {
        return { rejectUnauthorized: false };
    }
    if (process.env.DB_SSL === 'false') {
        return false;
    }
    if (process.env.PG_URI) {
        return { rejectUnauthorized: false };
    }

    const host = process.env.DB_HOST || 'localhost';
    if (host === 'localhost' || host === '127.0.0.1') {
        return false;
    }

    return { rejectUnauthorized: false };
}

const poolOptions = {
    ssl: resolveSslConfig(),
    max: 10,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: false,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
};

const pool = process.env.PG_URI
    ? new Pool({
        connectionString: process.env.PG_URI.split('?')[0],
        ...poolOptions,
    })
    : new Pool({
        host:     process.env.DB_HOST,
        port:     Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ...poolOptions,
    });

pool.on('error', (err) => {
    console.error('[db] Error en pool de conexiones:', err.message);
});

pool.on('connect', () => {
    console.log('[db] Conexión establecida');
});

module.exports = {
    query: async (text, params) => {
        let index = 1;
        const formattedText = text.replace(/\?/g, () => `$${index++}`);
        const start = Date.now();
        const res = await pool.query(formattedText, params);
        const elapsed = Date.now() - start;
        if (elapsed > 500) {
            console.warn(`[db] Query lenta (${elapsed}ms):`, text.slice(0, 100));
        }
        const rows = res.rows;
        rows.affectedRows = res.rowCount;
        rows.insertId = rows.length > 0 ? rows[0].id : null;
        return [rows, res.fields];
    },
    pool
};
