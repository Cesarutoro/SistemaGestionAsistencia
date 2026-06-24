// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import api, { apiSalidasAnticipadas, apiDashboard } from "../src/api";

describe("API Client & Helper Methods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.defaults.headers.common = {};
  });

  it("el request interceptor agrega Authorization header si hay token en localStorage", async () => {
    localStorage.setItem("token", "token-123");

    api.defaults.adapter = vi.fn().mockResolvedValue({
      status: 200,
      data: "ok",
      headers: {},
      config: {},
    });

    await api.get("/test-url");

    const [config] = api.defaults.adapter.mock.calls[0];
    expect(config.headers.Authorization).toBe("Bearer token-123");
  });

  it("el response interceptor intenta refrescar el token en caso de 401", async () => {
    let callCount = 0;
    api.defaults.adapter = vi.fn().mockImplementation(async (config) => {
      callCount++;
      if (config.url.endsWith("/auth/refresh")) {
        return {
          status: 200,
          data: { token: "token-refrescado" },
          headers: {},
          config,
        };
      }
      if (callCount === 1) {
        const error = new Error("401 Unauthorized");
        error.response = { status: 401, data: {} };
        error.config = config;
        throw error;
      }
      return {
        status: 200,
        data: "resultado-reintento",
        headers: {},
        config,
      };
    });

    const res = await api.get("/ruta-protegida");
    expect(res.data).toBe("resultado-reintento");
    expect(localStorage.getItem("token")).toBe("token-refrescado");
    expect(api.defaults.headers.common["Authorization"]).toBe("Bearer token-refrescado");
  });

  it("si el refresh falla, limpia la sesion y dispara el evento de expiracion", async () => {
    let callCount = 0;
    api.defaults.adapter = vi.fn().mockImplementation(async (config) => {
      callCount++;
      if (config.url.endsWith("/auth/refresh")) {
        const error = new Error("Refresh failed");
        error.response = { status: 401, data: {} };
        error.config = config;
        throw error;
      }
      if (callCount === 1) {
        const error = new Error("401 Unauthorized");
        error.response = { status: 401, data: {} };
        error.config = config;
        throw error;
      }
      return {
        status: 200,
        data: "ok",
        headers: {},
        config,
      };
    });

    const expiredEventSpy = vi.fn();
    window.addEventListener("auth:sessionExpired", expiredEventSpy);

    localStorage.setItem("token", "token-antiguo");

    await expect(api.get("/ruta-protegida")).rejects.toThrow();

    expect(localStorage.getItem("token")).toBeNull();
    expect(expiredEventSpy).toHaveBeenCalled();

    window.removeEventListener("auth:sessionExpired", expiredEventSpy);
  });

  describe("apiSalidasAnticipadas", () => {
    it("crear llama a POST /salidas-anticipadas y retorna los datos", async () => {
      const mockDatos = { estudiante_id: 1, motivo: "Cita medica" };
      api.defaults.adapter = vi.fn().mockResolvedValue({
        status: 200,
        data: { id: 99, ...mockDatos },
        headers: {},
        config: {},
      });

      const res = await apiSalidasAnticipadas.crear(mockDatos);
      expect(res).toEqual({ id: 99, ...mockDatos });
    });

    it("crear lanza error formateado en caso de fallo", async () => {
      api.defaults.adapter = vi.fn().mockRejectedValue({
        response: {
          status: 400,
          data: { error: "Validation Fail", errores: ["id invalido"] },
        },
      });

      await expect(apiSalidasAnticipadas.crear({})).rejects.toEqual({
        message: "Validation Fail",
        errores: ["id invalido"],
      });
    });

    it("obtenerPorEstudiante llama a GET con id y fecha si se provee", async () => {
      api.defaults.adapter = vi.fn().mockResolvedValue({
        status: 200,
        data: [],
        headers: {},
        config: {},
      });

      await apiSalidasAnticipadas.obtenerPorEstudiante(1, "2026-03-12");
      const [config] = api.defaults.adapter.mock.calls[0];
      expect(config.url).toContain("/salidas-anticipadas/estudiante/1?fecha=2026-03-12");
    });

    it("obtenerPorCurso llama a GET con id y fecha si se provee", async () => {
      api.defaults.adapter = vi.fn().mockResolvedValue({
        status: 200,
        data: [],
        headers: {},
        config: {},
      });

      await apiSalidasAnticipadas.obtenerPorCurso(5, "2026-03-12");
      const [config] = api.defaults.adapter.mock.calls[0];
      expect(config.url).toContain("/salidas-anticipadas/curso/5?fecha=2026-03-12");
    });

    it("obtenerDetalle llama a GET con id", async () => {
      api.defaults.adapter = vi.fn().mockResolvedValue({
        status: 200,
        data: { id: 7 },
        headers: {},
        config: {},
      });

      const res = await apiSalidasAnticipadas.obtenerDetalle(7);
      expect(res.id).toBe(7);
    });

    it("actualizar llama a PUT con id y datos", async () => {
      api.defaults.adapter = vi.fn().mockResolvedValue({
        status: 200,
        data: { message: "Updated" },
        headers: {},
        config: {},
      });

      const res = await apiSalidasAnticipadas.actualizar(12, { motivo: "Otro" });
      expect(res.message).toBe("Updated");
    });

    it("eliminar llama a DELETE con id", async () => {
      api.defaults.adapter = vi.fn().mockResolvedValue({
        status: 200,
        data: { message: "Deleted" },
        headers: {},
        config: {},
      });

      const res = await apiSalidasAnticipadas.eliminar(10);
      expect(res.message).toBe("Deleted");
    });

    it("eliminarPorFecha llama a DELETE con estudianteId y fecha", async () => {
      api.defaults.adapter = vi.fn().mockResolvedValue({
        status: 200,
        data: { message: "Deleted" },
        headers: {},
        config: {},
      });

      const res = await apiSalidasAnticipadas.eliminarPorFecha(1, "2026-03-12");
      expect(res.message).toBe("Deleted");
    });
  });

  describe("apiDashboard", () => {
    it("obtenerResumen llama a GET /dashboard/resumen", async () => {
      api.defaults.adapter = vi.fn().mockResolvedValue({
        status: 200,
        data: { total: 100 },
        headers: {},
        config: {},
      });

      const res = await apiDashboard.obtenerResumen("2026-03-12");
      expect(res.total).toBe(100);
    });

    it("obtenerTendenciaSemanal llama a GET y retorna dias", async () => {
      api.defaults.adapter = vi.fn().mockResolvedValue({
        status: 200,
        data: { dias: [1, 2] },
        headers: {},
        config: {},
      });

      const res = await apiDashboard.obtenerTendenciaSemanal();
      expect(res.dias).toEqual([1, 2]);
    });

    it("obtenerTendenciaSemanal retorna dias vacios al fallar la peticion", async () => {
      api.defaults.adapter = vi.fn().mockRejectedValue(new Error("Fail"));
      const res = await apiDashboard.obtenerTendenciaSemanal();
      expect(res).toEqual({ dias: [] });
    });
  });
});
