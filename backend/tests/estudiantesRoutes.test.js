process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/db', () => ({ query: jest.fn() }));
jest.mock('../src/utils/audit', () => ({ logAudit: jest.fn().mockResolvedValue() }));

// Mock fs and xlsx for upload testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  unlinkSync: jest.fn(),
}));

jest.mock('xlsx', () => ({
  readFile: jest.fn(() => ({
    SheetNames: ['Sheet1'],
    Sheets: { Sheet1: {} },
  })),
  utils: {
    sheet_to_json: jest.fn(() => [
      { rut: '12.345.678-9', nombre: 'Carlos', apellido: 'Soto', curso: '2A', sexo: 'M' },
    ]),
  },
}));

const pool = require('../src/db');
const router = require('../src/routes/estudiantes');

const getHandler = (method, path) => {
  const layer = router.stack.find(
    (layer) => layer.route && layer.route.path === path && layer.route.methods[method],
  );
  return layer.route.stack.at(-1).handle;
};

describe('Estudiantes Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('deberia retornar estudiantes sin paginacion', async () => {
      const mockEstudiantes = [{ id: 1, nombre: 'Ana', apellido: 'Pérez', rut: '11.111.111-1', curso_nombre: '1A' }];
      pool.query.mockResolvedValueOnce([mockEstudiantes]);

      const req = { query: {} };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('get', '/')(req, res);

      expect(json).toHaveBeenCalledWith(mockEstudiantes);
    });

    it('deberia retornar estudiantes con paginacion y filtros de busqueda', async () => {
      pool.query.mockResolvedValueOnce([[{ total: 1 }]]); // COUNT query
      const mockEstudiantes = [{ id: 1, nombre: 'Ana', apellido: 'Pérez', rut: '11.111.111-1', curso_nombre: '1A' }];
      pool.query.mockResolvedValueOnce([mockEstudiantes]); // SELECT query

      const req = { query: { page: '1', limit: '10', search: 'Ana' } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('get', '/')(req, res);

      expect(json).toHaveBeenCalledWith(expect.objectContaining({
        total: 1,
        page: 1,
        limit: 10,
        data: mockEstudiantes,
      }));
    });
  });

  describe('POST /', () => {
    test('responde 409 cuando el RUT ya existe', async () => {
      const duplicateError = new Error('duplicate key');
      duplicateError.code = '23505';
      pool.query.mockRejectedValueOnce(duplicateError);

      const req = {
        user: { id: 7 },
        body: { rut: '11.111.111-1', nombre: 'Ana', apellido: 'Pérez', curso_id: 1, sexo: 'F' },
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

    test('responde 400 cuando el curso seleccionado no existe', async () => {
      const foreignKeyError = new Error('foreign key constraint');
      foreignKeyError.code = '23503';
      pool.query.mockRejectedValueOnce(foreignKeyError);

      const req = {
        user: { id: 7 },
        body: { rut: '11.111.111-1', nombre: 'Ana', apellido: 'Pérez', curso_id: 999, sexo: 'F' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };

      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/')(req, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'El curso seleccionado no existe' });
    });

    test('crea un estudiante con datos válidos', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 21 }]]);

      const req = {
        user: { id: 7 },
        body: { rut: '11.111.111-1', nombre: 'Ana', apellido: 'Pérez', curso_id: 3, sexo: 'F' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };

      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/')(req, res);

      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalledWith({ id: 21, rut: '11.111.111-1', nombre: 'Ana', apellido: 'Pérez', curso_id: 3, sexo: 'F' });
    });

    test('responde 500 si falla la inserción de base de datos por un error genérico', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB_FAIL'));

      const req = {
        user: { id: 7 },
        body: { rut: '11.111.111-1', nombre: 'Ana', apellido: 'Pérez', curso_id: 3, sexo: 'F' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };

      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/')(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'DB_FAIL' });
    });
  });

  describe('PUT /bulk-update-curso', () => {
    it('deberia actualizar el curso de estudiantes masivamente', async () => {
      pool.query.mockResolvedValueOnce([[]]); // UPDATE query

      const req = {
        body: { estudiante_ids: [1, 2, 3], curso_id: 5 },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('put', '/bulk-update-curso')(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE estudiantes SET curso_id = ? WHERE id IN (?, ?, ?)'),
        [5, 1, 2, 3]
      );
      expect(json).toHaveBeenCalledWith({ message: '3 estudiantes actualizados correctamente' });
    });
  });

  describe('PUT /:id', () => {
    it('deberia actualizar un estudiante', async () => {
      pool.query.mockResolvedValueOnce([[]]); // UPDATE query

      const req = {
        params: { id: '10' },
        user: { id: 7 },
        body: { rut: '12.345.678-9', nombre: 'Carlos', apellido: 'Soto', curso_id: 2, sexo: 'M' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('put', '/:id')(req, res);

      expect(json).toHaveBeenCalledWith({ message: 'Estudiante actualizado' });
    });
  });

  describe('DELETE /:id', () => {
    it('deberia eliminar un estudiante', async () => {
      pool.query.mockResolvedValueOnce([[]]); // DELETE query

      const req = {
        params: { id: '10' },
        user: { id: 7 },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('delete', '/:id')(req, res);

      expect(json).toHaveBeenCalledWith({ message: 'Estudiante eliminado' });
    });
  });

  describe('POST /upload', () => {
    it('deberia procesar la importacion de un archivo Excel', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 5 }]]); // SELECT cursos (existe el curso 2A)
      pool.query.mockResolvedValueOnce([[]]); // INSERT estudiantes

      const req = {
        user: { id: 7 },
        file: { path: 'uploads/temp-excel.xlsx' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/upload')(req, res);

      expect(json).toHaveBeenCalledWith({ message: 'Excel procesado con éxito' });
    });

    it('deberia crear un curso si no existe durante la importacion', async () => {
      pool.query.mockResolvedValueOnce([[]]); // SELECT cursos (no existe, retorna vacío)
      pool.query.mockResolvedValueOnce([[{ id: 6 }]]); // INSERT cursos RETURNING id
      pool.query.mockResolvedValueOnce([[]]); // INSERT estudiantes

      const req = {
        user: { id: 7 },
        file: { path: 'uploads/temp-excel.xlsx' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/upload')(req, res);

      expect(json).toHaveBeenCalledWith({ message: 'Excel procesado con éxito' });
      expect(pool.query).toHaveBeenNthCalledWith(2, 'INSERT INTO cursos (nombre) VALUES (?) RETURNING id', ['2A']);
    });

    it('deberia retornar 500 en caso de fallo durante el procesamiento del archivo', async () => {
      pool.query.mockRejectedValueOnce(new Error('Excel DB Fail'));

      const req = {
        user: { id: 7 },
        file: { path: 'uploads/temp-excel.xlsx' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/upload')(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'Excel DB Fail' });
    });
  });
});
