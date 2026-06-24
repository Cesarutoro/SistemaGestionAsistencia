process.env.RESEND_API_KEY = 're_falsa_para_aprobar_el_test_local';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/db', () => ({ query: jest.fn() }));

const pool = require('../src/db');
const router = require('../src/routes/asistencia');

const getHandler = (method, path) =>
  router.stack.find(
    (layer) =>
      layer.route && layer.route.path === path && layer.route.methods[method],
  ).route.stack.at(-1).handle;

describe('GET /asistencia/curso/:cursoId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('devuelve solo estudiantes del curso solicitado', async () => {
    const rows = [
      {
        estudiante_id: 1,
        nombre: 'Ana',
        apellido: 'Pérez',
        rut: '11.111.111-1',
        hora_ingreso: '08:10:00',
        es_atraso: false,
        justificado: false,
        asistencia_id: 10,
      },
    ];

    pool.query.mockResolvedValueOnce([rows]);

    const req = {
      params: { cursoId: '3' },
      query: { fecha: '2026-04-17' },
    };

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    await getHandler('get', '/curso/:cursoId')(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE e.curso_id = ?'),
      ['2026-04-17', '3'],
    );
    expect(status).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith(rows);
  });
});