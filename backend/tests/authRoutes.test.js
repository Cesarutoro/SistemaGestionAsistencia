process.env.JWT_SECRET = 'test-secret-key';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../src/db');
const router = require('../src/routes/auth');

jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

jest.mock('../src/utils/audit', () => ({
  logAudit: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/utils/modulePermissions', () => ({
  getPermissionsForUser: jest.fn().mockResolvedValue([]),
}));

const getHandler = (method, path) =>
  router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === path &&
      layer.route.methods[method]
  ).route.stack.at(-1).handle;

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /login', () => {
    it('deberia retornar 401 si el usuario no existe', async () => {
      pool.query.mockResolvedValueOnce([[]]); // Usuario no existe

      const req = {
        body: { email: 'inexistente@test.com', password: 'password123' },
        headers: {},
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/login')(req, res);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'Credenciales incorrectas' });
    });

    it('deberia retornar 401 si la contraseña es incorrecta', async () => {
      const fakeUser = { id: 1, email: 'juan@test.com', password_hash: 'hashed_pass' };
      pool.query.mockResolvedValueOnce([[fakeUser]]);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false); // No coincide

      const req = {
        body: { email: 'juan@test.com', password: 'incorrectpass' },
        headers: {},
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/login')(req, res);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'Credenciales incorrectas' });
    });

    it('deberia retornar 200 y el token si las credenciales son correctas', async () => {
      const fakeUser = { id: 2, nombre: 'Juan', email: 'juan@test.com', rol: 'inspector', password_hash: 'hashed_pass' };
      pool.query.mockResolvedValueOnce([[fakeUser]]);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
      pool.query.mockResolvedValueOnce([[]]); // Inserción del refresh token

      const req = {
        body: { email: 'juan@test.com', password: 'correctpass' },
        headers: {},
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const cookie = jest.fn();
      const res = { json, status, cookie };

      await getHandler('post', '/login')(req, res);

      expect(cookie).toHaveBeenCalledWith('refresh_token', expect.any(String), expect.any(Object));
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          usuario: expect.objectContaining({ email: 'juan@test.com' }),
        })
      );
    });
  });

  describe('POST /refresh', () => {
    it('deberia retornar 401 si no hay cookie de refresh_token', async () => {
      const req = { cookies: {} };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/refresh')(req, res);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'No hay sesión activa.' });
    });

    it('deberia retornar 401 si el refresh_token es invalido o no existe en BD', async () => {
      pool.query.mockResolvedValueOnce([[]]); // No encontrado en refresh_tokens

      const req = { cookies: { refresh_token: 'fake-refresh' }, headers: {} };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const clearCookie = jest.fn();
      const res = { json, status, clearCookie };

      await getHandler('post', '/refresh')(req, res);

      expect(clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/api/auth' });
      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'Sesión expirada. Inicia sesión de nuevo.' });
    });

    it('deberia retornar 403 si el usuario del refresh token esta desactivado', async () => {
      const fakeTokenRow = { uid: 2, activo: 0 };
      pool.query.mockResolvedValueOnce([[fakeTokenRow]]);
      pool.query.mockResolvedValueOnce([[]]); // UPDATE refresh_token set revocado=true

      const req = { cookies: { refresh_token: 'fake-refresh' }, headers: {} };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const clearCookie = jest.fn();
      const res = { json, status, clearCookie };

      await getHandler('post', '/refresh')(req, res);

      expect(status).toHaveBeenCalledWith(403);
      expect(json).toHaveBeenCalledWith({ error: 'Usuario desactivado.' });
    });

    it('deberia retornar 200 y rotar el refresh token si es valido', async () => {
      const fakeTokenRow = { uid: 2, nombre: 'Juan', email: 'juan@test.com', rol: 'inspector', activo: 1 };
      pool.query.mockResolvedValueOnce([[fakeTokenRow]]);
      pool.query.mockResolvedValueOnce([[]]); // Revocar anterior
      pool.query.mockResolvedValueOnce([[]]); // Insertar nuevo refresh token

      const req = { cookies: { refresh_token: 'fake-refresh' }, headers: {} };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const cookie = jest.fn();
      const res = { json, status, cookie };

      await getHandler('post', '/refresh')(req, res);

      expect(cookie).toHaveBeenCalledWith('refresh_token', expect.any(String), expect.any(Object));
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          usuario: expect.objectContaining({ email: 'juan@test.com' }),
        })
      );
    });
  });

  describe('POST /logout', () => {
    it('deberia revocar el token, limpiar cookie y retornar mensaje de éxito', async () => {
      pool.query.mockResolvedValueOnce([[{ usuario_id: 2 }]]); // UPDATE ... RETURNING usuario_id

      const req = { cookies: { refresh_token: 'fake-refresh' }, headers: {} };
      const json = jest.fn();
      const clearCookie = jest.fn();
      const res = { json, clearCookie };

      await getHandler('post', '/logout')(req, res);

      expect(clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/api/auth' });
      expect(json).toHaveBeenCalledWith({ message: 'Sesión cerrada correctamente.' });
    });
  });

  describe('GET /me', () => {
    it('deberia retornar la informacion del req.user', () => {
      const req = {
        user: { id: 2, nombre: 'Juan', email: 'juan@test.com', rol: 'inspector', permisos: [] },
      };
      const json = jest.fn();
      const res = { json };

      // /me es el ultimo handler de GET /me
      const meHandler = router.stack.find(
        (layer) => layer.route && layer.route.path === '/me' && layer.route.methods.get
      ).route.stack.at(-1).handle;

      meHandler(req, res);

      expect(json).toHaveBeenCalledWith({
        usuario: { id: 2, nombre: 'Juan', email: 'juan@test.com', rol: 'inspector', permisos: [] },
      });
    });
  });
});
