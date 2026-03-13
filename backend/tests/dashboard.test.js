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

  test("responde con resumen dashboard completo", async () => {
    pool.query
      .mockResolvedValueOnce([[{ total_estudiantes: 120 }]])
      .mockResolvedValueOnce([[{ atrasos_hoy: 9 }]])
      .mockResolvedValueOnce([
        [
          {
            estudiante_id: 1,
            nombre: "Ana",
            apellido: "Pérez",
            rut: "11",
            curso_nombre: "1A",
            total_atrasos: 4,
          },
        ],
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
    expect(json).toHaveBeenCalledWith({
      fecha: "2026-03-13",
      total_estudiantes: 120,
      atrasos_hoy: 9,
      estudiantes_3mas_atrasos_semana: [
        {
          estudiante_id: 1,
          nombre: "Ana",
          apellido: "Pérez",
          rut: "11",
          curso_nombre: "1A",
          total_atrasos: 4,
        },
      ],
      ranking_cursos_semana: [
        { curso_id: 1, curso_nombre: "1A", total_atrasos: 12 },
      ],
      ranking_cursos_mes: [
        { curso_id: 2, curso_nombre: "2B", total_atrasos: 30 },
      ],
    });
    expect(pool.query).toHaveBeenCalledTimes(5);
  });

  test("responde 500 ante error de BD", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB_FAIL"));

    const req = { query: { fecha: "2026-03-13" } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { json, status };

    await getResumenHandler()(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: "DB_FAIL" });
  });
});
