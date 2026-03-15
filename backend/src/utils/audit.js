/**
 * audit.js — Helper para registrar eventos en audit_log.
 *
 * Uso:
 *   const { logAudit } = require('../utils/audit');
 *   await logAudit({ usuarioId: req.user?.id, accion: 'LOGIN', ip: req.ip, ... });
 *
 * Los errores de escritura en el audit log NO propagan excepciones
 * para que un fallo de auditoría nunca interrumpa el flujo normal.
 */

const pool = require('../db');

/**
 * @param {object} opts
 * @param {number|null} opts.usuarioId
 * @param {string}      opts.accion       - e.g. 'LOGIN', 'LOGOUT', 'CREAR_ESTUDIANTE'
 * @param {string}      [opts.entidad]    - e.g. 'estudiantes'
 * @param {number}      [opts.entidadId]
 * @param {object}      [opts.detalle]    - datos extra, se guarda como JSONB
 * @param {string}      [opts.ip]
 * @param {string}      [opts.userAgent]
 */
async function logAudit({ usuarioId = null, accion, entidad = null, entidadId = null, detalle = null, ip = null, userAgent = null }) {
    try {
        await pool.query(
            `INSERT INTO audit_log (usuario_id, accion, entidad, entidad_id, detalle, ip, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                usuarioId,
                accion,
                entidad,
                entidadId,
                detalle ? JSON.stringify(detalle) : null,
                ip,
                userAgent,
            ]
        );
    } catch (err) {
        // Nunca fallar por errores de audit log — solo loguear en consola
        console.error('[audit] Error al guardar audit_log:', err.message);
    }
}

module.exports = { logAudit };
