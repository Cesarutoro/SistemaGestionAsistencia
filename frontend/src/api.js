import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // necesario para enviar/recibir la cookie httpOnly del refresh token
});

// ── Interceptor de REQUEST ───────────────────────────────
// Adjunta el access token (guardado en memoria / localStorage) en cada petición.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor de RESPONSE ──────────────────────────────
// Si el servidor devuelve 401, intenta refrescar el access token una sola vez.
// Si el refresh también falla, limpia la sesión y redirige al login.
let isRefreshing = false;
let failedQueue = []; // peticiones que esperan el nuevo token

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si no hay config (error de red antes de enviar), rechazar directamente
    if (!originalRequest) return Promise.reject(error);

    // Solo intentar refresh en errores 401 que no sean ya el endpoint de refresh/login
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Encolar la petición hasta que el refresh termine
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const { data } = await api.post("/auth/refresh");
        const newToken = data.token;

        localStorage.setItem("token", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh falló → limpiar sesión
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        // Disparar evento para que AuthContext limpie el estado del usuario
        window.dispatchEvent(new Event("auth:sessionExpired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

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
  obtenerTendenciaSemanal: async (fecha = null) => {
    try {
      const params = fecha ? `?fecha=${fecha}` : "";
      const response = await api.get(`/dashboard/tendencia-semanal${params}`);
      return response.data;
    } catch {
      return { dias: [] };
    }
  },
};
