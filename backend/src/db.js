const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const pgUriClean = (process.env.PG_URI || '').split('?')[0];

const pool = new Pool({
    connectionString: pgUriClean,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    query: async (text, params) => {
        let index = 1;
        const formattedText = text.replace(/\?/g, () => `$${index++}`);
        const res = await pool.query(formattedText, params);
        
        // Creamos un objeto que imite el comportamiento de mysql2
        // mysql2 devuelve [rows, fields]
        // Pero para INSERT/UPDATE/DELETE necesitamos acceso a affectedRows/insertId
        const rows = res.rows;
        
        // Añadimos propiedades de compatibilidad al array de filas
        rows.affectedRows = res.rowCount;
        rows.insertId = rows.length > 0 ? rows[0].id : null;
        
        return [rows, res.fields];
    },
    pool
};
