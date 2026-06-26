process.env.JWT_SECRET = 'test-secret-key';

const pool = require('../src/db');
const router = require('../src/routes/usuarios');
const bcrypt = require('bcryptjs');

jest.mock('../src/db', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn(),
  },
}));

jest.mock('../src/utils/audit', () => ({
  logAudit: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/utils/modulePermissions', () => ({
  syncUserPermissions: jest.fn().mockResolvedValue(true),
  normalizePermissionEntries: jest.fn((p) => p),
  getDefaultPermissionEntriesForRole: jest.fn(() => []),
}));

const getHandler = (method, path) =>
  router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === path &&
      layer.route.methods[method]
  ).route.stack.at(-1).handle;

describe('Usuarios Routes', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.pool.connect.mockResolvedValue(mockClient);
  });

  describe('GET /', () => {
    it('deberia retornar la lista de usuarios con sus permisos agrupados', async () => {
      const mockUsers = [
        { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin', activo: true },
        { id: 2, nombre: 'Inspector', email: 'inspector@test.com', rol: 'inspector', activo: true },
      ];
      const mockPermisos = [
        { usuario_id: 2, permisos: [{ clave: 'asistencia', readOnly: false }] },
      ];

      pool.query.mockResolvedValueOnce([mockUsers]);
      pool.query.mockResolvedValueOnce([mockPermisos]);

      const req = {};
      const json = jest.fn();
      const res = { json };

      await getHandler('get', '/')(req, res);

      expect(json).toHaveBeenCalledWith([
        { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin', activo: true, permisos: [] },
        { id: 2, nombre: 'Inspector', email: 'inspector@test.com', rol: 'inspector', activo: true, permisos: [{ clave: 'asistencia', readOnly: false }] },
      ]);
    });
  });

  describe('POST /', () => {
    it('deberia rechazar con 400 si el email ya existe', async () => {
      mockClient.query.mockResolvedValueOnce([[]]); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 }); // SELECT (existe email)
      mockClient.query.mockResolvedValueOnce([[]]); // ROLLBACK

      const req = {
        body: { nombre: 'Pedro', email: 'existente@test.com', password: '123', rol: 'inspector', activo: true },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/')(req, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'El email ya está registrado' });
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('deberia crear el usuario exitosamente y retornar 210', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('mocked_hash');
      mockClient.query.mockResolvedValueOnce([[]]); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 }); // SELECT (no existe email)
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 99 }] }); // INSERT usuario returning id
      mockClient.query.mockResolvedValueOnce([[]]); // syncUserPermissions (o subconsulta)
      mockClient.query.mockResolvedValueOnce([[]]); // COMMIT

      const req = {
        user: { id: 1 },
        body: { nombre: 'Pedro', email: 'nuevo@test.com', password: '123', rol: 'inspector', activo: true, permisos: [] },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/')(req, res);

      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 99,
          email: 'nuevo@test.com',
          rol: 'inspector',
        })
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('PUT /:id', () => {
    it('deberia actualizar un usuario con exito', async () => {
      mockClient.query.mockResolvedValueOnce([[]]); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 }); // SELECT duplicados
      mockClient.query.mockResolvedValueOnce([[]]); // UPDATE query
      mockClient.query.mockResolvedValueOnce([[]]); // COMMIT

      const req = {
        params: { id: '2' },
        user: { id: 1 },
        body: { nombre: 'Pedro Modificado', email: 'pedro@test.com', rol: 'inspector', activo: true, permisos: [] },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('put', '/:id')(req, res);

      expect(json).toHaveBeenCalledWith({ message: 'Usuario actualizado exitosamente', permisos: expect.any(Array) });
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('DELETE /:id', () => {
    it('deberia rechazar eliminar su propio usuario con 400', async () => {
      const req = {
        params: { id: '3' },
        user: { id: 3 }, // Mismo ID
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('delete', '/:id')(req, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'No puedes eliminar tu propio usuario' });
    });

    it('deberia eliminar el usuario exitosamente', async () => {
      pool.query.mockResolvedValueOnce([[]]); // DELETE query

      const req = {
        params: { id: '4' },
        user: { id: 3 }, // Distinto ID
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('delete', '/:id')(req, res);

      expect(json).toHaveBeenCalledWith({ message: 'Usuario eliminado exitosamente' });
    });
  });
});
