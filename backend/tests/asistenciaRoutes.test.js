process.env.RESEND_API_KEY = 're_falsa_para_aprobar_el_test_local';
process.env.JWT_SECRET = 'test-secret';

jest.mock("../src/db", () => ({ query: jest.fn() }));
jest.mock("../src/utils/notificationService", () => ({
  notificarApoderadoAtraso: jest.fn(),
}));

const pool = require("../src/db");
const notificationService = require("../src/utils/notificationService");
const router = require("../src/routes/asistencia");

const getHandler = (method, path) =>
  router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === path &&
      layer.route.methods[method],
  ).route.stack.at(-1).handle;

describe("Rutas de Asistencia - Cobertura Completa", () => {
  let req, res, json, status, setHeader, send;

  beforeEach(() => {
    jest.clearAllMocks();
    json = jest.fn();
    status = jest.fn().mockReturnThis();
    setHeader = jest.fn();
    send = jest.fn();
    res = { json, status, setHeader, send };
    req = {
      params: {},
      query: {},
      body: {},
      headers: {},
    };
  });

  describe("GET /curso/:cursoId", () => {
    test("Debería listar asistencia para un curso en la fecha indicada", async () => {
      req.params.cursoId = "5";
      req.query.fecha = "2026-06-24";
      const mockRows = [{ estudiante_id: 1, nombre: "Juan" }];
      pool.query.mockResolvedValueOnce([mockRows]);

      await getHandler("get", "/curso/:cursoId")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ["2026-06-24", "5"]);
      expect(json).toHaveBeenCalledWith(mockRows);
    });

    test("Debería listar asistencia usando la fecha actual por defecto si no se pasa fecha", async () => {
      req.params.cursoId = "5";
      const mockRows = [{ estudiante_id: 1, nombre: "Juan" }];
      pool.query.mockResolvedValueOnce([mockRows]);

      await getHandler("get", "/curso/:cursoId")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [expect.any(String), "5"]);
      expect(json).toHaveBeenCalledWith(mockRows);
    });

    test("Debería responder con 500 si falla la consulta", async () => {
      req.params.cursoId = "5";
      pool.query.mockRejectedValueOnce(new Error("DB Error"));

      await getHandler("get", "/curso/:cursoId")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "DB Error" });
    });
  });

  describe("POST / (Marcar asistencia)", () => {
    test("Debería registrar asistencia sin retraso y no enviar notificación", async () => {
      req.body = { estudiante_id: 10, fecha: "2026-06-24", hora_ingreso: "07:50:00" };
      pool.query.mockResolvedValueOnce([[{ id: 99 }]]);

      await getHandler("post", "/")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [10, "2026-06-24", "07:50:00", 0]);
      expect(notificationService.notificarApoderadoAtraso).not.toHaveBeenCalled();
      expect(json).toHaveBeenCalledWith({
        message: "Asistencia registrada",
        es_atraso: 0,
        id: 99,
      });
    });

    test("Debería registrar asistencia con retraso y enviar notificación si el estudiante existe", async () => {
      req.body = { estudiante_id: 10, fecha: "2026-06-24", hora_ingreso: "08:15:00" };
      pool.query.mockResolvedValueOnce([[{ id: 99 }]]); // INSERT
      pool.query.mockResolvedValueOnce([[{ nombre: "Juan", apellido: "Perez", correo_apoderado: "apoderado@test.com" }]]); // SELECT

      await getHandler("post", "/")(req, res);

      expect(pool.query).toHaveBeenNthCalledWith(1, expect.any(String), [10, "2026-06-24", "08:15:00", 1]);
      expect(pool.query).toHaveBeenNthCalledWith(2, expect.any(String), [10]);
      expect(notificationService.notificarApoderadoAtraso).toHaveBeenCalledWith({
        nombre_estudiante: "Juan Perez",
        correo_apoderado: "apoderado@test.com",
        fecha: "2026-06-24",
        hora_ingreso: "08:15:00",
      });
      expect(json).toHaveBeenCalledWith({
        message: "Asistencia registrada",
        es_atraso: 1,
        id: 99,
      });
    });

    test("Debería registrar asistencia con retraso y no notificar si el estudiante no se encuentra", async () => {
      req.body = { estudiante_id: 10, fecha: "2026-06-24", hora_ingreso: "08:15:00" };
      pool.query.mockResolvedValueOnce([[{ id: 99 }]]); // INSERT
      pool.query.mockResolvedValueOnce([[]]); // SELECT vacía

      await getHandler("post", "/")(req, res);

      expect(notificationService.notificarApoderadoAtraso).not.toHaveBeenCalled();
      expect(json).toHaveBeenCalledWith({
        message: "Asistencia registrada",
        es_atraso: 1,
        id: 99,
      });
    });

    test("Debería responder con 500 si falla la inserción", async () => {
      req.body = { estudiante_id: 10, fecha: "2026-06-24", hora_ingreso: "07:50:00" };
      pool.query.mockRejectedValueOnce(new Error("Insert Fail"));

      await getHandler("post", "/")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "Insert Fail" });
    });
  });

  describe("PUT /:id/justificar", () => {
    test("Debería actualizar la justificación con true y recortar la descripción", async () => {
      req.params.id = "4";
      req.body = { justificado: true, justificacion_descripcion: "   Licencia médica   " };
      pool.query.mockResolvedValueOnce([[]]);

      await getHandler("put", "/:id/justificar")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [true, "Licencia médica", "4"]);
      expect(json).toHaveBeenCalledWith({ message: "Estado de justificación actualizado" });
    });

    test("Debería poner descripción en null si no es un string", async () => {
      req.params.id = "4";
      req.body = { justificado: true, justificacion_descripcion: 12345 };
      pool.query.mockResolvedValueOnce([[]]);

      await getHandler("put", "/:id/justificar")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [true, null, "4"]);
    });

    test("Debería responder 500 en caso de fallo", async () => {
      req.params.id = "4";
      req.body = { justificado: false };
      pool.query.mockRejectedValueOnce(new Error("DB Update Error"));

      await getHandler("put", "/:id/justificar")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "DB Update Error" });
    });
  });

  describe("PUT /:id/hora (Editar hora de ingreso)", () => {
    test("Debería retornar 400 si no se provee hora_ingreso", async () => {
      req.params.id = "15";
      req.body = {};

      await getHandler("put", "/:id/hora")(req, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: "Debe proveer una hora_ingreso" });
    });

    test("Debería actualizar la hora agregando segundos si tiene longitud 5 (e.g. HH:MM)", async () => {
      req.params.id = "15";
      req.body = { hora_ingreso: "08:10" };
      pool.query.mockResolvedValueOnce([[]]);

      await getHandler("put", "/:id/hora")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ["08:10:00", 1, "15"]);
      expect(json).toHaveBeenCalledWith({ message: "Hora de ingreso actualizada", es_atraso: 1 });
    });

    test("Debería actualizar la hora sin agregar segundos si ya tiene longitud 8 (e.g. HH:MM:SS)", async () => {
      req.params.id = "15";
      req.body = { hora_ingreso: "07:55:00" };
      pool.query.mockResolvedValueOnce([[]]);

      await getHandler("put", "/:id/hora")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ["07:55:00", 0, "15"]);
      expect(json).toHaveBeenCalledWith({ message: "Hora de ingreso actualizada", es_atraso: 0 });
    });

    test("Debería responder 500 si falla BD", async () => {
      req.params.id = "15";
      req.body = { hora_ingreso: "08:15:00" };
      pool.query.mockRejectedValueOnce(new Error("DB Update Fail"));

      await getHandler("put", "/:id/hora")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "DB Update Fail" });
    });
  });

  describe("DELETE /:estudianteId/:fecha", () => {
    test("Debería eliminar la asistencia exitosamente", async () => {
      req.params = { estudianteId: "12", fecha: "2026-06-24" };
      pool.query.mockResolvedValueOnce([[]]);

      await getHandler("delete", "/:estudianteId/:fecha")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ["12", "2026-06-24"]);
      expect(json).toHaveBeenCalledWith({ message: "Asistencia eliminada" });
    });

    test("Debería responder 500 en caso de fallo", async () => {
      req.params = { estudianteId: "12", fecha: "2026-06-24" };
      pool.query.mockRejectedValueOnce(new Error("DB Delete Fail"));

      await getHandler("delete", "/:estudianteId/:fecha")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "DB Delete Fail" });
    });
  });

  describe("GET /atrasos/curso", () => {
    test("Debería obtener atrasos con paginación", async () => {
      req.query = { limit: "15", page: "2" };
      pool.query.mockResolvedValueOnce([[{ total: 100 }]]); // COUNT
      pool.query.mockResolvedValueOnce([[{ id: 1, nombre: "Juan" }]]); // SELECT

      await getHandler("get", "/atrasos/curso")(req, res);

      expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining("COUNT(*)"));
      expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining("LIMIT ? OFFSET ?"), [15, 15]);
      expect(json).toHaveBeenCalledWith({
        data: [{ id: 1, nombre: "Juan" }],
        total: 100,
        page: 2,
        limit: 15,
        totalPages: 7,
      });
    });

    test("Debería obtener atrasos sin paginación si limit no está definido", async () => {
      req.query = {};
      const mockRows = [{ id: 1, nombre: "Juan" }];
      pool.query.mockResolvedValueOnce([mockRows]);

      await getHandler("get", "/atrasos/curso")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("ORDER BY a.fecha DESC"));
      expect(json).toHaveBeenCalledWith(mockRows);
    });

    test("Debería responder 500 si falla la consulta", async () => {
      req.query = {};
      pool.query.mockRejectedValueOnce(new Error("Select Fail"));

      await getHandler("get", "/atrasos/curso")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "Select Fail" });
    });
  });

  describe("GET /atrasos/curso/:cursoId", () => {
    test("Debería filtrar por cursoId específico con paginación", async () => {
      req.params.cursoId = "3";
      req.query = { limit: "10", page: "1" };
      pool.query.mockResolvedValueOnce([[{ total: 20 }]]); // COUNT
      pool.query.mockResolvedValueOnce([[{ id: 1, nombre: "Pedro" }]]); // SELECT

      await getHandler("get", "/atrasos/curso/:cursoId")(req, res);

      expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining("e.curso_id = ?"), ["3"]);
      expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining("LIMIT ? OFFSET ?"), ["3", 10, 0]);
      expect(json).toHaveBeenCalledWith({
        data: [{ id: 1, nombre: "Pedro" }],
        total: 20,
        page: 1,
        limit: 10,
        totalPages: 2,
      });
    });

    test("Debería no añadir filtro de curso si cursoId es 'undefined'", async () => {
      req.params.cursoId = "undefined";
      req.query = {};
      const mockRows = [{ id: 2, nombre: "Marta" }];
      pool.query.mockResolvedValueOnce([mockRows]);

      await getHandler("get", "/atrasos/curso/:cursoId")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.not.stringContaining("e.curso_id = ?"), []);
      expect(json).toHaveBeenCalledWith(mockRows);
    });

    test("Debería responder 500 si falla", async () => {
      req.params.cursoId = "3";
      pool.query.mockRejectedValueOnce(new Error("Fail"));

      await getHandler("get", "/atrasos/curso/:cursoId")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "Fail" });
    });
  });

  describe("GET /atrasos/:estudianteId", () => {
    test("Debería retornar atrasos de un estudiante específico", async () => {
      req.params.estudianteId = "45";
      const mockRows = [{ id: 1, fecha: "2026-06-24", hora_ingreso: "08:10:00" }];
      pool.query.mockResolvedValueOnce([mockRows]);

      await getHandler("get", "/atrasos/:estudianteId")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ["45"]);
      expect(json).toHaveBeenCalledWith(mockRows);
    });

    test("Debería responder 500 si falla", async () => {
      req.params.estudianteId = "45";
      pool.query.mockRejectedValueOnce(new Error("DB fail"));

      await getHandler("get", "/atrasos/:estudianteId")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "DB fail" });
    });
  });

  describe("GET /export/curso/:cursoId", () => {
    test("Debería retornar 404 si no hay atrasos para el curso", async () => {
      req.params.cursoId = "4";
      pool.query.mockResolvedValueOnce([[]]);

      await getHandler("get", "/export/curso/:cursoId")(req, res);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ error: "No hay atrasos registrados para este curso" });
    });

    test("Debería exportar archivo Excel si hay registros", async () => {
      req.params.cursoId = "4";
      const mockRows = [{
        curso: "1A",
        rut: "1-9",
        apellidos: "Gómez",
        nombres: "Luis",
        dia: "Lunes",
        fecha: "2026-06-22",
        hora: "08:15",
        justificado: "NO"
      }];
      pool.query.mockResolvedValueOnce([mockRows]);

      await getHandler("get", "/export/curso/:cursoId")(req, res);

      expect(setHeader).toHaveBeenCalledWith("Content-Type", expect.any(String));
      expect(setHeader).toHaveBeenCalledWith("Content-Disposition", expect.stringContaining("Atrasos_1A.xlsx"));
      expect(send).toHaveBeenCalledWith(expect.any(Buffer));
    });

    test("Debería responder 500 si falla", async () => {
      req.params.cursoId = "4";
      pool.query.mockRejectedValueOnce(new Error("Export Error"));

      await getHandler("get", "/export/curso/:cursoId")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "Export Error" });
    });
  });

  describe("GET /export/todos", () => {
    test("Debería retornar 404 si no hay atrasos", async () => {
      pool.query.mockResolvedValueOnce([[]]);

      await getHandler("get", "/export/todos")(req, res);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ error: "No hay atrasos registrados" });
    });

    test("Debería exportar Excel si hay registros", async () => {
      const mockRows = [{
        curso: "1A",
        rut: "1-9",
        apellidos: "Gómez",
        nombres: "Luis",
        dia: "Lunes",
        fecha: "2026-06-22",
        hora: "08:15",
        justificado: "NO"
      }];
      pool.query.mockResolvedValueOnce([mockRows]);

      await getHandler("get", "/export/todos")(req, res);

      expect(setHeader).toHaveBeenCalledWith("Content-Type", expect.any(String));
      expect(setHeader).toHaveBeenCalledWith("Content-Disposition", expect.stringContaining("Atrasos_Totales.xlsx"));
      expect(send).toHaveBeenCalledWith(expect.any(Buffer));
    });

    test("Debería responder 500 si falla", async () => {
      pool.query.mockRejectedValueOnce(new Error("Export Error"));

      await getHandler("get", "/export/todos")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "Export Error" });
    });
  });

  describe("GET /export/resumen", () => {
    test("Debería retornar 404 si no hay resumen", async () => {
      pool.query.mockResolvedValueOnce([[]]);

      await getHandler("get", "/export/resumen")(req, res);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ error: "No hay atrasos registrados" });
    });

    test("Debería exportar resumen en Excel", async () => {
      const mockRows = [{
        curso: "1A",
        rut: "1-9",
        apellidos: "Gómez",
        nombres: "Luis",
        total_atrasos: 3
      }];
      pool.query.mockResolvedValueOnce([mockRows]);

      await getHandler("get", "/export/resumen")(req, res);

      expect(setHeader).toHaveBeenCalledWith("Content-Type", expect.any(String));
      expect(setHeader).toHaveBeenCalledWith("Content-Disposition", expect.stringContaining("Resumen_Atrasos.xlsx"));
      expect(send).toHaveBeenCalledWith(expect.any(Buffer));
    });

    test("Debería responder 500 si falla", async () => {
      pool.query.mockRejectedValueOnce(new Error("Export Error"));

      await getHandler("get", "/export/resumen")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "Export Error" });
    });
  });

  describe("GET /export/estudiante/:estudianteId", () => {
    test("Debería retornar 404 si no hay atrasos para el estudiante", async () => {
      req.params.estudianteId = "10";
      pool.query.mockResolvedValueOnce([[]]);

      await getHandler("get", "/export/estudiante/:estudianteId")(req, res);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({ error: "No hay atrasos registrados para este estudiante" });
    });

    test("Debería exportar Excel del estudiante si hay registros", async () => {
      req.params.estudianteId = "10";
      const mockRows = [{
        apellidos: "Gómez",
        nombres: "Luis",
        curso: "1A",
        dia: "Lunes",
        fecha: "2026-06-22",
        hora: "08:15",
        justificado: "NO"
      }];
      pool.query.mockResolvedValueOnce([mockRows]);

      await getHandler("get", "/export/estudiante/:estudianteId")(req, res);

      expect(setHeader).toHaveBeenCalledWith("Content-Type", expect.any(String));
      expect(setHeader).toHaveBeenCalledWith("Content-Disposition", expect.stringContaining("Atrasos_G_mez_Luis.xlsx"));
      expect(send).toHaveBeenCalledWith(expect.any(Buffer));
    });

    test("Debería responder 500 si falla", async () => {
      req.params.estudianteId = "10";
      pool.query.mockRejectedValueOnce(new Error("Export Error"));

      await getHandler("get", "/export/estudiante/:estudianteId")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "Export Error" });
    });
  });
});
