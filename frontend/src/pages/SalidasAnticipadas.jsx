import React, { useMemo, useState, useEffect } from "react";
import { AlertCircle, Plus, Edit, Trash2, X } from "lucide-react";
import api, { apiSalidasAnticipadas } from "../api";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { canManageModule } from "../utils/modulePermissions";
import { TableSkeleton } from "../components/LoadingSkeleton";

const getTodayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().split("T")[0];
};

const stripTimeToHHMM = (timeValue) => {
  if (!timeValue) return "";
  return String(timeValue).slice(0, 5);
};

const SalidasAnticipadas = () => {
  const [salidasPorCurso, setSalidasPorCurso] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [fecha, setFecha] = useState(getTodayLocal());
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [errores, setErrores] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const canEdit = canManageModule(user, "salidas-anticipadas");

  const [formData, setFormData] = useState({
    estudiante_id: "",
    fecha: getTodayLocal(),
    hora_salida: "",
    motivo: "",
    es_medico: true,
    observaciones: "",
  });

  const estudiantesDelCurso = useMemo(() => {
    if (!cursoSeleccionado) return [];
    return estudiantes.filter(
      (est) => String(est.curso_id) === String(cursoSeleccionado),
    );
  }, [estudiantes, cursoSeleccionado]);

  useEffect(() => {
    if (authLoading || !user) return;
    const cargarInicial = async () => {
      try {
        const [cursosRes, estudiantesRes] = await Promise.all([
          api.get("/cursos"),
          api.get("/estudiantes"),
        ]);

        setCursos(cursosRes.data);
        setEstudiantes(estudiantesRes.data);

        if (cursosRes.data.length > 0) {
          setCursoSeleccionado(String(cursosRes.data[0].id));
        }
      } catch (error) {
        toast.error("No fue posible cargar cursos/estudiantes.");
      }
    };

    cargarInicial();
  }, [authLoading, user]);

  useEffect(() => {
    if (!cursoSeleccionado) return;

    const cargarSalidas = async () => {
      setCargando(true);
      try {
        const datos = await apiSalidasAnticipadas.obtenerPorCurso(
          cursoSeleccionado,
          fecha,
        );
        setSalidasPorCurso(datos);
      } catch (error) {
        toast.error(`Error al cargar salidas: ${error.message}`);
      } finally {
        setCargando(false);
      }
    };

    cargarSalidas();
  }, [cursoSeleccionado, fecha]);

  const showSuccess = (text) => toast.success(text);
  const showError = (text) => toast.error(text);

  const resetForm = () => {
    const firstStudentId = estudiantesDelCurso[0]?.id
      ? String(estudiantesDelCurso[0].id)
      : "";
    setFormData({
      estudiante_id: firstStudentId,
      fecha,
      hora_salida: "",
      motivo: "",
      es_medico: true,
      observaciones: "",
    });
    setErrores([]);
  };

  const openCreateModal = () => {
    setEditando(null);
    resetForm();
    setMostrarForm(true);
  };

  const openEditModal = (salida) => {
    setEditando(salida);
    setErrores([]);

    setFormData({
      estudiante_id: String(salida.estudiante_id),
      fecha: salida.fecha,
      hora_salida: stripTimeToHHMM(salida.hora_salida),
      motivo: salida.motivo || "",
      es_medico: salida.es_medico === 1,
      observaciones: salida.observaciones || "",
    });

    setMostrarForm(true);
  };

  const closeModal = () => {
    setMostrarForm(false);
    setEditando(null);
    setErrores([]);
  };

  const cargarSalidas = async () => {
    if (!cursoSeleccionado) return;
    setCargando(true);
    try {
      const datos = await apiSalidasAnticipadas.obtenerPorCurso(
        cursoSeleccionado,
        fecha,
      );
      setSalidasPorCurso(datos);
    } catch (error) {
      showError(`Error al cargar salidas: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores([]);
    setGuardando(true);

    const payload = {
      ...formData,
      estudiante_id: Number(formData.estudiante_id),
      es_medico: Boolean(formData.es_medico),
    };

    try {
      if (editando) {
        await apiSalidasAnticipadas.actualizar(editando.id, payload);
        showSuccess("Salida anticipada actualizada correctamente.");
      } else {
        await apiSalidasAnticipadas.crear(payload);
        showSuccess("Salida anticipada registrada correctamente.");
      }

      closeModal();
      await cargarSalidas();
    } catch (error) {
      if (error.errores?.length) {
        setErrores(error.errores);
      } else {
        showError(
          error.message || "No fue posible guardar la salida anticipada.",
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    const confirmacion = window.confirm("¿Eliminar esta salida anticipada?");
    if (!confirmacion) return;

    try {
      await apiSalidasAnticipadas.eliminar(id);
      showSuccess("Salida anticipada eliminada correctamente.");
      await cargarSalidas();
    } catch (error) {
      showError(
        error.message || "No fue posible eliminar la salida anticipada.",
      );
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [cursoSeleccionado, fecha]);

  const paginatedSalidas = salidasPorCurso.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>
          Salidas Anticipadas
        </h2>
        {!canEdit && (
          <div className="badge" style={{ background: "#fef3c7", color: "#92400e", marginBottom: "0.75rem" }}>
            Solo lectura
          </div>
        )}

        <div className="card" style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.75rem",
              alignItems: "end",
            }}
          >
            <div>
              <label className="label">Curso</label>
              <select
                className="input"
                value={cursoSeleccionado}
                onChange={(e) => setCursoSeleccionado(e.target.value)}
              >
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Fecha</label>
              <input
                className="input"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            {canEdit && (
              <button className="btn btn-primary" onClick={openCreateModal}>
                <Plus size={16} />
                Nueva Salida
              </button>
            )}
          </div>
        </div>
      </header>

      {errores.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: "1rem",
            borderColor: "#fecaca",
            background: "#fef2f2",
            color: "#991b1b",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>
            Corrige estos campos:
          </div>
          {errores.map((error, index) => (
            <div key={index}>• {error}</div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {cargando ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <div className="table-container" style={{ border: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th className="col-optional">RUT</th>
                  <th>Hora</th>
                  <th>Motivo</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {salidasPorCurso.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        color: "#94a3b8",
                        padding: "2rem",
                      }}
                    >
                      No hay salidas anticipadas registradas para esta fecha.
                    </td>
                  </tr>
                ) : (
                  paginatedSalidas.map((salida) => (
                    <tr key={salida.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {salida.apellido}, {salida.nombre}
                        </div>
                      </td>
                      <td className="col-optional" style={{ color: "#64748b" }}>
                        {salida.rut}
                      </td>
                      <td>{stripTimeToHHMM(salida.hora_salida)}</td>
                      <td>{salida.motivo}</td>
                      <td>
                        <span
                          className={
                            salida.es_medico === 1
                              ? "badge badge-danger"
                              : "badge badge-warning"
                          }
                        >
                          {salida.es_medico === 1 ? "Médico" : "General"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {canEdit ? (
                          <>
                            <button
                              className="btn btn-outline"
                              style={{
                                marginRight: "0.5rem",
                                padding: "0.35rem 0.55rem",
                              }}
                              onClick={() => openEditModal(salida)}
                              title="Editar"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "0.35rem 0.55rem" }}
                              onClick={() => handleEliminar(salida.id)}
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                            Sin cambios
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalItems={salidasPorCurso.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {mostrarForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3>
                {editando
                  ? "Editar Salida Anticipada"
                  : "Nueva Salida Anticipada"}
              </h3>
              <button
                onClick={closeModal}
                style={{ background: "none", border: "none" }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "grid", gap: "0.9rem" }}
            >
              <div>
                <label className="label">Estudiante</label>
                <select
                  className="input"
                  value={formData.estudiante_id}
                  onChange={(e) =>
                    setFormData({ ...formData, estudiante_id: e.target.value })
                  }
                  required
                >
                  <option value="">Selecciona estudiante...</option>
                  {estudiantesDelCurso.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.apellido}, {est.nombre} ({est.rut})
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label className="label">Fecha</label>
                  <input
                    className="input"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Hora salida</label>
                  <input
                    className="input"
                    type="time"
                    value={formData.hora_salida}
                    onChange={(e) =>
                      setFormData({ ...formData, hora_salida: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Motivo</label>
                <input
                  className="input"
                  type="text"
                  value={formData.motivo}
                  placeholder="Ej: Cita médica"
                  onChange={(e) =>
                    setFormData({ ...formData, motivo: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label
                  className="label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.es_medico}
                    onChange={(e) =>
                      setFormData({ ...formData, es_medico: e.target.checked })
                    }
                  />
                  Motivo médico
                </label>
              </div>

              <div>
                <label className="label">Observaciones</label>
                <textarea
                  className="input"
                  value={formData.observaciones}
                  placeholder="Notas adicionales"
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  style={{ minHeight: "90px", resize: "vertical" }}
                />
              </div>

              <div
                style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Cancelar
                </button>
                {canEdit && (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={guardando}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    {guardando
                      ? "Guardando..."
                      : editando
                        ? "Actualizar"
                        : "Registrar"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalidasAnticipadas;
