const path = require('path');
const dotenv = require('dotenv');

// 1. Cargar de forma explícita el archivo .env de la raíz general externa
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 2. Importar tus funciones del servicio de notificaciones
const { notificarApoderadoSalida, notificarApoderadoAtraso } = require('./src/utils/notificationService');

async function ejecutarTestDirecto() {
  console.log("🚀 Iniciando simulación local del servicio de correos...");
  console.log(`📌 ENVIAR_CORREOS_REALES: ${process.env.ENVIAR_CORREOS_REALES}`);
  console.log(`📌 CORREO_TEST_DESARROLLO: ${process.env.CORREO_TEST_DESARROLLO}\n`);

  // Datos de prueba con el nombre genérico solicitado
  const datosEstudiante = {
    nombre_estudiante: "Juan Gómez",
    correo_apoderado: "apoderado.real@colegio.cl", // Se ignorará si ENVIAR_CORREOS_REALES=false
    fecha: "2026-06-15",
    hora_salida: "14:15",
    hora_ingreso: "08:30:00",
    motivo: "Citación médica dental de urgencia"
  };

  try {
    // 3. Probar la alerta de Salida Anticipada
    console.log("📬 Enviando plantilla de Salida Anticipada...");
    await notificarApoderadoSalida({
      nombre_estudiante: datosEstudiante.nombre_estudiante,
      correo_apoderado: datosEstudiante.correo_apoderado,
      fecha: datosEstudiante.fecha,
      hora_salida: datosEstudiante.hora_salida,
      motivo: datosEstudiante.motivo
    });

    // 4. Probar la alerta de Atraso Escolar
    console.log("\n📬 Enviando plantilla de Atraso Escolar...");
    await notificarApoderadoAtraso({
      nombre_estudiante: datosEstudiante.nombre_estudiante,
      correo_apoderado: datosEstudiante.correo_apoderado,
      fecha: datosEstudiante.fecha,
      hora_ingreso: datosEstudiante.hora_ingreso
    });

    console.log("\n🏁 Proceso de prueba terminado con éxito.");
  } catch (error) {
    console.error("❌ Error durante la ejecución del test:", error);
  }
  
  process.exit(0);
}

ejecutarTestDirecto();