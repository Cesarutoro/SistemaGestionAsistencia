process.env.JWT_SECRET = 'test-secret';

jest.mock("../src/db", () => ({ query: jest.fn() }));

const pool = require("../src/db");
const router = require("../src/routes/asistencia");

const getHandler = (method, path) =>
  router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === path &&
      layer.route.methods[method],
  ).route.stack.at(-1).handle;

describe("Rutas de Asistencia - Justificación con descripción", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("PUT /:id/justificar guarda descripción opcional cuando justificado=true", async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const req = {
      params: { id: "7" },
      body: {
        justificado: true,
        justificacion_descripcion: "  Certificado médico  ",
      },
    };

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    await getHandler("put", "/:id/justificar")(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      "UPDATE asistencia SET justificado = ?, justificacion_descripcion = ? WHERE id = ?",
      [true, "Certificado médico", "7"],
    );
    expect(status).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({
      message: "Estado de justificación actualizado",
    });
  });

  test("PUT /:id/justificar limpia descripción cuando justificado=false", async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const req = {
      params: { id: "8" },
      body: {
        justificado: false,
        justificacion_descripcion: "No debería persistir",
      },
    };

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    await getHandler("put", "/:id/justificar")(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      "UPDATE asistencia SET justificado = ?, justificacion_descripcion = ? WHERE id = ?",
      [false, null, "8"],
    );
    expect(status).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({
      message: "Estado de justificación actualizado",
    });
  });

  test("PUT /:id/justificar responde 500 si falla BD", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB_FAIL"));

    const req = {
      params: { id: "9" },
      body: { justificado: true, justificacion_descripcion: "Test" },
    };

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    await getHandler("put", "/:id/justificar")(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: "DB_FAIL" });
  });

  test("GET /atrasos/curso incluye justificacion_descripcion en la consulta", async () => {
    const fakeRows = [
      {
        id: 1,
        fecha: "2026-03-19",
        hora_ingreso: "08:15:00",
        justificado: true,
        justificacion_descripcion: "Atención médica",
        nombre: "Ana",
        apellido: "Pérez",
        curso_nombre: "1A",
      },
    ];

    pool.query.mockResolvedValueOnce([fakeRows]);

    const req = {};
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    await getHandler("get", "/atrasos/curso")(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toContain("a.justificacion_descripcion");
    expect(status).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith(fakeRows);
  });
});
