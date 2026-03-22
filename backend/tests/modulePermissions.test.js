jest.mock('../src/db', () => ({ query: jest.fn() }));

const db = require('../src/db');
const {
    normalizePermissions,
    normalizePermissionEntries,
    getDefaultPermissionsForRole,
    getDefaultPermissionEntriesForRole,
    resolvePermissionsForRole,
    getPermissionsForUser,
    syncUserPermissions,
} = require('../src/utils/modulePermissions');

describe('modulePermissions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('normaliza permisos y elimina duplicados', () => {
        expect(normalizePermissions(['dashboard', 'dashboard', 'cursos', 'x'])).toEqual([
            'dashboard',
            'cursos',
        ]);
    });

    test('normaliza permisos con modo lectura', () => {
        expect(normalizePermissionEntries([
            { clave: 'dashboard', readOnly: true },
            { clave: 'dashboard', readOnly: false },
            { clave: 'cursos' },
        ])).toEqual([
            { clave: 'dashboard', readOnly: true },
            { clave: 'cursos', readOnly: false },
        ]);
    });

    test('retorna permisos por defecto para inspector', () => {
        expect(getDefaultPermissionsForRole('inspector')).toEqual([
            'dashboard',
            'asistencia',
            'atrasos',
            'salidas-anticipadas',
            'estudiantes',
        ]);
    });

    test('admin siempre obtiene acceso total', () => {
        expect(resolvePermissionsForRole('admin', [])).toEqual(getDefaultPermissionEntriesForRole('admin'));
    });

    test('obtiene permisos del usuario desde la base de datos', async () => {
        db.query.mockResolvedValueOnce([[{ clave: 'cursos', read_only: true }, { clave: 'dashboard', read_only: false }]]);

        await expect(getPermissionsForUser(7, 'inspector', db)).resolves.toEqual([
            { clave: 'cursos', readOnly: true },
            { clave: 'dashboard', readOnly: false },
        ]);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('sin permisos guardados usa el valor por defecto del rol', async () => {
        db.query.mockResolvedValueOnce([[]]);

        await expect(getPermissionsForUser(7, 'inspector', db)).resolves.toEqual([
            { clave: 'dashboard', readOnly: false },
            { clave: 'asistencia', readOnly: false },
            { clave: 'atrasos', readOnly: false },
            { clave: 'salidas-anticipadas', readOnly: false },
            { clave: 'estudiantes', readOnly: false },
        ]);
    });

    test('sincroniza permisos en una transaccion', async () => {
        const client = {
            query: jest.fn()
                .mockResolvedValueOnce({ rowCount: 1 })
                .mockResolvedValueOnce({ rows: [{ id: 1, clave: 'dashboard' }, { id: 2, clave: 'cursos' }] })
                .mockResolvedValueOnce({ rowCount: 2 }),
        };

        await expect(syncUserPermissions(client, 15, 'inspector', [
            'dashboard',
            { clave: 'cursos', readOnly: true },
        ])).resolves.toEqual([
            { clave: 'dashboard', readOnly: false },
            { clave: 'cursos', readOnly: true },
        ]);
        expect(client.query).toHaveBeenNthCalledWith(
            1,
            'DELETE FROM usuario_permisos WHERE usuario_id = $1',
            [15],
        );
        expect(client.query.mock.calls[2][0]).toContain('INSERT INTO usuario_permisos');
        expect(client.query.mock.calls[2][0]).toContain('read_only');
        expect(client.query.mock.calls[2][1]).toEqual([15, 1, false, 2, true]);
    });
});