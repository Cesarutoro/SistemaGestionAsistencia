import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import {
  AlertTriangle,
  User,
  FileDown,
  Clock,
  Check,
  X,
  Pencil,
  Search,
} from "lucide-react";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { useDataCache } from "../context/DataCacheContext";
import { TableSkeleton } from "../components/LoadingSkeleton";

// ── Modal genérico ──────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "1.75rem",
        minWidth: "360px",
        maxWidth: "480px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{title}</h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Atrasos = () => {
  const {
    estudiantes,
    cursos,
    fetchEstudiantes,
    fetchCursos,
    loadingEstudiantes,
    loadingCursos,
  } = useDataCache();

  const [filters, setFilters] = useState({
    curso: "",
    estudiante: "",
  });
  const [atrasos, setAtrasos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estado para edición de hora
  const [editingId, setEditingId] = useState(null);
  const [editingHora, setEditingHora] = useState("");
  const [savingId, setSavingId] = useState(null);
  const inputRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const toast = useToast();

  // Estado para modales de exportación
  const [showExportCursoModal, setShowExportCursoModal] = useState(false);
  const [showExportEstudianteModal, setShowExportEstudianteModal] =
    useState(false);
  const [exportCursoId, setExportCursoId] = useState("");
  const [exportEstudianteId, setExportEstudianteId] = useState("");
  const [exportEstudianteBusqueda, setExportEstudianteBusqueda] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [editingDescripcionId, setEditingDescripcionId] = useState(null);
  const [descripcionDraft, setDescripcionDraft] = useState("");
  const [savingDescripcionId, setSavingDescripcionId] = useState(null);

  useEffect(() => {
    fetchEstudiantes();
    fetchCursos();
  }, [fetchEstudiantes, fetchCursos]);

  useEffect(() => {
    fetchAtrasos();
  }, [filters]);

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const fetchAtrasos = async () => {
    setLoading(true);
    try {
      let endpoint = "";
      if (filters.estudiante) {
        endpoint = `/asistencia/atrasos/${filters.estudiante}`;
      } else {
        endpoint = filters.curso
          ? `/asistencia/atrasos/curso/${filters.curso}`
          : "/asistencia/atrasos/curso";
      }
      const res = await api.get(endpoint);
      setAtrasos(res.data);
    } catch (err) {
      console.error("Error fetching atrasos", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleJustificado = async (
    asistencia_id,
    currentStatus,
    currentDescription,
  ) => {
    const nextStatus = !currentStatus;
    const descripcion = nextStatus ? currentDescription || null : null;

    try {
      await api.put(`/asistencia/${asistencia_id}/justificar`, {
        justificado: nextStatus,
        justificacion_descripcion: descripcion,
      });

      if (nextStatus) {
        setEditingDescripcionId(asistencia_id);
        setDescripcionDraft(currentDescription || "");
      } else {
        setEditingDescripcionId(null);
        setDescripcionDraft("");
      }

      fetchAtrasos();
      toast.success("Justificación actualizada");
    } catch (err) {
      toast.error("Error al actualizar justificación");
    }
  };

  const iniciarEdicionDescripcion = (atr) => {
    if (!atr.justificado) return;
    setEditingDescripcionId(atr.id);
    setDescripcionDraft(atr.justificacion_descripcion || "");
  };

  const cancelarEdicionDescripcion = () => {
    setEditingDescripcionId(null);
    setDescripcionDraft("");
  };

  const guardarDescripcionJustificacion = async (asistenciaId) => {
    const descripcion = descripcionDraft.trim() || null;
    setSavingDescripcionId(asistenciaId);

    try {
      await api.put(`/asistencia/${asistenciaId}/justificar`, {
        justificado: true,
        justificacion_descripcion: descripcion,
      });
      setEditingDescripcionId(null);
      setDescripcionDraft("");
      fetchAtrasos();
      toast.success("Descripción de justificación actualizada");
    } catch (err) {
      toast.error("Error al actualizar la descripción");
    } finally {
      setSavingDescripcionId(null);
    }
  };

  // Iniciar edición de hora
  const startEditHora = (atr) => {
    const horaActual = atr.hora_ingreso ? atr.hora_ingreso.substring(0, 5) : "";
    setEditingId(atr.id);
    setEditingHora(horaActual);
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingId(null);
    setEditingHora("");
  };

  // Guardar nueva hora
  const saveHora = async (asistencia_id) => {
    if (!editingHora) {
      toast.info("Por favor ingrese una hora válida.");
      return;
    }
    setSavingId(asistencia_id);
    try {
      await api.put(`/asistencia/${asistencia_id}/hora`, {
        hora_ingreso: editingHora,
      });
      setEditingId(null);
      setEditingHora("");
      fetchAtrasos();
      toast.success("Hora de atraso actualizada");
    } catch (err) {
      toast.error("Error al actualizar la hora del atraso");
    } finally {
      setSavingId(null);
    }
  };

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter") saveHora(id);
    if (e.key === "Escape") cancelEdit();
  };

  // Descarga un Excel autenticado usando axios (window.open no envía el token JWT)
  const downloadExcel = async (endpoint, filename) => {
    setIsExporting(true);
    try {
      const response = await api.get(endpoint, { responseType: "blob" });
      const blobData =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blobData);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      toast.success("Archivo descargado exitosamente");
      return true;
    } catch (err) {
      let backendMessage = "";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          backendMessage = json?.error || "";
        } catch {
          backendMessage = "";
        }
      }

      const msg =
        backendMessage ||
        (err.response?.status === 404
          ? "No hay atrasos registrados para exportar."
          : "Error al exportar el archivo.");
      toast.error(msg);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCurso = async () => {
    if (!exportCursoId) {
      toast.info("Por favor, selecciona un curso.");
      return;
    }
    const nombre =
      cursos.find((c) => String(c.id) === String(exportCursoId))?.nombre ??
      "Curso";
    const safe = String(nombre).replace(/[^a-zA-Z0-9]/g, "_");
    const ok = await downloadExcel(
      `/asistencia/export/curso/${exportCursoId}`,
      `Atrasos_${safe}.xlsx`,
    );
    if (ok) {
      setShowExportCursoModal(false);
      setExportCursoId("");
    }
  };

  const handleExportEstudiante = async () => {
    if (!exportEstudianteId) {
      toast.info("Por favor, selecciona un estudiante.");
      return;
    }
    const est = estudiantes.find(
      (e) => String(e.id) === String(exportEstudianteId),
    );
    const safe = est
      ? `${String(est.apellido ?? "Estudiante")}_${String(est.nombre ?? "")}`.replace(
          /[^a-zA-Z0-9]/g,
          "_",
        )
      : "Estudiante";
    const ok = await downloadExcel(
      `/asistencia/export/estudiante/${exportEstudianteId}`,
      `Atrasos_${safe}.xlsx`,
    );
    if (ok) {
      setShowExportEstudianteModal(false);
      setExportEstudianteId("");
      setExportEstudianteBusqueda("");
    }
  };

  const handleExportTodos = async () => {
    await downloadExcel(`/asistencia/export/todos`, `Atrasos_Totales.xlsx`);
  };

  const handleExportResumen = async () => {
    await downloadExcel(`/asistencia/export/resumen`, `Resumen_Atrasos.xlsx`);
  };

  // Estudiantes filtrados por búsqueda en el modal
  const estudiantesFiltrados = estudiantes.filter((e) => {
    const q = exportEstudianteBusqueda.toLowerCase();
    return (
      !q ||
      e.nombre.toLowerCase().includes(q) ||
      e.apellido.toLowerCase().includes(q) ||
      (e.rut && e.rut.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const paginatedAtrasos = atrasos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div>
      <header style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem" }}>Historial de Atrasos</h2>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                setExportEstudianteId("");
                setExportEstudianteBusqueda("");
                setShowExportEstudianteModal(true);
              }}
            >
              <FileDown size={18} />
              Exportar Estudiante
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setExportCursoId("");
                setShowExportCursoModal(true);
              }}
            >
              <FileDown size={18} />
              Exportar Curso
            </button>
            <button className="btn btn-outline" onClick={handleExportTodos}>
              <FileDown size={18} />
              Exportar Todo
            </button>
            <button className="btn btn-primary" onClick={handleExportResumen}>
              <FileDown size={18} />
              Exportar Resumen
            </button>
          </div>
        </div>
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(200px, 1fr) 2fr",
              gap: "1rem",
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#64748b",
                  marginBottom: "0.5rem",
                }}
              >
                Filtrar por Curso
              </label>
              <select
                value={filters.curso}
                onChange={(e) => {
                  setFilters({
                    curso: e.target.value,
                    estudiante: "",
                  });
                }}
                className="btn btn-outline"
                style={{ width: "100%" }}
              >
                <option value="">Todos los cursos</option>
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
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#64748b",
                  marginBottom: "0.5rem",
                }}
              >
                Seleccionar Estudiante
              </label>
              <div style={{ position: "relative" }}>
                <User
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                  size={18}
                />
                <select
                  value={filters.estudiante}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      estudiante: e.target.value,
                    }))
                  }
                  className="btn btn-outline"
                  style={{ width: "100%", paddingLeft: "2.5rem" }}
                >
                  <option value="">-- Buscar estudiante --</option>
                  {loadingEstudiantes && estudiantes.length === 0 ? (
                    <option disabled>Cargando estudiantes...</option>
                  ) : (
                    estudiantes
                      .filter((e) =>
                        filters.curso
                          ? String(e.curso_id) === String(filters.curso)
                          : true,
                      )
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.apellido}, {e.nombre} ({e.curso_nombre})
                        </option>
                      ))
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: "1.5rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <AlertTriangle color="#b45309" size={20} />
            <h3 style={{ fontSize: "1.125rem" }}>
              {filters.estudiante && atrasos.length > 0
                ? `Atrasos de ${atrasos[0].apellido}, ${atrasos[0].nombre}`
                : filters.curso
                  ? "Atrasos del Curso"
                  : "Todos los Atrasos"}{" "}
              ({atrasos.length})
            </h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Fecha</th>
                  <th>Hora de Ingreso</th>
                  <th>Estado</th>
                  <th>Justificación</th>
                  <th>Descripción Justificación</th>
                </tr>
              </thead>
              <tbody>
                {atrasos.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", padding: "2rem" }}
                    >
                      No se cuentan con atrasos registrados en esta selección.
                    </td>
                  </tr>
                ) : (
                  paginatedAtrasos.map((atr, idx) => {
                    const [year, month, day] = atr.fecha.split("-");
                    const safeFecha = `${day}/${month}/${year}`;
                    const safeHora = atr.hora_ingreso
                      ? atr.hora_ingreso.substring(0, 5)
                      : "--:--";
                    const isEditing = editingId === atr.id;
                    const isSaving = savingId === atr.id;

                    return (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: "600" }}>
                            {atr.apellido}, {atr.nombre}
                          </div>
                          <div
                            style={{ fontSize: "0.75rem", color: "#64748b" }}
                          >
                            {atr.curso_nombre}
                          </div>
                        </td>
                        <td style={{ fontWeight: "500" }}>{safeFecha}</td>
                        <td>
                          {isEditing ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                              }}
                            >
                              <input
                                ref={inputRef}
                                type="time"
                                value={editingHora}
                                onChange={(e) => setEditingHora(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, atr.id)}
                                style={{
                                  border: "2px solid #3b82f6",
                                  borderRadius: "6px",
                                  padding: "0.25rem 0.5rem",
                                  fontSize: "0.9rem",
                                  outline: "none",
                                  width: "110px",
                                }}
                              />
                              <button
                                onClick={() => saveHora(atr.id)}
                                disabled={isSaving}
                                title="Guardar hora"
                                style={{
                                  background: "#22c55e",
                                  border: "none",
                                  borderRadius: "5px",
                                  padding: "0.25rem 0.4rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  color: "white",
                                }}
                              >
                                <Check size={15} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                title="Cancelar"
                                style={{
                                  background: "#ef4444",
                                  border: "none",
                                  borderRadius: "5px",
                                  padding: "0.25rem 0.4rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  color: "white",
                                }}
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <Clock size={14} color="#94a3b8" />
                              <span>{safeHora} hrs</span>
                              <button
                                onClick={() => startEditHora(atr)}
                                title="Editar hora"
                                style={{
                                  background: "none",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "5px",
                                  padding: "0.15rem 0.35rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  color: "#64748b",
                                  transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#f1f5f9";
                                  e.currentTarget.style.borderColor = "#3b82f6";
                                  e.currentTarget.style.color = "#3b82f6";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "none";
                                  e.currentTarget.style.borderColor = "#cbd5e1";
                                  e.currentTarget.style.color = "#64748b";
                                }}
                              >
                                <Pencil size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-warning">Atraso</span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={!!atr.justificado}
                              onChange={() =>
                                toggleJustificado(
                                  atr.id,
                                  atr.justificado,
                                  atr.justificacion_descripcion,
                                )
                              }
                              style={{
                                width: "18px",
                                height: "18px",
                                cursor: "pointer",
                              }}
                            />
                            <span
                              style={{
                                fontSize: "0.875rem",
                                color: atr.justificado ? "#059669" : "#64748b",
                              }}
                            >
                              {atr.justificado
                                ? "Justificado"
                                : "Sin justificar"}
                            </span>
                          </div>
                        </td>
                        <td style={{ maxWidth: "320px" }}>
                          {atr.justificado ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: "0.4rem",
                                width: "100%",
                              }}
                            >
                              {editingDescripcionId === atr.id ? (
                                <>
                                  <textarea
                                    value={descripcionDraft}
                                    onChange={(e) =>
                                      setDescripcionDraft(e.target.value)
                                    }
                                    rows={2}
                                    placeholder="Agregar descripción (opcional)"
                                    style={{
                                      width: "100%",
                                      minWidth: "220px",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "6px",
                                      padding: "0.4rem 0.5rem",
                                      fontSize: "0.85rem",
                                      resize: "vertical",
                                      fontFamily: "inherit",
                                    }}
                                  />
                                  <div style={{ display: "flex", gap: "0.35rem" }}>
                                    <button
                                      className="btn btn-primary"
                                      onClick={() =>
                                        guardarDescripcionJustificacion(atr.id)
                                      }
                                      disabled={savingDescripcionId === atr.id}
                                      style={{
                                        padding: "0.25rem 0.5rem",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      {savingDescripcionId === atr.id
                                        ? "Guardando..."
                                        : "Guardar"}
                                    </button>
                                    <button
                                      className="btn btn-outline"
                                      onClick={cancelarEdicionDescripcion}
                                      disabled={savingDescripcionId === atr.id}
                                      style={{
                                        padding: "0.25rem 0.5rem",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div
                                    style={{
                                      width: "100%",
                                      display: "flex",
                                      alignItems: "flex-start",
                                      justifyContent: "space-between",
                                      gap: "0.5rem",
                                    }}
                                  >
                                    {atr.justificacion_descripcion ? (
                                      <span
                                        style={{
                                          color: "#334155",
                                          fontSize: "0.85rem",
                                          lineHeight: 1.35,
                                          flex: 1,
                                        }}
                                      >
                                        {atr.justificacion_descripcion}
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          color: "#94a3b8",
                                          fontSize: "0.85rem",
                                          flex: 1,
                                        }}
                                      >
                                        Sin descripción
                                      </span>
                                    )}
                                    <button
                                      className="btn btn-outline"
                                      onClick={() => iniciarEdicionDescripcion(atr)}
                                      title="Editar descripción"
                                      style={{
                                        padding: "0.25rem 0.4rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: "32px",
                                      }}
                                    >
                                      <Pencil size={13} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#cbd5e1" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={atrasos.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modal: Exportar por Curso */}
      {showExportCursoModal && (
        <Modal
          title="Exportar atrasos por curso"
          onClose={() => setShowExportCursoModal(false)}
        >
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#64748b",
                marginBottom: "0.5rem",
              }}
            >
              Selecciona un curso
            </label>
            <select
              value={exportCursoId}
              onChange={(e) => setExportCursoId(e.target.value)}
              className="btn btn-outline"
              style={{ width: "100%" }}
            >
              <option value="">-- Seleccionar curso --</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="btn btn-outline"
              onClick={() => setShowExportCursoModal(false)}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExportCurso}
              disabled={!exportCursoId || isExporting}
            >
              <FileDown size={16} />{" "}
              {isExporting ? "Descargando..." : "Descargar"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Exportar por Estudiante */}
      {showExportEstudianteModal && (
        <Modal
          title="Exportar atrasos de un estudiante"
          onClose={() => setShowExportEstudianteModal(false)}
        >
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#64748b",
                marginBottom: "0.5rem",
              }}
            >
              Buscar estudiante
            </label>
            <div style={{ position: "relative", marginBottom: "0.75rem" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="text"
                placeholder="Nombre, apellido o RUT..."
                value={exportEstudianteBusqueda}
                onChange={(e) => {
                  setExportEstudianteBusqueda(e.target.value);
                  setExportEstudianteId("");
                }}
                style={{
                  width: "100%",
                  paddingLeft: "2.25rem",
                  padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <select
              value={exportEstudianteId}
              onChange={(e) => setExportEstudianteId(e.target.value)}
              size={6}
              style={{
                width: "100%",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "0.875rem",
                padding: "0.25rem",
              }}
            >
              {estudiantesFiltrados.length === 0 ? (
                <option disabled>Sin resultados</option>
              ) : (
                estudiantesFiltrados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.apellido}, {e.nombre} — {e.curso_nombre}
                  </option>
                ))
              )}
            </select>
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="btn btn-outline"
              onClick={() => setShowExportEstudianteModal(false)}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExportEstudiante}
              disabled={!exportEstudianteId || isExporting}
            >
              <FileDown size={16} />{" "}
              {isExporting ? "Descargando..." : "Descargar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Atrasos;
