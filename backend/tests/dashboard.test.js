process.env.JWT_SECRET = 'test-secret';

jest.mock("../src/db", () => ({ query: jest.fn() }));

const pool = require("../src/db");
const router = require("../src/routes/dashboard");

const getResumenHandler = () =>
  router.stack.find(
    (layer) =>
      layer.route && layer.route.path === "/resumen" && layer.route.methods.get,
  ).route.stack[0].handle;

describe("GET /dashboard/resumen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("responde con resumen dashboard completo incluyendo tendencia", async () => {
    pool.query
      .mockResolvedValueOnce([[{ total_estudiantes: 120 }]])
      .mockResolvedValueOnce([[{ atrasos_hoy: 9 }]])
      .mockResolvedValueOnce([[{ atrasos_ayer: 5 }]])
      .mockResolvedValueOnce([
        [{ estudiante_id: 1, nombre: "Ana", apellido: "Pérez", rut: "11", curso_nombre: "1A", total_atrasos: 4 }],
      ])
      .mockResolvedValueOnce([
        [{ curso_id: 1, curso_nombre: "1A", total_atrasos: 12 }],
      ])
      .mockResolvedValueOnce([
        [{ curso_id: 2, curso_nombre: "2B", total_atrasos: 30 }],
      ]);

    const req = { query: { fecha: "2026-03-13" } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    await getResumenHandler()(req, res);

    expect(status).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      fecha: "2026-03-13",
      total_estudiantes: 120,
      atrasos_hoy: 9,
      atrasos_ayer: 5,
      tendencia_atrasos: "80.0",
    }));
    expect(pool.query).toHaveBeenCalledTimes(6);
  });

  test("responde 500 ante error de BD", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB_FAIL"));

    const req = { query: { fecha: "2099-01-01" } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    await getResumenHandler()(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: "DB_FAIL" });
  });
});
