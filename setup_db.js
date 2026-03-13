const mysql = require("./backend/node_modules/mysql2/promise");
const fs = require("fs");
const path = require("path");
const dotenv = require("./backend/node_modules/dotenv");

dotenv.config();

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("📦 Inicializando base de datos...\n");

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, "init_db.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Dividir por puntos y coma y ejecutar cada instrucción
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      console.log(`⏳ Ejecutando: ${statement.substring(0, 50)}...`);
      try {
        await connection.execute(statement);
        console.log(`✅ OK\n`);
      } catch (error) {
        console.error(`❌ Error: ${error.message}\n`);
      }
    }

    console.log("🎉 Base de datos inicializada correctamente!\n");
    console.log("Tablas creadas:");
    console.log("  ✓ cursos");
    console.log("  ✓ estudiantes");
    console.log("  ✓ asistencia");
    console.log("  ✓ salidas_anticipadas (NUEVA)");
    console.log("  ✓ usuarios\n");
  } catch (error) {
    console.error("❌ Error durante la inicialización:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initializeDatabase();
