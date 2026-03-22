process.env.JWT_SECRET = 'test-secret';

const { requirePermission } = require('../src/middleware/auth');
const { requireModuleWrite } = require('../src/middleware/auth');

describe('requirePermission middleware', () => {
    test('permite acceso cuando el usuario tiene el permiso', () => {
        const middleware = requirePermission('cursos');
        const next = jest.fn();
        const req = { user: { rol: 'inspector', permisos: ['cursos'] } };
        const res = { status: jest.fn(() => res), json: jest.fn() };

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('rechaza acceso cuando el usuario no tiene el permiso', () => {
        const middleware = requirePermission('cursos');
        const next = jest.fn();
        const res = { status: jest.fn(() => res), json: jest.fn() };

        middleware({ user: { rol: 'inspector', permisos: ['dashboard'] } }, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Acceso denegado. No tienes permiso para este módulo.' });
    });

    test('admin tiene acceso total', () => {
        const middleware = requirePermission('usuarios');
        const next = jest.fn();
        const res = { status: jest.fn(() => res), json: jest.fn() };

        middleware({ user: { rol: 'admin', permisos: [] } }, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('requireModuleWrite rechaza permisos solo lectura', () => {
        const middleware = requireModuleWrite('cursos');
        const next = jest.fn();
        const res = { status: jest.fn(() => res), json: jest.fn() };

        middleware(
            { user: { rol: 'inspector', permisos: [{ clave: 'cursos', readOnly: true }] } },
            res,
            next,
        );

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            error: 'No tienes permisos para hacer cambios en este módulo.',
        });
    });

    test('requireModuleWrite permite permisos editables', () => {
        const middleware = requireModuleWrite('cursos');
        const next = jest.fn();
        const res = { status: jest.fn(() => res), json: jest.fn() };

        middleware(
            { user: { rol: 'inspector', permisos: [{ clave: 'cursos', readOnly: false }] } },
            res,
            next,
        );

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});