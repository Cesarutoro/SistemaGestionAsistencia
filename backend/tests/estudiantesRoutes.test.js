process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/db', () => ({ query: jest.fn() }));
jest.mock('../src/utils/audit', () => ({ logAudit: jest.fn().mockResolvedValue() }));

const pool = require('../src/db');
const router = require('../src/routes/estudiantes');

const getHandler = (method, path) =>
  router.stack.find(
    (layer) => layer.route && layer.route.path === path && layer.route.methods[method],
  ).route.stack.at(-1).handle;

describe('POST /estudiantes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('responde 409 cuando el RUT ya existe', async () => {
    const duplicateError = new Error('duplicate key value violates unique constraint');
    duplicateError.code = '23505';
    pool.query.mockRejectedValueOnce(duplicateError);

    const req = {
      user: { id: 7 },
      body: {
        rut: '11.111.111-1',
        nombre: 'Ana',
        apellido: 'Pérez',
        curso_id: 1,
        sexo: 'F',
      },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
    };

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    await getHandler('post', '/')(req, res);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({ error: 'Ya existe un estudiante con ese RUT' });
  });

  test('crea un estudiante con datos válidos', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 21 }]]);

    const req = {
      user: { id: 7 },
      body: {
        rut: '11.111.111-1',
        nombre: 'Ana',
        apellido: 'Pérez',
        curso_id: 3,
        sexo: 'F',
      },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
    };

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    await getHandler('post', '/')(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO estudiantes (rut, nombre, apellido, curso_id, sexo) VALUES (?, ?, ?, ?, ?) RETURNING id',
      ['11.111.111-1', 'Ana', 'Pérez', 3, 'F'],
    );
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      id: 21,
      rut: '11.111.111-1',
      nombre: 'Ana',
      apellido: 'Pérez',
      curso_id: 3,
      sexo: 'F',
    });
  });
});
