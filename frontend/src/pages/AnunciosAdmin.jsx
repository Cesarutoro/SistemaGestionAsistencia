import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Megaphone, AlertTriangle, Wrench } from "lucide-react";
import api from "../api";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";

const tipoLabels = {
  info: { label: "Informativo", color: "#1e3a8a", bg: "#eff6ff" },
  warning: { label: "Advertencia", color: "#92400e", bg: "#fef3c7" },
  maintenance: { label: "Mantención", color: "#991b1b", bg: "#fef2f2" },
};

const AnunciosAdmin = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const toast = useToast();
  const [formData, setFormData] = useState({
    titulo: "",
    mensaje: "",
    tipo: "info",
    activo_desde: new Date().toISOString().split("T")[0],
    activo_hasta: "",
  });

  const fetchAnuncios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/anuncios/todos");
      setAnuncios(res.data || []);
    } catch {
      setAnuncios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnuncios();
  }, [fetchAnuncios]);

  const openCreate = () => {
    setEditing(null);
    setFormData({
      titulo: "",
      mensaje: "",
      tipo: "info",
      activo_desde: new Date().toISOString().split("T")[0],
      activo_hasta: "",
    });
    setShowModal(true);
  };

  const openEdit = (anuncio) => {
    setEditing(anuncio);
    setFormData({
      titulo: anuncio.titulo,
      mensaje: anuncio.mensaje,
      tipo: anuncio.tipo,
      activo_desde: anuncio.activo_desde?.split("T")[0] || "",
      activo_hasta: anuncio.activo_hasta?.split("T")[0] || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/anuncios/${editing.id}`, formData);
        toast.success("Anuncio actualizado");
      } else {
        await api.post("/anuncios", formData);
        toast.success("Anuncio creado");
      }
      setShowModal(false);
      fetchAnuncios();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este anuncio?")) return;
    try {
      await api.delete(`/anuncios/${id}`);
      toast.success("Anuncio eliminado");
      fetchAnuncios();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const paginados = anuncios.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.5rem" }}>Anuncios del Sistema</h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Crea anuncios que aparecerán como banner para todos los usuarios
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Nuevo Anuncio
        </button>
      </header>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            Cargando anuncios...
          </p>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Título</th>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                        No hay anuncios. Crea el primero.
                      </td>
                    </tr>
                  ) : (
                    paginados.map((a) => {
                      const tc = tipoLabels[a.tipo] || tipoLabels.info;
                      return (
                        <tr key={a.id}>
                          <td>
                            <span
                              style={{
                                display: "inline-flex", alignItems: "center", gap: "0.35rem",
                                background: tc.bg, color: tc.color, padding: "0.25rem 0.6rem",
                                borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600,
                              }}
                            >
                              {a.tipo === "maintenance" ? <Wrench size={13} /> : a.tipo === "warning" ? <AlertTriangle size={13} /> : <Megaphone size={13} />}
                              {tc.label}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{a.titulo}</td>
                          <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                            {a.activo_desde?.split("T")[0] || "-"}
                          </td>
                          <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                            {a.activo_hasta?.split("T")[0] || "Sin fecha"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              className="btn btn-outline"
                              style={{ padding: "0.4rem", marginRight: "0.5rem" }}
                              onClick={() => openEdit(a)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{ padding: "0.4rem", borderColor: "#fee2e2", color: "#ef4444" }}
                              onClick={() => handleDelete(a.id)}
                            >
                              <Trash2 size={15} />
                            </button>
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
              totalItems={anuncios.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "550px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h3>{editing ? "Editar Anuncio" : "Nuevo Anuncio"}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Título</label>
                <input
                  className="input"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Mantención programada"
                />
              </div>
              <div>
                <label className="label">Mensaje</label>
                <textarea
                  className="input"
                  required
                  rows={3}
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  placeholder="Describe el anuncio..."
                  style={{ resize: "vertical" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}>
                    <option value="info">Informativo</option>
                    <option value="warning">Advertencia</option>
                    <option value="maintenance">Mantención</option>
                  </select>
                </div>
                <div>
                  <label className="label">Visible desde</label>
                  <input type="date" className="input" value={formData.activo_desde} onChange={(e) => setFormData({ ...formData, activo_desde: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Visible hasta (opcional)</label>
                <input type="date" className="input" value={formData.activo_hasta} onChange={(e) => setFormData({ ...formData, activo_hasta: e.target.value })} />
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem", display: "block" }}>
                  Si no pones fecha, el anuncio será visible indefinidamente
                </span>
              </div>
              <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", marginTop: "0.5rem" }}>
                {editing ? "Actualizar" : "Crear Anuncio"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnunciosAdmin;
