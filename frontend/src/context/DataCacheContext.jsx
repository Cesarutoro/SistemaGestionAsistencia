import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../api";
import { useAuth } from "./AuthContext";

const DataCacheContext = createContext(null);

export function DataCacheProvider({ children }) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const fetchEstudiantes = useCallback(
    async (force = false) => {
      if (estudiantes.length > 0 && !force) return estudiantes;
      if (authLoading || !user) return estudiantes;
      setLoadingEstudiantes(true);
      try {
        const res = await api.get("/estudiantes");
        setEstudiantes(res.data);
        return res.data;
      } catch (err) {
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          console.error("Error fetching estudiantes para caché", err);
        }
        return [];
      } finally {
        setLoadingEstudiantes(false);
      }
    },
    [estudiantes, authLoading, user],
  );

  const fetchCursos = useCallback(
    async (force = false) => {
      if (cursos.length > 0 && !force) return cursos;
      if (authLoading || !user) return cursos;
      setLoadingCursos(true);
      try {
        const res = await api.get("/cursos");
        setCursos(res.data);
        return res.data;
      } catch (err) {
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          console.error("Error fetching cursos para caché", err);
        }
        return [];
      } finally {
        setLoadingCursos(false);
      }
    },
    [cursos, authLoading, user],
  );

  const clearCache = useCallback(() => {
    setEstudiantes([]);
    setCursos([]);
  }, []);

  return (
    <DataCacheContext.Provider
      value={{
        estudiantes,
        cursos,
        loadingEstudiantes,
        loadingCursos,
        fetchEstudiantes,
        fetchCursos,
        clearCache,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error("useDataCache debe usarse dentro de un DataCacheProvider");
  }
  return context;
}
