🏗️ Implementación del Código

El módulo se compone de dos archivos clave en el ecosistema del backend:
1. El Servicio de Notificaciones

Ruta: backend/src/utils/notificationService.js
Este archivo gestiona la lógica de conexión con el SDK de Resend y renderiza la plantilla estructurada del correo electrónico.
JavaScript

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Despacha una alerta por correo electrónico formal ante una salida anticipada.
 * @param {Object} datos - Objeto con la información del retiro.
 * @param {string} datos.nombre_estudiante - Nombre completo del alumno.
 * @param {string} datos.correo_apoderado - Correo real en Base de Datos.
 * @param {string} datos.fecha - Fecha del evento (YYYY-MM-DD).
 * @param {string} datos.hora_salida - Hora del retiro (HH:MM).
 * @param {string} datos.motivo - Justificación médica o personal.
 */
async function notificarApoderadoSalida(datos) {
    try {
        const enviarAReales = process.env.ENVIAR_CORREOS_REALES === 'true';
        
        // Selección del destinatario según el entorno de ejecución
        const destinoFinal = enviarAReales
            ? datos.correo_apoderado
            : process.env.CORREO_TEST_DESARROLLO;

        const plantillaHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">Sistema de Gestión Escolar</h1>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <h2 style="color: #ef4444; margin-top: 0; font-size: 18px;">⚠️ Alerta de Asistencia: Salida Anticipada</h2>
          <p>Estimado/a apoderado/a,</p>
          <p>Le informamos que se ha registrado una <strong>salida anticipada autorizada</strong> para el siguiente estudiante:</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #1e3a8a; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
            <p style="margin: 5px 0;"><strong>Estudiante:</strong> ${datos.nombre_estudiante}</p>
            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${datos.fecha}</p>
            <p style="margin: 5px 0;"><strong>Hora de Salida:</strong> ${datos.hora_salida} hrs.</p>
            <p style="margin: 5px 0;"><strong>Motivo:</strong> ${datos.motivo}</p>
          </div>
          
          <p style="font-size: 14px; color: #666666;">Si usted no estaba en conocimiento de este retiro o cree que se trata de un error, por favor comuníquese de inmediato con la inspectoría del establecimiento.</p>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">Este es un correo automático, por favor no responda a esta dirección.</p>
          <p style="margin: 5px 0 0 0;">© 2026 Proyecto Registro Asistencia Backend.</p>
        </div>
      </div>
    `;

        await resend.emails.send({
            from: 'Plataforma Asistencia <onboarding@resend.dev>',
            to: destinoFinal,
            subject: `[ALERTA] Retiro Anticipado de ${datos.nombre_estudiante}`,
            html: plantillaHTML
        });

        console.log(`✨ Notificación procesada con éxito. Destinatario final: ${destinoFinal}`);
    } catch (error) {
        console.error('❌ Error crítico en el servicio de notificaciones:', error);
    }
}

module.exports = { notificarApoderadoSalida };

2. Integración en el Controlador de Rutas

Ruta: backend/src/routes/salidas-anticipadas.js
Inyección del bloque de código dentro del manejador del método POST /.
JavaScript

// ... dependencias anteriores
const { notificarApoderadoSalida } = require("../utils/notificationService");

router.post("/", requireModuleWrite('salidas-anticipadas'), async (req, res) => {
  const datosNormalizados = normalizarDatos(req.body);
  const validacion = validarSalidaAnticipada(datosNormalizados);

  if (!validacion.valido) {
    return res.status(400).json({ error: "Datos inválidos", errores: validacion.errores });
  }

  if (!esHoraSalidaValida(datosNormalizados.hora_salida)) {
    return res.status(400).json({ error: "Hora de salida inválida", mensaje: "La salida debe ser después de las 08:00" });
  }

  try {
    const [estudiante] = await pool.query(
      "SELECT id FROM estudiantes WHERE id = ?",
      [datosNormalizados.estudiante_id],
    );

    if (estudiante.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    const [rows] = await pool.query(
      `INSERT INTO salidas_anticipadas ...`, // Query completa de inserción intacta
      [ ... ]
    );

    // =================================================================
    // 🔥 INTEGRACIÓN DEL MÓDULO DE NOTIFICACIONES
    // =================================================================
    const [datosEstudiante] = await pool.query(
      "SELECT nombre, apellido, correo_apoderado FROM estudiantes WHERE id = ?",
      [datosNormalizados.estudiante_id]
    );

    if (datosEstudiante && datosEstudiante.length > 0) {
      // Llamada asíncrona intencional en segundo plano (sin await)
      notificarApoderadoSalida({
        nombre_estudiante: `${datosEstudiante[0].nombre} ${datosEstudiante[0].apellido}`,
        correo_apoderado: datosEstudiante[0].correo_apoderado,
        fecha: datosNormalizados.fecha,
        hora_salida: datosNormalizados.hora_salida,
        motivo: datosNormalizados.motivo
      });
    }
    // =================================================================

    res.status(201).json({
      mensaje: "Salida anticipada registrada correctamente",
      id: rows.insertId,
      datos: { /* Datos de respuesta originales intactos */ },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

🚀 Guía de Pruebas para el Equipo (Paso a Paso)

Para testear este módulo de forma integrada con el resto de la aplicación, el equipo de desarrollo debe seguir los siguientes pasos:
1. Actualización de Repositorio e Instalación

Bajar los cambios de la rama técnica y reconstruir el árbol de librerías locales:
Bash

git pull origin <nombre_de_rama>
cd backend
npm install

(NPM instalará automáticamente el SDK de resend declarado en las dependencias).
2. Sincronización del archivo .env

Abrir el archivo .env de la raíz principal e inyectar las tres claves compartidas de Resend especificadas en la sección superior de este archivo.
3. Login y Obtención del Token JWT

Dado que la ruta real está protegida por middlewares de seguridad, se debe obtener credenciales válidas:

    Levantar el servidor local con npm start.

    Consumir el endpoint de autenticación mandando un payload de usuario válido (por ejemplo, perfil de inspector o profesor):

        POST http://localhost:4000/api/auth/login

    Copiar el valor completo del token JWT devuelto en la respuesta.

4. Ejecución del POST en Postman

Configurar una nueva solicitud en Postman:

    Método: POST

    URL: http://localhost:4000/api/salidas-anticipadas

    Pestaña Headers: Añadir la clave Authorization con el formato exacto Bearer <TU_TOKEN_JWT_AQUÍ>.

    Pestaña Body (raw JSON): Asegurar el envío de un estudiante_id que sí exista actualmente en las tablas de la base de datos de pruebas.

JSON

{
  "estudiante_id": 1,
  "fecha": "2026-06-08",
  "hora_salida": "14:30",
  "motivo": "Control médico dental de urgencia",
  "es_medico": true,
  "observaciones": "Test integral de notificaciones automáticas"
}

5. Verificación de Resultados

    El servidor de desarrollo arrojará un log confirmando el envío: ✨ Notificación procesada con éxito.

    Acceder vía webmail al correo corporativo del proyecto (testing.notificaciones.atrasos@gmail.com).

    El correo aparecerá en la bandeja de Spam debido al uso del dominio genérico Sandbox (onboarding@resend.dev) de la cuenta gratuita de Resend, lo cual constituye el comportamiento esperado para entornos locales de desarrollo. Marcar el correo como "Parece seguro" para renderizar correctamente los componentes visuales del HTML.
    """