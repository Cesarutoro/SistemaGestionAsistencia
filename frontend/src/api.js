import axios from "axios";

const api = axios.create({
  baseURL:
    window.location.hostname === "localhost"
      ? "http://localhost:4000/api"
      : "/api",
});

// Adjuntar token automáticamente en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// ============ SALIDAS ANTICIPADAS ============

export const apiSalidasAnticipadas = {
  crear: async (datos) => {
    try {
      const response = await api.post("/salidas-anticipadas", datos);
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.error || error.message,
        errores: error.response?.data?.errores,
      };
    }
  },

  obtenerPorEstudiante: async (estudianteId, fecha = null) => {
    try {
      const params = fecha ? `?fecha=${fecha}` : "";
      const response = await api.get(
        `/salidas-anticipadas/estudiante/${estudianteId}${params}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  obtenerPorCurso: async (cursoId, fecha = null) => {
    try {
      const params = fecha ? `?fecha=${fecha}` : "";
      const response = await api.get(
        `/salidas-anticipadas/curso/${cursoId}${params}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  obtenerDetalle: async (id) => {
    try {
      const response = await api.get(`/salidas-anticipadas/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  actualizar: async (id, datos) => {
    try {
      const response = await api.put(`/salidas-anticipadas/${id}`, datos);
      return response.data;
    } catch (error) {
      throw {
        message: error.response?.data?.error || error.message,
        errores: error.response?.data?.errores,
      };
    }
  },

  eliminar: async (id) => {
    try {
      const response = await api.delete(`/salidas-anticipadas/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },

  eliminarPorFecha: async (estudianteId, fecha) => {
    try {
      const response = await api.delete(
        `/salidas-anticipadas/estudiante/${estudianteId}/fecha/${fecha}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },
};

export const apiDashboard = {
  obtenerResumen: async (fecha = null) => {
    try {
      const params = fecha ? `?fecha=${fecha}` : "";
      const response = await api.get(`/dashboard/resumen${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  },
};
