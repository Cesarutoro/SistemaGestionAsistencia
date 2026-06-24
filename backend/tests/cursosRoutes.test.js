process.env.JWT_SECRET = 'test-secret-key';

const pool = require('../src/db');
const router = require('../src/routes/cursos');

jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

const getHandler = (method, path) =>
  router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === path &&
      layer.route.methods[method]
  ).route.stack.at(-1).handle;

describe('Cursos Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('deberia retornar todos los cursos', async () => {
      const mockCursos = [
        { id: 1, nombre: '1 básico A' },
        { id: 2, nombre: '2 básico B' },
      ];
      pool.query.mockResolvedValueOnce([mockCursos]);

      const req = {};
      const json = jest.fn();
      const res = { json };

      await getHandler('get', '/')(req, res);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM cursos ORDER BY nombre ASC');
      expect(json).toHaveBeenCalledWith(mockCursos);
    });

    it('deberia retornar 500 si falla la BD', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const req = {};
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('get', '/')(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'DB error' });
    });
  });

  describe('POST /', () => {
    it('deberia crear un curso exitosamente', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 9 }]]); // RETURNING id

      const req = {
        body: { nombre: '3 básico C' },
      };
      const json = jest.fn();
      const res = { json };

      await getHandler('post', '/')(req, res);

      expect(pool.query).toHaveBeenCalledWith('INSERT INTO cursos (nombre) VALUES (?) RETURNING id', ['3 básico C']);
      expect(json).toHaveBeenCalledWith({ id: 9, nombre: '3 básico C' });
    });
  });

  describe('PUT /:id', () => {
    it('deberia actualizar el curso', async () => {
      pool.query.mockResolvedValueOnce([[]]); // UPDATE query

      const req = {
        params: { id: '5' },
        body: { nombre: '5 básico D' },
      };
      const json = jest.fn();
      const res = { json };

      await getHandler('put', '/:id')(req, res);

      expect(pool.query).toHaveBeenCalledWith('UPDATE cursos SET nombre = ? WHERE id = ?', ['5 básico D', '5']);
      expect(json).toHaveBeenCalledWith({ message: 'Curso actualizado' });
    });
  });

  describe('DELETE /:id', () => {
    it('deberia rechazar la eliminacion si el curso tiene estudiantes asociados', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 10 }]]); // SELECT estudiantes (tiene alumnos)

      const req = {
        params: { id: '2' },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('delete', '/:id')(req, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'No se puede eliminar un curso que tiene estudiantes registrados' });
    });

    it('deberia eliminar el curso si no tiene estudiantes', async () => {
      pool.query.mockResolvedValueOnce([[]]); // SELECT estudiantes (vacio)
      pool.query.mockResolvedValueOnce([[]]); // DELETE query

      const req = {
        params: { id: '3' },
      };
      const json = jest.fn();
      const res = { json };

      await getHandler('delete', '/:id')(req, res);

      expect(pool.query).toHaveBeenNthCalledWith(1, 'SELECT id FROM estudiantes WHERE curso_id = ? LIMIT 1', ['3']);
      expect(pool.query).toHaveBeenNthCalledWith(2, 'DELETE FROM cursos WHERE id = ?', ['3']);
      expect(json).toHaveBeenCalledWith({ message: 'Curso eliminado' });
    });
  });
});
