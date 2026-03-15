const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Soporta tanto PG_URI (connection string completa) como variables individuales
// DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
// rejectUnauthorized: false es necesario para Aiven, que usa una CA interna
// que Node.js no incluye en su bundle de certificados raíz.
// La conexión sigue siendo TLS cifrada — solo se omite la verificación de la CA.
const pool = process.env.PG_URI
    ? new Pool({
        connectionString: process.env.PG_URI.split('?')[0],
        ssl: { rejectUnauthorized: false },
    })
    : new Pool({
        host:     process.env.DB_HOST,
        port:     Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
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
