import React, { useState, useEffect } from "react";
import api from "../api";
import { UserPlus, Mail, Trash2, Edit2, X } from "lucide-react";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { TableSkeleton } from "../components/LoadingSkeleton";
import {
  MODULES,
  getDefaultPermissionEntriesForRole,
  normalizePermissionEntries,
} from "../utils/modulePermissions";

const roleLabels = {
  admin: "Administrador",
  director: "Director(a)",
  inspector: "Inspector(a)",
};

const permissionLabels = Object.fromEntries(
  MODULES.map((module) => [module.clave, module.nombre]),
);

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "inspector",
    activo: 1,
    permisos: getDefaultPermissionEntriesForRole("inspector"),
  });
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const toast = useToast();

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await api.get("/usuarios");
      setUsuarios(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching usuarios", err);
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        password: "", // No mostrar el hash de contraseña
        rol: user.rol,
        activo: user.activo,
        permisos: normalizePermissionEntries(user.permisos).length
          ? normalizePermissionEntries(user.permisos)
          : getDefaultPermissionEntriesForRole(user.rol),
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: "",
        email: "",
        password: "",
        rol: "inspector",
        activo: 1,
        permisos: getDefaultPermissionEntriesForRole("inspector"),
      });
    }
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingUser) {
        await api.put(`/usuarios/${editingUser.id}`, formData);
      } else {
        await api.post("/usuarios", formData);
      }
      setShowModal(false);
      fetchUsuarios();
      toast.success(editingUser ? "Usuario actualizado" : "Usuario creado");
    } catch (err) {
      setError(err.response?.data?.error || "Ocurrió un error");
    }
  };

  const handleRoleChange = (role) => {
    setFormData((current) => ({
      ...current,
      rol: role,
      permisos: getDefaultPermissionEntriesForRole(role),
    }));
  };

  const handleTogglePermission = (permission) => {
    setFormData((current) => {
      const permisos = current.permisos || [];
      return {
        ...current,
        permisos: permisos.some((item) => item.clave === permission)
          ? permisos.filter((item) => item.clave !== permission)
          : [...permisos, { clave: permission, readOnly: false }],
      };
    });
  };

  const handleToggleReadOnly = (permission) => {
    setFormData((current) => ({
      ...current,
      permisos: (current.permisos || []).map((item) => (
        item.clave === permission
          ? { ...item, readOnly: !item.readOnly }
          : item
      )),
    }));
  };

  const permissionState = (permission) => {
    const entry = (formData.permisos || []).find((item) => item.clave === permission);
    return {
      selected: Boolean(entry),
      readOnly: Boolean(entry?.readOnly),
    };
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?"))
      return;
    try {
      await api.delete(`/usuarios/${id}`);
      fetchUsuarios();
      toast.success("Usuario eliminado");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al eliminar");
    }
  };

  const paginatedUsuarios = usuarios.slice(
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
        <div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
            Gestión de Usuarios
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            Administra quiénes tienen acceso al sistema.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </header>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Permisos</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsuarios.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: "600" }}>{user.nombre}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        ID: {user.id}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Mail size={14} color="#94a3b8" />
                        {user.email}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          background:
                            user.rol === "admin"
                              ? "#dcfce7"
                              : user.rol === "director"
                                ? "#f3e8ff"
                                : "#f1f5f9",
                          color:
                            user.rol === "admin"
                              ? "#166534"
                              : user.rol === "director"
                                ? "#6b21a8"
                                : "#475569",
                          padding: "0.15rem 0.6rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                        }}
                      >
                        {roleLabels[user.rol] || user.rol}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                        {(user.permisos || []).map((permiso) => (
                          <span
                            key={permiso.clave}
                            className="badge"
                            style={{
                              background: permiso.readOnly ? "#fef3c7" : "#e2e8f0",
                              color: permiso.readOnly ? "#92400e" : "#334155",
                              fontSize: "0.72rem",
                            }}
                            title={permiso.clave}
                          >
                            {permissionLabels[permiso.clave] || permiso.clave}
                            {permiso.readOnly ? " · Solo lectura" : ""}
                          </span>
                        ))}
                        {(!user.permisos || user.permisos.length === 0) && (
                          <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Sin permisos</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${user.activo ? "badge-success" : "badge-danger"}`}
                      >
                        {user.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="btn btn-outline"
                          style={{ padding: "0.4rem" }}
                          onClick={() => handleOpenModal(user)}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{
                            padding: "0.4rem",
                            borderColor: "#fee2e2",
                            color: "#ef4444",
                          }}
                          onClick={() => handleDelete(user.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={usuarios.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "720px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {editingUser ? "Editar Usuario" : "Crear Usuario"}
              </h3>
              <button
                className="btn btn-outline"
                style={{ border: "none", padding: "0.5rem" }}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div>
                  <label className="label">Nombre Completo</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    Contraseña{" "}
                    {editingUser && "(dejar en blanco para no cambiar)"}
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingUser}
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
                    <label className="label">Rol</label>
                    <select
                      className="input"
                      value={formData.rol}
                      onChange={(e) => handleRoleChange(e.target.value)}
                    >
                      <option value="inspector">Inspector(a)</option>
                      <option value="director">Director(a)</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select
                      className="input"
                      value={formData.activo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          activo: parseInt(e.target.value),
                        })
                      }
                    >
                      <option value="1">Activo</option>
                      <option value="0">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Permisos de módulos</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      background: "#f8fafc",
                    }}
                  >
                    {MODULES.map((module) => (
                      <div
                        key={module.clave}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.45rem",
                          padding: "0.75rem",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          background: "#ffffff",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            fontSize: "0.9rem",
                            color: "#0f172a",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={permissionState(module.clave).selected}
                            onChange={() => handleTogglePermission(module.clave)}
                          />
                          <span>{module.nombre}</span>
                        </label>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.8rem",
                            color: "#475569",
                            marginLeft: "1.45rem",
                            cursor: permissionState(module.clave).selected ? "pointer" : "not-allowed",
                            opacity: permissionState(module.clave).selected ? 1 : 0.6,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={permissionState(module.clave).selected && permissionState(module.clave).readOnly}
                            disabled={!permissionState(module.clave).selected}
                            onChange={() => handleToggleReadOnly(module.clave)}
                          />
                          <span>Solo lectura</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                    Marca un módulo para habilitarlo. Por defecto queda editable; si activas "Solo lectura", podrá verlo pero no cambiar datos.
                  </p>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: "1rem",
                    color: "#ef4444",
                    fontSize: "0.875rem",
                    background: "#fef2f2",
                    padding: "0.5rem",
                    borderRadius: "4px",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
