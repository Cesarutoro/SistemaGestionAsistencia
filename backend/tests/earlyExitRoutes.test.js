process.env.JWT_SECRET = 'test-secret-key';

const pool = require('../src/db');
const router = require('../src/routes/salidas-anticipadas');
const { notificarApoderadoSalida } = require('../src/utils/notificationService');

jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

jest.mock('../src/utils/notificationService', () => ({
  notificarApoderadoSalida: jest.fn(),
}));

const getHandler = (method, path) =>
  router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === path &&
      layer.route.methods[method]
  ).route.stack.at(-1).handle;

describe('Salidas Anticipadas Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /estudiante/:estudianteId', () => {
    it('deberia obtener las salidas de un estudiante', async () => {
      const mockSalidas = [{ id: 1, estudiante_id: 5, fecha: '2026-03-24', hora_salida: '14:30:00' }];
      pool.query.mockResolvedValueOnce([mockSalidas]);

      const req = { params: { estudianteId: '5' }, query: {} };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('get', '/estudiante/:estudianteId')(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE estudiante_id = ?'), ['5']);
      expect(json).toHaveBeenCalledWith(mockSalidas);
    });
  });

  describe('GET /curso/:cursoId', () => {
    it('deberia obtener las salidas de un curso para una fecha', async () => {
      const mockSalidas = [{ id: 1, estudiante_id: 5, nombre: 'Ana', apellido: 'Pérez' }];
      pool.query.mockResolvedValueOnce([mockSalidas]);

      const req = { params: { cursoId: '2' }, query: { fecha: '2026-03-24' } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('get', '/curso/:cursoId')(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE e.curso_id = ? AND sa.fecha = ?'), ['2', '2026-03-24']);
      expect(json).toHaveBeenCalledWith(mockSalidas);
    });
  });

  describe('GET /:id', () => {
    it('deberia retornar 404 si la salida no existe', async () => {
      pool.query.mockResolvedValueOnce([[]]); // Vacio

      const req = { params: { id: '9' } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('get', '/:id')(req, res);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ error: 'Salida anticipada no encontrada' });
    });

    it('deberia retornar la salida si existe', async () => {
      const mockSalida = { id: 1, estudiante_id: 2 };
      pool.query.mockResolvedValueOnce([[mockSalida]]);

      const req = { params: { id: '1' } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('get', '/:id')(req, res);

      expect(json).toHaveBeenCalledWith(mockSalida);
    });
  });

  describe('POST /', () => {
    it('deberia rechazar con 400 si los datos son invalidos', async () => {
      const req = {
        body: { estudiante_id: null }, // Invalido
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/')(req, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Datos inválidos' }));
    });

    it('deberia registrar la salida y enviar la notificacion por correo', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 3 }]]); // SELECT estudiante (existe)
      pool.query.mockResolvedValueOnce([{ insertId: 88 }]); // INSERT/ON CONFLICT returning id
      pool.query.mockResolvedValueOnce([[{ nombre: 'Ana', apellido: 'Pérez', correo_apoderado: 'apoderado@test.com' }]]); // SELECT apoderado

      const req = {
        user: { id: 1 },
        body: {
          estudiante_id: 3,
          fecha: '2026-03-24',
          hora_salida: '14:30',
          motivo: 'Cita médica',
          es_medico: true,
          observaciones: 'Acompañado por madre',
        },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('post', '/')(req, res);

      expect(status).toHaveBeenCalledWith(201);
      expect(notificarApoderadoSalida).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre_estudiante: 'Ana Pérez',
          correo_apoderado: 'apoderado@test.com',
          hora_salida: '14:30:00',
        })
      );
      expect(json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Salida anticipada registrada correctamente' }));
    });
  });

  describe('PUT /:id', () => {
    it('deberia actualizar una salida', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1, estudiante_id: 3, fecha: new Date('2026-03-24'), hora_salida: '14:30:00', motivo: 'Cita médica' }]]); // SELECT salida
      pool.query.mockResolvedValueOnce([[]]); // UPDATE query

      const req = {
        params: { id: '1' },
        body: { motivo: 'Nuevo motivo médico' },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('put', '/:id')(req, res);

      expect(json).toHaveBeenCalledWith({ mensaje: 'Salida anticipada actualizada correctamente', id: '1' });
    });
  });

  describe('DELETE /estudiante/:estudianteId/fecha/:fecha', () => {
    it('deberia eliminar por estudiante y fecha', async () => {
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const req = { params: { estudianteId: '3', fecha: '2026-03-24' } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('delete', '/estudiante/:estudianteId/fecha/:fecha')(req, res);

      expect(json).toHaveBeenCalledWith({ mensaje: 'Salida anticipada eliminada correctamente' });
    });
  });

  describe('DELETE /:id', () => {
    it('deberia eliminar por id', async () => {
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const req = { params: { id: '1' } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler('delete', '/:id')(req, res);

      expect(json).toHaveBeenCalledWith({ mensaje: 'Salida anticipada eliminada correctamente' });
    });
  });
});
