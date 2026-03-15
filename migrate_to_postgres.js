require('dotenv').config();
const mysql = require('mysql2/promise');
const { Client } = require('pg');

async function bulkMigrate() {
    console.log('🚀 Iniciando migración por LOTES (Bulk)...');
    
    const mysqlPool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    const pgUriClean = (process.env.PG_URI || '').split('?')[0];
    const pgClient = new Client({
        connectionString: pgUriClean,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await pgClient.connect();
        console.log('✅ Postgres OK');
        
        const tables = ['cursos', 'usuarios', 'estudiantes', 'asistencia', 'salidas_anticipadas'];

        for (const table of tables) {
            console.log(`🔄 Migrando ${table}...`);
            const [rows] = await mysqlPool.query(`SELECT * FROM ${table}`);
            
            if (rows.length === 0) {
                console.log(`  ... vacía.`);
                continue;
            }

            const keys = Object.keys(rows[0]);
            const columns = keys.join(', ');
            
            // Dividir en bloques de 100 para no exceder límites de parámetros
            const chunkSize = 100;
            for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize);
                const values = [];
                const placeholders = chunk.map((row, rowIndex) => {
                    const rowPlaceholders = keys.map((key, colIndex) => {
                        let val = row[key];
                        if (key === 'activo' || key === 'es_atraso' || key === 'justificado' || key === 'es_medico') {
                            val = !!val;
                        }
                        values.push(val);
                        return `$${rowIndex * keys.length + colIndex + 1}`;
                    });
                    return `(${rowPlaceholders.join(', ')})`;
                }).join(', ');

                const query = `INSERT INTO ${table} (${columns}) VALUES ${placeholders} ON CONFLICT (id) DO NOTHING`;
                await pgClient.query(query, values);
                console.log(`  ... procesadas ${i + chunk.length} / ${rows.length} filas`);
            }
            console.log(`  ✅ ${table} completada.`);
        }

        for (const table of tables) {
            await pgClient.query(`SELECT setval('${table}_id_seq', (SELECT MAX(id) FROM ${table}), true)`);
        }
        console.log('🎉 ¡Migración Bulk completada con éxito!');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mysqlPool.end();
        await pgClient.end();
    }
}

bulkMigrate();
