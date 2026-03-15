import React, { useState, useEffect } from "react";
import api from "../api";
import { Plus, Edit2, Trash2, FileUp, Search, X } from "lucide-react";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { useDataCache } from "../context/DataCacheContext";

const Estudiantes = () => {
  const {
    estudiantes,
    cursos,
    fetchEstudiantes,
    fetchCursos,
    loadingEstudiantes,
  } = useDataCache();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCurso, setFilterCurso] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkCursoId, setBulkCursoId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const toast = useToast();
  const [formData, setFormData] = useState({
    rut: "",
    nombre: "",
    apellido: "",
    curso_id: "",
    sexo: "M",
  });

  useEffect(() => {
    fetchEstudiantes();
    fetchCursos();
  }, [fetchEstudiantes, fetchCursos]);

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        rut: student.rut,
        nombre: student.nombre,
        apellido: student.apellido,
        curso_id: student.curso_id,
        sexo: student.sexo || "M",
      });
    } else {
      setEditingStudent(null);
      setFormData({
        rut: "",
        nombre: "",
        apellido: "",
        curso_id: cursos[0]?.id || "",
        sexo: "M",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.put(`/estudiantes/${editingStudent.id}`, formData);
      } else {
        await api.post("/estudiantes", formData);
      }
      setShowModal(false);
      // Forzar recarga de la caché
      fetchEstudiantes(true);
      toast.success(
        editingStudent ? "Estudiante actualizado" : "Estudiante creado",
      );
    } catch (err) {
      toast.error("Error al guardar estudiante");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Está seguro de eliminar este estudiante?")) {
      try {
        await api.delete(`/estudiantes/${id}`);
        fetchEstudiantes(true);
        toast.success("Estudiante eliminado");
      } catch (err) {
        toast.error("Error al eliminar");
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileData = new FormData();
    fileData.append("file", file);

    try {
      await api.post("/estudiantes/upload", fileData);
      toast.success("Estudiantes importados con éxito");
      fetchEstudiantes(true);
      fetchCursos(true); // Podrían haberse creado nuevos cursos
    } catch (err) {
      toast.error("Error al subir archivo");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (
      selectedIds.length === filteredEstudiantes.length &&
      filteredEstudiantes.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEstudiantes.map((e) => e.id));
    }
  };

  const handleBulkChange = async () => {
    if (!bulkCursoId || selectedIds.length === 0) return;
    if (
      window.confirm(
        `¿Cambiar ${selectedIds.length} estudiantes al nuevo curso?`,
      )
    ) {
      try {
        await api.put('/estudiantes/bulk-update-curso', {
            estudiante_ids: selectedIds,
            curso_id: bulkCursoId
        });
        toast.success("Estudiantes movidos con éxito");
        setSelectedIds([]);
        setBulkCursoId("");
        fetchEstudiantes(true);
      } catch (err) {
        toast.error("Error al mover masivamente");
      }
    }
  };

  const filteredEstudiantes = estudiantes.filter((est) => {
    const matchesSearch = `${est.nombre} ${est.apellido} ${est.rut}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCurso = filterCurso
      ? String(est.curso_id) === String(filterCurso)
      : true;
    return matchesSearch && matchesCurso;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCurso]);

  const paginatedEstudiantes = filteredEstudiantes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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
        <h2 style={{ fontSize: "1.5rem" }}>Gestión de Estudiantes</h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          <label className="btn btn-outline" style={{ cursor: "pointer" }}>
            <FileUp size={18} />
            Importar Excel
            <input
              type="file"
              hidden
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
            />
          </label>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Nuevo Estudiante
          </button>
        </div>
      </header>

      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 200px",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: "#f1f5f9",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
            }}
          >
            <Search size={20} color="#64748b" />
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                width: "100%",
                outline: "none",
                fontSize: "1rem",
              }}
            />
          </div>
          <select
            className="btn btn-outline"
            value={filterCurso}
            onChange={(e) => setFilterCurso(e.target.value)}
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
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "1rem",
            alignItems: "center",
          }}
        >
          <select
            className="btn btn-outline"
            value={bulkCursoId}
            onChange={(e) => setBulkCursoId(e.target.value)}
          >
            <option value="">-- Mover seleccionados a curso --</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleBulkChange}
            disabled={selectedIds.length === 0 || !bulkCursoId}
          >
            Aplicar a ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loadingEstudiantes && estudiantes.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center" }}>Cargando estudiantes...</p>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        onChange={toggleSelectAll}
                        checked={
                          filteredEstudiantes.length > 0 &&
                          selectedIds.length === filteredEstudiantes.length
                        }
                      />
                    </th>
                    <th>ESTUDIANTE</th>
                    <th>RUT</th>
                    <th>CURSO</th>
                    <th style={{ textAlign: "right" }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEstudiantes.length === 0 ? (
                    <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                            No se encontraron estudiantes.
                        </td>
                    </tr>
                  ) : (
                    paginatedEstudiantes.map((est) => (
                        <tr key={est.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(est.id)}
                              onChange={() => toggleSelect(est.id)}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: "600" }}>
                              {est.apellido}, {est.nombre}
                            </div>
                          </td>
                          <td style={{ color: "#64748b" }}>{est.rut}</td>
                          <td>
                            <span
                              className="badge"
                              style={{ background: "#e0e7ff", color: "#3730a3" }}
                            >
                              {est.curso_nombre}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              onClick={() => handleOpenModal(est)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#1e40af",
                                marginRight: "0.5rem",
                                cursor: "pointer",
                              }}
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(est.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#b91c1c",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredEstudiantes.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h3>
                {editingStudent ? "Editar Estudiante" : "Nuevo Estudiante"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none" }}
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem" }}>
                  RUT
                </label>
                <input
                  required
                  className="btn btn-outline"
                  style={{ width: "100%" }}
                  value={formData.rut}
                  onChange={(e) =>
                    setFormData({ ...formData, rut: e.target.value })
                  }
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label style={{ display: "block", marginBottom: "0.25rem" }}>
                    Nombres
                  </label>
                  <input
                    required
                    className="btn btn-outline"
                    style={{ width: "100%" }}
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.25rem" }}>
                    Apellidos
                  </label>
                  <input
                    required
                    className="btn btn-outline"
                    style={{ width: "100%" }}
                    value={formData.apellido}
                    onChange={(e) =>
                      setFormData({ ...formData, apellido: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem" }}>
                  Curso
                </label>
                <select
                  className="btn btn-outline"
                  style={{ width: "100%" }}
                  value={formData.curso_id}
                  onChange={(e) =>
                    setFormData({ ...formData, curso_id: e.target.value })
                  }
                >
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: "1rem", justifyContent: "center" }}
              >
                {editingStudent ? "Actualizar" : "Crear"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estudiantes;
