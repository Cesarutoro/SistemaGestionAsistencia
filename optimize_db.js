const mysql = require("./backend/node_modules/mysql2/promise");
const dotenv = require("./backend/node_modules/dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

async function optimizeDatabase() {
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
    console.log("🚀 Optimizando base de datos con índices...");

    const optimizationQueries = [
      "ALTER TABLE estudiantes ADD INDEX idx_curso_id (curso_id)",
      "ALTER TABLE asistencia ADD INDEX idx_fecha_atraso (fecha, es_atraso)",
      "ALTER TABLE asistencia ADD INDEX idx_estudiante_atraso (estudiante_id, es_atraso)",
      "ALTER TABLE salidas_anticipadas ADD INDEX idx_fecha_salida (fecha)",
    ];

    for (const query of optimizationQueries) {
      console.log(`⏳ Ejecutando: ${query}`);
      try {
        await connection.execute(query);
        console.log("✅ OK");
      } catch (error) {
        if (error.code === "ER_DUP_KEYNAME") {
          console.log("ℹ️ El índice ya existe.");
        } else {
          console.error(`❌ Error: ${error.message}`);
        }
      }
    }

    console.log("\n🎉 Optimización completada!");
  } catch (error) {
    console.error("❌ Error durante la optimización:", error);
  } finally {
    await connection.end();
  }
}

optimizeDatabase();
