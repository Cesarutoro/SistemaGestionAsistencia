import React, { useMemo, useState, useEffect } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import api, { apiAtrasosInternos } from "../api";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { canManageModule } from "../utils/modulePermissions";
import { TableSkeleton } from "../components/LoadingSkeleton";

const MINUTOS_OPCIONES = [5, 10, 15, 20, 30, 45, 60, 90, 120];

const TIPO_LABELS = {
  recreo: "Recreo",
  almuerzo: "Almuerzo",
};

const getTodayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().split("T")[0];
};

const AtrasosInternos = () => {
  const [atrasosPorCurso, setAtrasosPorCurso] = useState([]);
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
  const canEdit = canManageModule(user, "atrasos-internos");

  const [formData, setFormData] = useState({
    estudiante_id: "",
    fecha: getTodayLocal(),
    tipo: "recreo",
    minutos_atraso: 5,
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
      } catch {
        toast.error("No fue posible cargar cursos/estudiantes.");
      }
    };

    cargarInicial();
  }, [authLoading, user]);

  useEffect(() => {
    if (!cursoSeleccionado) return;

    const cargarAtrasos = async () => {
      setCargando(true);
      try {
        const datos = await apiAtrasosInternos.obtenerPorCurso(
          cursoSeleccionado,
          fecha,
        );
        setAtrasosPorCurso(datos);
      } catch (error) {
        toast.error(`Error al cargar atrasos: ${error.message}`);
      } finally {
        setCargando(false);
      }
    };

    cargarAtrasos();
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
      tipo: "recreo",
      minutos_atraso: 5,
      observaciones: "",
    });
    setErrores([]);
  };

  const openCreateModal = () => {
    setEditando(null);
    resetForm();
    setMostrarForm(true);
  };

  const openEditModal = (atraso) => {
    setEditando(atraso);
    setErrores([]);

    setFormData({
      estudiante_id: String(atraso.estudiante_id),
      fecha: atraso.fecha,
      tipo: atraso.tipo,
      minutos_atraso: atraso.minutos_atraso,
      observaciones: atraso.observaciones || "",
    });

    setMostrarForm(true);
  };

  const closeModal = () => {
    setMostrarForm(false);
    setEditando(null);
    setErrores([]);
  };

  const cargarAtrasos = async () => {
    if (!cursoSeleccionado) return;
    setCargando(true);
    try {
      const datos = await apiAtrasosInternos.obtenerPorCurso(
        cursoSeleccionado,
        fecha,
      );
      setAtrasosPorCurso(datos);
    } catch (error) {
      showError(`Error al cargar atrasos: ${error.message}`);
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
      minutos_atraso: Number(formData.minutos_atraso),
    };

    try {
      if (editando) {
        await apiAtrasosInternos.actualizar(editando.id, {
          tipo: payload.tipo,
          minutos_atraso: payload.minutos_atraso,
          observaciones: payload.observaciones,
        });
        showSuccess("Atraso interno actualizado correctamente.");
      } else {
        await apiAtrasosInternos.crear(payload);
        showSuccess("Atraso interno registrado correctamente.");
      }

      closeModal();
      await cargarAtrasos();
    } catch (error) {
      if (error.errores?.length) {
        setErrores(error.errores);
      } else {
        showError(
          error.message || "No fue posible guardar el atraso interno.",
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    const confirmacion = window.confirm("¿Eliminar este atraso interno?");
    if (!confirmacion) return;

    try {
      await apiAtrasosInternos.eliminar(id);
      showSuccess("Atraso interno eliminado correctamente.");
      await cargarAtrasos();
    } catch (error) {
      showError(error.message || "No fue posible eliminar el atraso interno.");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [cursoSeleccionado, fecha]);

  const paginatedAtrasos = atrasosPorCurso.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totalMinutos = atrasosPorCurso.reduce(
    (sum, a) => sum + (a.minutos_atraso || 0),
    0,
  );

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "0.35rem" }}>
          Atrasos Internos
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1rem" }}>
          Registro de atrasos en recreo y almuerzo
        </p>
        {!canEdit && (
          <div
            className="badge"
            style={{
              background: "#fef3c7",
              color: "#92400e",
              marginBottom: "0.75rem",
            }}
          >
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
                Nuevo Atraso
              </button>
            )}
          </div>
        </div>

        {atrasosPorCurso.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <span className="badge badge-warning">
              {atrasosPorCurso.length} registro
              {atrasosPorCurso.length !== 1 ? "s" : ""}
            </span>
            <span className="badge" style={{ background: "#e0e7ff", color: "#3730a3" }}>
              {totalMinutos} min total
            </span>
          </div>
        )}
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
                  <th>Tipo</th>
                  <th>Minutos</th>
                  <th className="col-optional">Observaciones</th>
                  <th style={{ textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {atrasosPorCurso.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        color: "#94a3b8",
                        padding: "2rem",
                      }}
                    >
                      No hay atrasos internos registrados para esta fecha.
                    </td>
                  </tr>
                ) : (
                  paginatedAtrasos.map((atraso) => (
                    <tr key={atraso.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {atraso.apellido}, {atraso.nombre}
                        </div>
                      </td>
                      <td className="col-optional" style={{ color: "#64748b" }}>
                        {atraso.rut}
                      </td>
                      <td>
                        <span
                          className={
                            atraso.tipo === "recreo"
                              ? "badge badge-warning"
                              : "badge badge-danger"
                          }
                        >
                          {TIPO_LABELS[atraso.tipo] || atraso.tipo}
                        </span>
                      </td>
                      <td>{atraso.minutos_atraso} min</td>
                      <td
                        className="col-optional"
                        style={{ color: "#64748b", maxWidth: "200px" }}
                      >
                        {atraso.observaciones || "—"}
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
                              onClick={() => openEditModal(atraso)}
                              title="Editar"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "0.35rem 0.55rem" }}
                              onClick={() => handleEliminar(atraso.id)}
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
          totalItems={atrasosPorCurso.length}
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
                {editando ? "Editar Atraso Interno" : "Nuevo Atraso Interno"}
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
              {!editando && (
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
              )}

              {!editando && (
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
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label className="label">Tipo de atraso</label>
                  <select
                    className="input"
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value })
                    }
                    required
                  >
                    <option value="recreo">Recreo</option>
                    <option value="almuerzo">Almuerzo</option>
                  </select>
                </div>

                <div>
                  <label className="label">Tiempo de atraso</label>
                  <select
                    className="input"
                    value={formData.minutos_atraso}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minutos_atraso: Number(e.target.value),
                      })
                    }
                    required
                  >
                    {MINUTOS_OPCIONES.map((min) => (
                      <option key={min} value={min}>
                        {min} minutos
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Observaciones</label>
                <textarea
                  className="input"
                  value={formData.observaciones}
                  placeholder="Notas adicionales (opcional)"
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

export default AtrasosInternos;
