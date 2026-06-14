const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Despacha una alerta por correo electrónico formal ante una salida anticipada.
 */
async function notificarApoderadoSalida(datos) {
  try {
    const enviarAReales = process.env.ENVIAR_CORREOS_REALES === 'true';
    const destinoFinal = enviarAReales ? datos.correo_apoderado : process.env.CORREO_TEST_DESARROLLO;

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

    console.log(`✨ Notificación de salida enviada con éxito. Destinatario final: ${destinoFinal}`);
  } catch (error) {
    console.error('❌ Error crítico en el servicio de notificaciones de salida:', error);
  }
}

/**
 * Despacha una alerta inmediata por atraso escolar al apoderado.
 */
async function notificarApoderadoAtraso(datos) {
  try {
    const enviarAReales = process.env.ENVIAR_CORREOS_REALES === 'true';
    const modoInmediato = process.env.NOTIFICACION_ATRASO_INMEDIATA !== 'false'; 

    if (!modoInmediato) {
      console.log(`ℹ️ Notificación por atraso retenida por configuración de entorno.`);
      return;
    }

    const destinoFinal = enviarAReales ? datos.correo_apoderado : process.env.CORREO_TEST_DESARROLLO;

    const plantillaHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">Sistema de Gestión Escolar</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <h2 style="color: #d97706; margin-top: 0; font-size: 18px;">⚠️ Alerta de Asistencia: Registro de Atraso</h2>
          <p>Estimado/a apoderado/a,</p>
          <p>Le informamos que se ha registrado un ingreso fuera del horario estipulado para el siguiente estudiante:</p>
          <div style="background-color: #fdf2e9; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
            <p style="margin: 5px 0;"><strong>Estudiante:</strong> ${datos.nombre_estudiante}</p>
            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${datos.fecha}</p>
            <p style="margin: 5px 0;"><strong>Hora de Ingreso:</strong> ${datos.hora_ingreso} hrs.</p>
            <p style="margin: 5px 0; color: #7f1d1d;"><strong>Estado:</strong> Atraso Injustificado</p>
          </div>
          <p style="font-size: 14px; color: #666666;">Recuerde que la acumulación de atrasos reiterados requiere la comparecencia del apoderado en inspectoría general para justificar de forma presencial.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">Este es un correo automático emitido por la Inspectoría del Establecimiento.</p>
          <p style="margin: 5px 0 0 0;">© 2026 Proyecto Registro Asistencia Backend.</p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'Control Asistencia <onboarding@resend.dev>',
      to: destinoFinal,
      subject: `[ATRASO] Notificación de ingreso tardío de ${datos.nombre_estudiante}`,
      html: plantillaHTML
    });

    console.log(`✨ Notificación de atraso enviada con éxito a: ${destinoFinal}`);
  } catch (error) {
    console.error('❌ Error crítico en servicio de atrasos:', error);
  }
}

module.exports = {
  notificarApoderadoSalida,
  notificarApoderadoAtraso
};