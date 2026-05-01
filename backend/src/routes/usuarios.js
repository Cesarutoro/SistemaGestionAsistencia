const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { logAudit } = require('../utils/audit');
const {
    syncUserPermissions,
    normalizePermissionEntries,
    getDefaultPermissionEntriesForRole,
} = require('../utils/modulePermissions');

router.use(requireRole('admin'));

function parseRequestedPermissions(rawPermissions, role) {
    if (Array.isArray(rawPermissions)) {
        return normalizePermissionEntries(rawPermissions);
    }

    if (typeof rawPermissions === 'string' && rawPermissions.trim() !== '') {
        try {
            const parsed = JSON.parse(rawPermissions);
            if (Array.isArray(parsed)) {
                return normalizePermissionEntries(parsed);
            }
        } catch {
            return normalizePermissionEntries([rawPermissions]);
        }
    }

    if (rawPermissions === undefined) {
        return getDefaultPermissionEntriesForRole(role);
    }

    return [];
}

router.get('/', async (req, res) => {
    try {
        const [usuariosRows] = await pool.query(`
            SELECT id, nombre, email, rol, activo, creado_en
            FROM usuarios
            ORDER BY nombre ASC
        `);

        const [permisosRows] = await pool.query(`
            SELECT
                up.usuario_id,
                json_agg(
                    json_build_object(
                        'clave', mp.clave,
                        'readOnly', up.read_only
                    )
                    ORDER BY mp.clave
                ) AS permisos
            FROM usuario_permisos up
            JOIN modulos_permisos mp ON mp.id = up.modulo_id
            GROUP BY up.usuario_id
        `);

        const permisosMap = new Map(
            permisosRows.map((row) => [row.usuario_id, row.permisos || []]),
        );

        const rows = usuariosRows.map((user) => ({
            ...user,
            permisos: permisosMap.get(user.id) || [],
        }));

        res.json(rows);
    } catch (err) {
        console.error('[usuarios] GET error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/', validate('crearUsuario'), async (req, res) => {
    const { nombre, email, password, rol, activo, permisos } = req.body;
    const client = await pool.pool.connect();

    try {
        await client.query('BEGIN');

        const existing = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (existing.rowCount > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const inserted = await client.query(
            'INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [nombre, email, password_hash, rol, activo !== undefined ? !!activo : true],
        );

        const id = inserted.rows[0].id;
        const permissionsToSave = parseRequestedPermissions(permisos, rol);
        await syncUserPermissions(client, id, rol, permissionsToSave);

        await client.query('COMMIT');

        await logAudit({
            usuarioId: req.user?.id,
            accion: 'CREAR_USUARIO',
            entidad: 'usuarios',
            entidadId: id,
            detalle: {
                nombre,
                email,
                rol,
                permisos: permissionsToSave,
                activo: activo !== undefined ? !!activo : true,
            },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.status(201).json({
            id,
            nombre,
            email,
            rol,
            activo: activo !== undefined ? !!activo : true,
            permisos: permissionsToSave,
        });
    } catch (err) {
        console.error('[usuarios] POST error:', err);
        await client.query('ROLLBACK').catch(() => {});
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, password, rol, activo, permisos } = req.body;
    const client = await pool.pool.connect();

    try {
        await client.query('BEGIN');

        const duplicate = await client.query('SELECT id FROM usuarios WHERE email = $1 AND id <> $2', [email, id]);
        if (duplicate.rowCount > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const updateParts = [
            'nombre = $1',
            'email = $2',
            'rol = $3',
            'activo = $4',
        ];
        const updateParams = [nombre, email, rol, !!activo];

        if (password && password.trim() !== '') {
            const password_hash = await bcrypt.hash(password, 10);
            updateParts.push(`password_hash = $${updateParams.length + 1}`);
            updateParams.push(password_hash);
        }

        updateParams.push(id);
        const updateQuery = `UPDATE usuarios SET ${updateParts.join(', ')} WHERE id = $${updateParams.length}`;
        await client.query(updateQuery, updateParams);

        const permissionsToSave = parseRequestedPermissions(permisos, rol);
        await syncUserPermissions(client, id, rol, permissionsToSave);

        await client.query('COMMIT');

        await logAudit({
            usuarioId: req.user?.id,
            accion: 'EDITAR_USUARIO',
            entidad: 'usuarios',
            entidadId: parseInt(id),
            detalle: {
                nombre,
                email,
                rol,
                activo,
                permisos: permissionsToSave,
                passwordCambiado: !!(password && password.trim()),
            },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({ message: 'Usuario actualizado exitosamente', permisos: permissionsToSave });
    } catch (err) {
        console.error('[usuarios] PUT error:', err);
        await client.query('ROLLBACK').catch(() => {});
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.id;

    if (parseInt(id) === currentUserId) {
        return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
        await logAudit({
            usuarioId: req.user?.id,
            accion: 'ELIMINAR_USUARIO',
            entidad: 'usuarios',
            entidadId: parseInt(id),
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
