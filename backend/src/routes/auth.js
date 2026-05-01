const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');
const { getPermissionsForUser } = require('../utils/modulePermissions');
const { validate } = require('../middleware/validate');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = '15m';                  // Access token corto
const REFRESH_EXPIRES_DAYS = 30;            // Refresh token dura 30 días
const REFRESH_COOKIE = 'refresh_token';

// Rate limiter: se aplica solo en producción para no bloquear pruebas locales
const loginLimiter = process.env.NODE_ENV === 'production'
    ? rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 10,
        message: {
            error: 'Demasiados intentos de inicio de sesión. Por seguridad, tu acceso ha sido bloqueado por 1 hora.'
        },
        standardHeaders: true,
        legacyHeaders: false,
    })
    : (req, res, next) => next();

/** Genera un refresh token opaco aleatorio (256 bits) */
function generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
}

/** Devuelve la fecha de expiración del refresh token */
function refreshExpiresAt() {
    const d = new Date();
    d.setDate(d.getDate() + REFRESH_EXPIRES_DAYS);
    return d;
}

/** Extrae IP real considerando proxies (Render.com usa proxy) */
function getClientIp(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        null
    );
}

// ──────────────────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────────────────
router.post('/login', loginLimiter, validate('login'), async (req, res) => {
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;

    try {
        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
            [email]
        );

        if (rows.length === 0) {
            await logAudit({ accion: 'LOGIN_FALLIDO', detalle: { email }, ip, userAgent });
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            await logAudit({ accion: 'LOGIN_FALLIDO', detalle: { email }, ip, userAgent });
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const permissions = await getPermissionsForUser(user.id, user.rol, pool);

        // Access token (corto)
        const accessToken = jwt.sign(
            { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        // Refresh token (opaco, almacenado en BD)
        const refreshToken = generateRefreshToken();
        const expira = refreshExpiresAt();

        await pool.query(
            `INSERT INTO refresh_tokens (usuario_id, token, expira_en, ip, user_agent)
             VALUES (?, ?, ?, ?, ?)`,
            [user.id, refreshToken, expira.toISOString(), ip, userAgent]
        );

        // Enviar refresh token como httpOnly cookie (no accesible desde JS).
        // sameSite='none' en producción es necesario porque Render sirve el sitio
        // detrás de un proxy y la cookie debe enviarse en requests same-site con HTTPS.
        res.cookie(REFRESH_COOKIE, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            expires: expira,
            path: '/api/auth',
        });

        await logAudit({ usuarioId: user.id, accion: 'LOGIN', ip, userAgent });

        res.json({
            token: accessToken,
            usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, permisos: permissions }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ──────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Emite un nuevo access token usando el refresh token de la cookie.
// Rotación: invalida el refresh token viejo y emite uno nuevo.
// ──────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
        return res.status(401).json({ error: 'No hay sesión activa.' });
    }

    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;

    try {
        // Buscar el token en BD (no revocado, no expirado)
        const [rows] = await pool.query(
            `SELECT rt.*, u.id as uid, u.nombre, u.email, u.rol, u.activo
             FROM refresh_tokens rt
             JOIN usuarios u ON u.id = rt.usuario_id
             WHERE rt.token = ? AND rt.revocado = FALSE AND rt.expira_en > NOW()`,
            [refreshToken]
        );

        if (rows.length === 0) {
            res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
            return res.status(401).json({ error: 'Sesión expirada. Inicia sesión de nuevo.' });
        }

        const row = rows[0];

        if (!row.activo) {
            await pool.query('UPDATE refresh_tokens SET revocado = TRUE WHERE token = ?', [refreshToken]);
            res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
            return res.status(403).json({ error: 'Usuario desactivado.' });
        }

        const permissions = await getPermissionsForUser(row.uid, row.rol, pool);

        // Revocar token usado (rotación)
        await pool.query('UPDATE refresh_tokens SET revocado = TRUE WHERE token = ?', [refreshToken]);

        // Nuevo access token
        const accessToken = jwt.sign(
            { id: row.uid, nombre: row.nombre, email: row.email, rol: row.rol },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        // Nuevo refresh token
        const newRefreshToken = generateRefreshToken();
        const expira = refreshExpiresAt();

        await pool.query(
            `INSERT INTO refresh_tokens (usuario_id, token, expira_en, ip, user_agent)
             VALUES (?, ?, ?, ?, ?)`,
            [row.uid, newRefreshToken, expira.toISOString(), ip, userAgent]
        );

        res.cookie(REFRESH_COOKIE, newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            expires: expira,
            path: '/api/auth',
        });

        res.json({
            token: accessToken,
            usuario: { id: row.uid, nombre: row.nombre, email: row.email, rol: row.rol, permisos: permissions }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ──────────────────────────────────────────────────────────
// POST /api/auth/logout
// Revoca el refresh token activo de esta sesión.
// ──────────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;

    if (refreshToken) {
        try {
            const [rows] = await pool.query(
                'UPDATE refresh_tokens SET revocado = TRUE WHERE token = ? RETURNING usuario_id',
                [refreshToken]
            );
            const usuarioId = rows[0]?.usuario_id ?? null;
            await logAudit({ usuarioId, accion: 'LOGOUT', ip, userAgent });
        } catch {
            // No propagamos errores en logout
        }
    }

    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.json({ message: 'Sesión cerrada correctamente.' });
});

// ──────────────────────────────────────────────────────────
// GET /api/auth/me — Verificar token y obtener info del usuario
// ──────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
    const { id, nombre, email, rol, permisos } = req.user;
    res.json({ usuario: { id, nombre, email, rol, permisos } });
});

module.exports = router;
