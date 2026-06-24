process.env.JWT_SECRET = 'test-secret-key';

const jwt = require('jsonwebtoken');
const { authMiddleware, requireRole, requirePermission, requireModuleWrite } = require('../src/middleware/auth');
const pool = require('../src/db');
const { getPermissionsForUser, canAccessPermission, canManageModule } = require('../src/utils/modulePermissions');

jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

jest.mock('../src/utils/modulePermissions', () => ({
  getPermissionsForUser: jest.fn(),
  canAccessPermission: jest.fn(),
  canManageModule: jest.fn(),
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('authMiddleware', () => {
    it('deberia retornar 401 si no hay cabecera authorization', async () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Acceso no autorizado. Inicia sesión.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deberia retornar 401 si token no es Bearer', async () => {
      req.headers.authorization = 'InvalidToken 1234';
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('deberia retornar 401 si token es invalido o expiro', async () => {
      req.headers.authorization = 'Bearer token-invalido';
      // jwt.verify lanzara error
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado. Inicia sesión de nuevo.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deberia retornar 403 si el usuario no existe en BD o no esta activo', async () => {
      const token = jwt.sign({ id: 1 }, 'test-secret-key');
      req.headers.authorization = `Bearer ${token}`;

      pool.query.mockResolvedValueOnce([[]]); // Usuario no encontrado

      authMiddleware(req, res, next);

      // Esperar que termine la promesa asíncrona
      await new Promise(process.nextTick);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario desactivado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deberia agregar req.user y llamar a next() si el token es valido y el usuario esta activo', async () => {
      const token = jwt.sign({ id: 1 }, 'test-secret-key');
      req.headers.authorization = `Bearer ${token}`;

      pool.query.mockResolvedValueOnce([[{ id: 1, nombre: 'Juan', email: 'juan@test.com', rol: 'inspector', activo: 1 }]]);
      getPermissionsForUser.mockResolvedValueOnce([{ clave: 'asistencia', readOnly: false }]);

      authMiddleware(req, res, next);

      await new Promise(process.nextTick);

      expect(req.user).toEqual({
        id: 1,
        nombre: 'Juan',
        email: 'juan@test.com',
        rol: 'inspector',
        permisos: [{ clave: 'asistencia', readOnly: false }],
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('deberia retornar 401 si no hay req.user', () => {
      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('deberia retornar 403 si el usuario no tiene el rol requerido', () => {
      req.user = { rol: 'inspector' };
      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('deberia llamar a next si el usuario tiene el rol requerido', () => {
      req.user = { rol: 'admin' };
      const middleware = requireRole('admin', 'director');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('deberia retornar 401 si no hay req.user', () => {
      const middleware = requirePermission('asistencia');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('deberia retornar 403 si no tiene permiso para el modulo', () => {
      req.user = { rol: 'inspector', permisos: [] };
      canAccessPermission.mockReturnValueOnce(false);

      const middleware = requirePermission('cursos');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('deberia llamar a next si tiene permiso para el modulo', () => {
      req.user = { rol: 'inspector', permisos: [] };
      canAccessPermission.mockReturnValueOnce(true);

      const middleware = requirePermission('atrasos');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireModuleWrite', () => {
    it('deberia retornar 401 si no hay req.user', () => {
      const middleware = requireModuleWrite('asistencia');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('deberia retornar 403 si no tiene permiso de acceso (read)', () => {
      req.user = { rol: 'inspector' };
      canAccessPermission.mockReturnValueOnce(false);

      const middleware = requireModuleWrite('asistencia');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'No tienes permiso para acceder a este módulo.' });
    });

    it('deberia retornar 403 si tiene acceso pero es de solo lectura (no write)', () => {
      req.user = { rol: 'inspector' };
      canAccessPermission.mockReturnValueOnce(true);
      canManageModule.mockReturnValueOnce(false);

      const middleware = requireModuleWrite('asistencia');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'No tienes permisos para hacer cambios en este módulo.' });
    });

    it('deberia llamar a next si tiene permisos de escritura en el modulo', () => {
      req.user = { rol: 'inspector' };
      canAccessPermission.mockReturnValueOnce(true);
      canManageModule.mockReturnValueOnce(true);

      const middleware = requireModuleWrite('asistencia');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
