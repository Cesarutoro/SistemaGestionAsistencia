const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireRole } = require('../middleware/auth');

// Solo admin y director pueden consultar el audit log
router.use(requireRole('admin', 'director'));

/**
 * GET /api/audit
 *
 * Query params opcionales:
 *   - usuario_id  : filtrar por usuario
 *   - accion      : filtrar por acción (ej. LOGIN, CREAR_ESTUDIANTE)
 *   - desde       : fecha ISO (ej. 2025-01-01)
 *   - hasta       : fecha ISO (ej. 2025-12-31)
 *   - page        : página (default 1)
 *   - limit       : registros por página (default 50, max 200)
 */
router.get('/', async (req, res) => {
    try {
        let { usuario_id, accion, desde, hasta, page = 1, limit = 50 } = req.query;

        page = Math.max(1, parseInt(page) || 1);
        limit = Math.min(200, Math.max(1, parseInt(limit) || 50));
        const offset = (page - 1) * limit;

        // Construir filtros dinámicos
        const conditions = [];
        const params = [];

        if (usuario_id) {
            conditions.push('al.usuario_id = ?');
            params.push(parseInt(usuario_id));
        }
        if (accion) {
            conditions.push('al.accion = ?');
            params.push(accion.toUpperCase());
        }
        if (desde) {
            conditions.push('al.creado_en >= ?::timestamptz');
            params.push(desde);
        }
        if (hasta) {
            conditions.push('al.creado_en <= ?::timestamptz');
            params.push(hasta + 'T23:59:59Z');
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Total de registros para paginación
        const [countRows] = await pool.query(
            `SELECT COUNT(*) as total FROM audit_log al ${where}`,
            params
        );
        const total = parseInt(countRows[0]?.total ?? 0);

        // Registros paginados con nombre del usuario
        const dataParams = [...params, limit, offset];
        const [rows] = await pool.query(
            `SELECT
                al.id,
                al.accion,
                al.entidad,
                al.entidad_id,
                al.detalle,
                al.ip,
                al.creado_en,
                u.nombre  AS usuario_nombre,
                u.email   AS usuario_email,
                u.rol     AS usuario_rol
             FROM audit_log al
             LEFT JOIN usuarios u ON u.id = al.usuario_id
             ${where}
             ORDER BY al.creado_en DESC
             LIMIT ? OFFSET ?`,
            dataParams
        );

        res.json({
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            data: rows,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
