const jwt = require('jsonwebtoken');
const pool = require('../db');
const { getPermissionsForUser, canAccessPermission, canManageModule } = require('../utils/modulePermissions');

if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: La variable de entorno JWT_SECRET no está definida. El servidor no puede iniciarse de forma segura.');
}
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware para verificar que el usuario tiene un token JWT válido.
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso no autorizado. Inicia sesión.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        (async () => {
            const [rows] = await pool.query(
                'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?',
                [decoded.id],
            );

            if (rows.length === 0 || !rows[0].activo) {
                return res.status(403).json({ error: 'Usuario desactivado.' });
            }

            const user = rows[0];
            const permisos = await getPermissionsForUser(user.id, user.rol, pool);

            req.user = {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                permisos,
            };

            next();
        })().catch((err) => res.status(500).json({ error: err.message }));
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado. Inicia sesión de nuevo.' });
    }
}

/**
 * Middleware para verificar que el usuario tiene un rol específico.
 * @param {...string} roles - Roles permitidos e.g. ('admin', 'director')
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}` });
        }
        next();
    };
}

function requirePermission(...permissions) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const allowed = permissions.length > 0 ? permissions : ['dashboard'];

        if (!allowed.some((permission) => canAccessPermission(req.user, permission))) {
            return res.status(403).json({ error: 'Acceso denegado. No tienes permiso para este módulo.' });
        }

        next();
    };
}

function requireModuleWrite(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        if (!canAccessPermission(req.user, permission)) {
            return res.status(403).json({ error: 'No tienes permiso para acceder a este módulo.' });
        }

        if (!canManageModule(req.user, permission)) {
            return res.status(403).json({ error: 'No tienes permisos para hacer cambios en este módulo.' });
        }

        next();
    };
}

module.exports = { authMiddleware, requireRole, requirePermission, requireModuleWrite };
