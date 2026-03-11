const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sistema_cesar_secret_key_2024';

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
        req.user = decoded; // guardamos el usuario en el request
        next();
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

module.exports = { authMiddleware, requireRole };
