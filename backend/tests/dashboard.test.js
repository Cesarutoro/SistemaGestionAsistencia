process.env.JWT_SECRET = 'test-secret';

jest.mock("../src/db", () => ({ query: jest.fn() }));

const pool = require("../src/db");
const router = require("../src/routes/dashboard");

const getResumenHandler = () =>
  router.stack.find(
    (layer) =>
      layer.route && layer.route.path === "/resumen" && layer.route.methods.get,
  ).route.stack[0].handle;

const getTendenciaHandler = () =>
  router.stack.find(
    (layer) =>
      layer.route && layer.route.path === "/tendencia-semanal" && layer.route.methods.get,
  ).route.stack[0].handle;

describe("Dashboard Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /dashboard/resumen", () => {
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

  describe("GET /dashboard/tendencia-semanal", () => {
    test("responde con tendencia semanal formateada correctamente", async () => {
      const mockRows = [
        { dia: "2026-03-09", total: "2" },
        { dia: "2026-03-11", total: "5" },
      ];
      pool.query.mockResolvedValueOnce([mockRows]);

      const req = { query: { fecha: "2026-03-13" } }; // Viernes 13, inicioSemana = Lunes 09
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getTendenciaHandler()(req, res);

      expect(json).toHaveBeenCalledWith(expect.objectContaining({
        dias: expect.any(Array),
      }));

      const resolvedData = json.mock.calls[0][0];
      expect(resolvedData.dias).toHaveLength(7);
      
      const monday = resolvedData.dias.find(d => d.dia === "2026-03-09");
      expect(monday.total).toBe(2);
      const expectedMondayDayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][new Date(new Date("2026-03-09").getTime()).getDay()];
      expect(monday.diaSemana).toBe(expectedMondayDayName);

      const wednesday = resolvedData.dias.find(d => d.dia === "2026-03-11");
      expect(wednesday.total).toBe(5);
    });

    test("responde 500 ante error en BD", async () => {
      pool.query.mockRejectedValueOnce(new Error("DB_ERROR"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const req = { query: { fecha: "2026-03-13" } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getTendenciaHandler()(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "DB_ERROR" });
      consoleErrorSpy.mockRestore();
    });
  });
});
