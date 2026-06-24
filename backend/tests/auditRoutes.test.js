process.env.JWT_SECRET = 'test-secret-key';

const pool = require('../src/db');
const router = require('../src/routes/audit');

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

describe('Audit Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('deberia retornar el audit log paginado y sin filtros si no se envian query params', async () => {
      pool.query.mockResolvedValueOnce([[{ total: 150 }]]); // COUNT query
      const mockLogs = [{ id: 1, accion: 'LOGIN', creado_en: '2026-03-24' }];
      pool.query.mockResolvedValueOnce([mockLogs]); // SELECT query

      const req = { query: {} };
      const json = jest.fn();
      const res = { json };

      await getHandler('get', '/')(req, res);

      expect(pool.query).toHaveBeenNthCalledWith(1, 'SELECT COUNT(*) as total FROM audit_log al ', []);
      expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT\n                al.id'), [50, 0]);
      expect(json).toHaveBeenCalledWith({
        total: 150,
        page: 1,
        limit: 50,
        totalPages: 3,
        data: mockLogs,
      });
    });

    it('deberia aplicar los filtros de usuario_id, accion, desde y hasta correctamente', async () => {
      pool.query.mockResolvedValueOnce([[{ total: 5 }]]); // COUNT query
      pool.query.mockResolvedValueOnce([[]]); // SELECT query

      const req = {
        query: {
          usuario_id: '3',
          accion: 'CREAR_USUARIO',
          desde: '2026-01-01',
          hasta: '2026-03-31',
          page: '2',
          limit: '20',
        },
      };
      const json = jest.fn();
      const res = { json };

      await getHandler('get', '/')(req, res);

      const countQueryCall = pool.query.mock.calls[0];
      expect(countQueryCall[0]).toContain('WHERE al.usuario_id = ? AND al.accion = ? AND al.creado_en >= ?::timestamptz AND al.creado_en <= ?::timestamptz');
      expect(countQueryCall[1]).toEqual([3, 'CREAR_USUARIO', '2026-01-01', '2026-03-31T23:59:59Z']);

      const selectQueryCall = pool.query.mock.calls[1];
      expect(selectQueryCall[1]).toEqual([3, 'CREAR_USUARIO', '2026-01-01', '2026-03-31T23:59:59Z', 20, 20]);
    });

    it('deberia retornar 500 si falla la consulta', async () => {
      pool.query.mockRejectedValueOnce(new Error('Query timeout'));

      const req = { query: {} };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('get', '/')(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'Query timeout' });
    });
  });
});
