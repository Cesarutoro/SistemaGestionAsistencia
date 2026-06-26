const { logAudit } = require('../src/utils/audit');
const pool = require('../src/db');

jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

describe('Audit Utility - logAudit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deberia insertar un registro de auditoria en la base de datos con los datos correctos', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const opts = {
      usuarioId: 5,
      accion: 'CREAR_USUARIO',
      entidad: 'usuarios',
      entidadId: 10,
      detalle: { rol: 'admin' },
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    };

    await logAudit(opts);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      [5, 'CREAR_USUARIO', 'usuarios', 10, JSON.stringify({ rol: 'admin' }), '127.0.0.1', 'Mozilla/5.0']
    );
  });

  it('deberia manejar valores nulos u omitidos', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    await logAudit({ accion: 'LOGIN' });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      [null, 'LOGIN', null, null, null, null, null]
    );
  });

  it('deberia capturar el error de consulta a la base de datos y registrar en consola sin lanzar excepcion', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // No debe lanzar error
    await expect(logAudit({ accion: 'LOGOUT' })).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
