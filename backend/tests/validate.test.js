const { validate, schemas } = require('../src/middleware/validate');

describe('Esquemas de validación Zod', () => {

  describe('crearEstudiante', () => {
    test('acepta datos válidos', () => {
      const result = schemas.crearEstudiante.safeParse({
        rut: '12.345.678-9',
        nombre: 'Juan',
        apellido: 'Pérez',
        curso_id: 1,
      });
      expect(result.success).toBe(true);
    });

    test('rechaza curso_id no numérico', () => {
      const result = schemas.crearEstudiante.safeParse({
        rut: '12.345.678-9',
        nombre: 'Juan',
        apellido: 'Pérez',
        curso_id: 'abc',
      });
      expect(result.success).toBe(false);
    });

    test('rechaza nombre vacío', () => {
      const result = schemas.crearEstudiante.safeParse({
        rut: '12.345.678-9',
        nombre: '',
        apellido: 'Pérez',
        curso_id: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('login', () => {
    test('acepta email y password válidos', () => {
      const result = schemas.login.safeParse({
        email: 'admin@test.com',
        password: 'secreta123',
      });
      expect(result.success).toBe(true);
    });

    test('rechaza email inválido', () => {
      const result = schemas.login.safeParse({
        email: 'no-es-email',
        password: 'secreta123',
      });
      expect(result.success).toBe(false);
    });

    test('rechaza password vacío', () => {
      const result = schemas.login.safeParse({
        email: 'admin@test.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('marcarAsistencia', () => {
    test('acepta datos válidos con hora HH:MM', () => {
      const result = schemas.marcarAsistencia.safeParse({
        estudiante_id: 1,
        fecha: '2026-03-13',
        hora_ingreso: '08:30',
      });
      expect(result.success).toBe(true);
    });

    test('acepta hora con segundos HH:MM:SS', () => {
      const result = schemas.marcarAsistencia.safeParse({
        estudiante_id: 1,
        fecha: '2026-03-13',
        hora_ingreso: '08:30:00',
      });
      expect(result.success).toBe(true);
    });

    test('rechaza fecha con formato incorrecto', () => {
      const result = schemas.marcarAsistencia.safeParse({
        estudiante_id: 1,
        fecha: '13/03/2026',
        hora_ingreso: '08:30',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('crearUsuario', () => {
    test('acepta datos válidos', () => {
      const result = schemas.crearUsuario.safeParse({
        nombre: 'Admin',
        email: 'admin@colegio.cl',
        password: 'secreta123',
        rol: 'admin',
      });
      expect(result.success).toBe(true);
    });

    test('rechaza password menor a 6 caracteres', () => {
      const result = schemas.crearUsuario.safeParse({
        nombre: 'Admin',
        email: 'admin@colegio.cl',
        password: '123',
        rol: 'admin',
      });
      expect(result.success).toBe(false);
    });

    test('rechaza rol inválido', () => {
      const result = schemas.crearUsuario.safeParse({
        nombre: 'Admin',
        email: 'admin@colegio.cl',
        password: 'secreta123',
        rol: 'superadmin',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkUpdateCurso', () => {
    test('acepta array de IDs y curso_id', () => {
      const result = schemas.bulkUpdateCurso.safeParse({
        estudiante_ids: [1, 2, 3],
        curso_id: 5,
      });
      expect(result.success).toBe(true);
    });

    test('rechaza array vacío', () => {
      const result = schemas.bulkUpdateCurso.safeParse({
        estudiante_ids: [],
        curso_id: 5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Middleware validate()', () => {
    test('llama next() cuando los datos son válidos', () => {
      const middleware = validate('crearEstudiante');
      const req = {
        body: { rut: '1-9', nombre: 'A', apellido: 'B', curso_id: 1 },
      };
      const next = jest.fn();
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(status).not.toHaveBeenCalled();
    });

    test('devuelve 400 cuando los datos son inválidos', () => {
      const middleware = validate('crearEstudiante');
      const req = { body: { rut: '', nombre: '', apellido: '', curso_id: null } };
      const next = jest.fn();
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Datos inválidos' }));
    });
  });
});
