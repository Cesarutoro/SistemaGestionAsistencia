import React, { useState, useEffect } from "react";
import api from "../api";
import {
  UserCheck,
  Clock,
  CheckCircle,
  Search,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";

const Asistencia = () => {
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [estudiantes, setEstudiantes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const toast = useToast();

  useEffect(() => {
    fetchCursos();
  }, []);
  useEffect(() => {
    if (cursoId) fetchAsistencia();
  }, [cursoId, fecha]);

  const fetchCursos = async () => {
    try {
      const res = await api.get("/cursos");
      setCursos(res.data);
      if (res.data.length > 0) setCursoId(res.data[0].id);
    } catch (err) {
      console.error("Error fetching cursos", err);
    }
  };

  const fetchAsistencia = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/asistencia/curso/${cursoId}?fecha=${fecha}`);
      setEstudiantes(res.data);
    } catch (err) {
      console.error("Error fetching asistencia", err);
    } finally {
      setLoading(false);
    }
  };

  const registrarIngreso = async (estudiante_id) => {
    const hora_ingreso = format(new Date(), "HH:mm:ss");
    try {
      await api.post("/asistencia", { estudiante_id, fecha, hora_ingreso });
      fetchAsistencia();
      toast.success("Ingreso registrado");
    } catch (err) {
      toast.error("Error al registrar ingreso");
    }
  };

  const deshacerIngreso = async (estudiante_id) => {
    if (window.confirm("¿Deshacer el ingreso de este estudiante?")) {
      try {
        await api.delete(`/asistencia/${estudiante_id}/${fecha}`);
        fetchAsistencia();
        toast.info("Ingreso deshecho");
      } catch (err) {
        toast.error("Error al deshacer ingreso");
      }
    }
  };

  const toggleJustificado = async (asistencia_id, currentStatus) => {
    try {
      await api.put(`/asistencia/${asistencia_id}/justificar`, {
        justificado: !currentStatus,
      });
      fetchAsistencia();
      toast.success("Justificación actualizada");
    } catch (err) {
      toast.error("Error al actualizar justificación");
    }
  };

  const filteredEstudiantes = estudiantes.filter((est) =>
    `${est.nombre} ${est.apellido} ${est.rut}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, cursoId, fecha]);

  // Mostrar todos sin paginación cuando NO hay búsqueda, usar paginación si hay búsqueda
  const shouldPaginate = searchTerm.trim() !== "";
  const paginatedEstudiantes = shouldPaginate
    ? filteredEstudiantes.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      )
    : filteredEstudiantes;

  const presentes = filteredEstudiantes.filter(
    (e) => e.hora_ingreso && !e.es_atraso,
  ).length;
  const atrasos = filteredEstudiantes.filter((e) => e.es_atraso).length;
  const pendientes = filteredEstudiantes.filter((e) => !e.hora_ingreso).length;

  return (
    <div>
      {/* ── HEADER ── */}
      <header style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          Control de Asistencia
        </h2>

        {/* Filtros - se apilan en móvil */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "0.75rem",
            background: "white",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: "600",
                color: "#64748b",
                marginBottom: "0.3rem",
              }}
            >
              Curso
            </label>
            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.9rem",
                background: "white",
              }}
            >
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: "600",
                color: "#64748b",
                marginBottom: "0.3rem",
              }}
            >
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.9rem",
              }}
            />
          </div>
          <div style={{ gridColumn: "span 1" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: "600",
                color: "#64748b",
                marginBottom: "0.3rem",
              }}
            >
              Buscar
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#f8fafc",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              }}
            >
              <Search size={15} color="#64748b" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Nombre o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  width: "100%",
                  fontSize: "0.875rem",
                }}
              />
            </div>
          </div>
        </div>

        {/* Contadores rápidos */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginTop: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              background: "#dcfce7",
              padding: "0.4rem 0.9rem",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: "600",
              color: "#166534",
            }}
          >
            ✅ Presentes: {presentes}
          </div>
          <div
            style={{
              background: "#fef3c7",
              padding: "0.4rem 0.9rem",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: "600",
              color: "#92400e",
            }}
          >
            ⏰ Atrasos: {atrasos}
          </div>
          <div
            style={{
              background: "#f1f5f9",
              padding: "0.4rem 0.9rem",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: "600",
              color: "#475569",
            }}
          >
            ⏳ Pendientes: {pendientes}
          </div>
        </div>
      </header>

      {/* ── TABLA ── */}
      {loading ? (
        <p>Cargando lista...</p>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th className="col-optional">RUT</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th className="col-optional">Justific.</th>
                  <th style={{ textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstudiantes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "#94a3b8",
                      }}
                    >
                      No se encontraron estudiantes
                    </td>
                  </tr>
                ) : (
                  paginatedEstudiantes.map((est) => (
                    <tr key={est.estudiante_id}>
                      <td>
                        <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                          {est.apellido}, {est.nombre}
                        </div>
                        {/* RUT visible en móvil bajo el nombre */}
                        <div
                          className="col-optional-show-mobile"
                          style={{
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                            display: "none",
                          }}
                        >
                          {est.rut}
                        </div>
                      </td>
                      <td
                        className="col-optional"
                        style={{ color: "#64748b", fontSize: "0.875rem" }}
                      >
                        {est.rut}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {est.hora_ingreso ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            <Clock size={14} />
                            {est.hora_ingreso.substring(0, 5)}
                          </div>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>-</span>
                        )}
                      </td>
                      <td>
                        {est.hora_ingreso ? (
                          est.es_atraso ? (
                            <span className="badge badge-warning">Atraso</span>
                          ) : (
                            <span className="badge badge-success">
                              Presente
                            </span>
                          )
                        ) : (
                          <span
                            style={{ color: "#94a3b8", fontSize: "0.8rem" }}
                          >
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="col-optional">
                        {est.es_atraso ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={!!est.justificado}
                              onChange={() =>
                                toggleJustificado(
                                  est.asistencia_id,
                                  est.justificado,
                                )
                              }
                              style={{
                                width: "16px",
                                height: "16px",
                                cursor: "pointer",
                              }}
                            />
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: est.justificado ? "#059669" : "#94a3b8",
                              }}
                            >
                              {est.justificado ? "Sí" : "No"}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "#e2e8f0" }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {est.hora_ingreso ? (
                          <button
                            onClick={() => deshacerIngreso(est.estudiante_id)}
                            className="btn btn-outline"
                            style={{
                              color: "#b91c1c",
                              borderColor: "#fca5a5",
                              padding: "0.35rem 0.6rem",
                            }}
                            title="Deshacer Ingreso"
                          >
                            <XCircle size={16} />
                            <span className="btn-export-text">Deshacer</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => registrarIngreso(est.estudiante_id)}
                            className="btn btn-primary"
                            style={{ padding: "0.35rem 0.75rem" }}
                            title="Marcar Ingreso"
                          >
                            <UserCheck size={16} />
                            <span className="btn-export-text">Marcar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {shouldPaginate && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredEstudiantes.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Asistencia;
