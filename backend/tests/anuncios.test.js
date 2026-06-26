process.env.JWT_SECRET = 'test-secret';

jest.mock("../src/db", () => ({ query: jest.fn(), pool: { on: jest.fn() } }));

// Mock node-cache to avoid cache pollution between tests
jest.mock("node-cache", () => {
  return jest.fn().mockImplementation(() => {
    return {
      get: jest.fn().mockReturnValue(null), // Always miss cache
      set: jest.fn(),
    };
  });
});

const pool = require("../src/db");
const router = require("../src/routes/anuncios");

function getHandler(method, path) {
  const layer = router.stack.find(
    (l) => l.route && l.route.path === path && l.route.methods[method],
  );
  return layer?.route?.stack?.at(-1)?.handle;
}

describe("Anuncios Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("deberia retornar anuncios activos", async () => {
      const mockAnuncios = [{ id: 10, titulo: "Mantenimiento", mensaje: "Mensaje", tipo: "maintenance" }];
      pool.query.mockResolvedValueOnce([mockAnuncios]);

      const req = {};
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler("get", "/")(req, res);

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("SELECT id, titulo"), expect.any(Array));
      expect(json).toHaveBeenCalledWith(mockAnuncios);
    });

    it("deberia retornar 500 si falla la consulta", async () => {
      pool.query.mockRejectedValueOnce(new Error("DB error"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const req = {};
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler("get", "/")(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: "DB error" });
      consoleErrorSpy.mockRestore();
    });
  });

  describe("GET /todos", () => {
    it("deberia retornar todos los anuncios", async () => {
      const mockAnuncios = [{ id: 10, titulo: "Aviso" }];
      pool.query.mockResolvedValueOnce([mockAnuncios]);

      const req = {};
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler("get", "/todos")(req, res);

      expect(json).toHaveBeenCalledWith(mockAnuncios);
    });
  });

  describe("POST /", () => {
    it("rechaza anuncio sin título", async () => {
      const req = { body: { mensaje: "Contenido", tipo: "info" } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler("post", "/")(req, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: "Título y mensaje son obligatorios" });
    });

    it("crea anuncio correctamente", async () => {
      pool.query.mockResolvedValueOnce([[{ id: 10 }]]); // RETURNING id

      const req = { body: { titulo: "Nuevo aviso", mensaje: "Contenido", tipo: "warning" } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler("post", "/")(req, res);

      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalledWith({ id: 10, titulo: "Nuevo aviso", mensaje: "Contenido", tipo: "warning" });
    });
  });

  describe("PUT /:id", () => {
    it("actualiza anuncio correctamente", async () => {
      pool.query.mockResolvedValueOnce([[]]); // UPDATE query

      const req = {
        params: { id: "10" },
        body: { titulo: "Titulo Editado", mensaje: "Mensaje Editado" },
      };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler("put", "/:id")(req, res);

      expect(json).toHaveBeenCalledWith({ message: "Anuncio actualizado" });
    });
  });

  describe("DELETE /:id", () => {
    it("elimina anuncio correctamente", async () => {
      pool.query.mockResolvedValueOnce([[]]); // DELETE query

      const req = { params: { id: "10" } };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { json, status };

      await getHandler("delete", "/:id")(req, res);

      expect(json).toHaveBeenCalledWith({ message: "Anuncio eliminado" });
    });
  });
});
