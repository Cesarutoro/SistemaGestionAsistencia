const db = require('../db');

const MODULES = [
    { clave: 'dashboard', nombre: 'Panel general' },
    { clave: 'asistencia', nombre: 'Registro diario' },
    { clave: 'atrasos', nombre: 'Control de atrasos' },
    { clave: 'salidas-anticipadas', nombre: 'Salidas anticipadas' },
    { clave: 'estudiantes', nombre: 'Base de estudiantes' },
    { clave: 'cursos', nombre: 'Cursos y niveles' },
];

const MODULE_KEYS = MODULES.map((module) => module.clave);

const ROLE_DEFAULT_PERMISSIONS = {
    admin: [...MODULE_KEYS],
    director: [...MODULE_KEYS],
    inspector: [
        'dashboard',
        'asistencia',
        'atrasos',
        'salidas-anticipadas',
        'estudiantes',
    ],
};

function extractRows(result) {
    if (Array.isArray(result)) {
        return result[0] || [];
    }

    if (result && Array.isArray(result.rows)) {
        return result.rows;
    }

    return [];
}

function normalizePermissions(input) {
    if (!Array.isArray(input)) {
        return [];
    }

    return [...new Set(input.map((value) => {
        if (typeof value === 'string') {
            return String(value).trim();
        }

        if (value && typeof value === 'object') {
            return String(value.clave || value.permission || value.moduleKey || '').trim();
        }

        return '';
    }).filter((value) => MODULE_KEYS.includes(value)))];
}

function normalizePermissionEntries(input) {
    if (!Array.isArray(input)) {
        return [];
    }

    const seen = new Set();
    const entries = [];

    for (const value of input) {
        const clave = typeof value === 'string'
            ? String(value).trim()
            : String(value?.clave || value?.permission || value?.moduleKey || '').trim();

        if (!MODULE_KEYS.includes(clave) || seen.has(clave)) {
            continue;
        }

        seen.add(clave);
        const readOnlyValue = typeof value === 'object' && value !== null
            ? Boolean(value.readOnly ?? value.soloLectura ?? value.read_only ?? false)
            : false;

        entries.push({ clave, readOnly: readOnlyValue });
    }

    return entries;
}

function getDefaultPermissionsForRole(role) {
    if (!role) {
        return [];
    }

    return [...(ROLE_DEFAULT_PERMISSIONS[role] || [])];
}

function getDefaultPermissionEntriesForRole(role) {
    return getDefaultPermissionsForRole(role).map((clave) => ({ clave, readOnly: false }));
}

function samePermissions(left, right) {
    const normalizedLeft = normalizePermissions(left);
    const normalizedRight = normalizePermissions(right);

    if (normalizedLeft.length !== normalizedRight.length) {
        return false;
    }

    return normalizedLeft.every((permission) => normalizedRight.includes(permission));
}

function resolvePermissionsForRole(role, permissions) {
    if (role === 'admin') {
        return MODULE_KEYS.map((clave) => ({ clave, readOnly: false }));
    }

    const normalized = normalizePermissionEntries(permissions);
    return normalized.length > 0 ? normalized : getDefaultPermissionEntriesForRole(role);
}

async function getPermissionsForUser(userId, role, client = db) {
    if (role === 'admin') {
        return MODULE_KEYS.map((clave) => ({ clave, readOnly: false }));
    }

    const rows = extractRows(await client.query(
        `SELECT mp.clave, up.read_only
         FROM usuario_permisos up
         JOIN modulos_permisos mp ON mp.id = up.modulo_id
         WHERE up.usuario_id = $1
         ORDER BY mp.clave ASC`,
        [userId],
    ));

    const permissions = rows.map((row) => ({
        clave: row.clave,
        readOnly: Boolean(row.read_only),
    }));
    return permissions.length > 0 ? permissions : getDefaultPermissionEntriesForRole(role);
}

async function syncUserPermissions(client, userId, role, permissions) {
    const resolvedPermissions = resolvePermissionsForRole(role, permissions);

    await client.query('DELETE FROM usuario_permisos WHERE usuario_id = $1', [userId]);

    if (resolvedPermissions.length === 0) {
        return [];
    }

    const modules = extractRows(await client.query(
        'SELECT id, clave FROM modulos_permisos WHERE clave = ANY($1::text[])',
        [resolvedPermissions.map((permission) => permission.clave)],
    ));

    if (modules.length !== resolvedPermissions.length) {
        const found = new Set(modules.map((module) => module.clave));
        const missing = resolvedPermissions.filter((permission) => !found.has(permission.clave));
        throw new Error(`Permisos inválidos: ${missing.join(', ')}`);
    }

    const moduleMap = new Map(modules.map((module) => [module.clave, module.id]));
    const values = resolvedPermissions.map((permission, index) => `($1, $${index * 3 + 2}, $${index * 3 + 3})`).join(', ');
    const params = [userId];

    for (const permission of resolvedPermissions) {
        params.push(moduleMap.get(permission.clave), Boolean(permission.readOnly));
    }

    await client.query(
        `INSERT INTO usuario_permisos (usuario_id, modulo_id, read_only) VALUES ${values}`,
        params,
    );

    return resolvedPermissions;
}

function canAccessPermission(user, permission) {
    if (!user || !permission) {
        return false;
    }

    if (user.rol === 'admin') {
        return true;
    }

    const permissions = normalizePermissions(user.permisos || user.permissions || []);
    return permissions.includes(permission);
}

function canManageModule(user, permission) {
    if (!user || !permission) {
        return false;
    }

    if (user.rol === 'admin') {
        return true;
    }

    const permissions = normalizePermissionEntries(user.permisos || user.permissions || []);
    const entry = permissions.find((item) => item.clave === permission);
    return Boolean(entry) && !entry.readOnly;
}

module.exports = {
    MODULES,
    MODULE_KEYS,
    ROLE_DEFAULT_PERMISSIONS,
    normalizePermissions,
    normalizePermissionEntries,
    getDefaultPermissionsForRole,
    getDefaultPermissionEntriesForRole,
    resolvePermissionsForRole,
    getPermissionsForUser,
    syncUserPermissions,
    canAccessPermission,
    canManageModule,
};