import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Users,
  ClipboardCheck,
  AlertTriangle,
  AppWindow,
  BookOpen,
  LogOut,
  Shield,
  Menu,
  X,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const roleBadge = {
  admin: { label: "Admin", color: "#2563eb" },
  director: { label: "Director(a)", color: "#7c3aed" },
  inspector: { label: "Inspector(a)", color: "#059669" },
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const badge = roleBadge[user?.rol] || { label: user?.rol, color: "#64748b" };
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── TOPBAR MOBILE ── */}
      <div className="topbar">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={22} />
        </button>
        <AppWindow size={22} color="#38bdf8" />
        <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>
          Registro Asistencia
        </span>
      </div>

      {/* ── OVERLAY (click fuera cierra el menú) ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
      />

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo + botón cerrar (solo móvil) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <AppWindow size={26} color="#38bdf8" />
            <h1 style={{ fontSize: "1rem", fontWeight: "bold" }}>
              Registro Asistencia
            </h1>
          </div>
          <button
            className="hamburger-btn"
            onClick={closeSidebar}
            style={{ display: "none" }}
            id="sidebar-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            flex: 1,
          }}
        >
          <MenuLink
            to="/dashboard"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            onClick={closeSidebar}
          />
          <MenuLink
            to="/asistencia"
            icon={<ClipboardCheck size={20} />}
            label="Asistencia"
            onClick={closeSidebar}
          />
          <MenuLink
            to="/atrasos"
            icon={<AlertTriangle size={20} />}
            label="Atrasos"
            onClick={closeSidebar}
          />
          <MenuLink
            to="/salidas-anticipadas"
            icon={<Clock size={20} />}
            label="Salidas Anticipadas"
            onClick={closeSidebar}
          />
          <MenuLink
            to="/estudiantes"
            icon={<Users size={20} />}
            label="Estudiantes"
            onClick={closeSidebar}
          />
          {(user?.rol === "admin" || user?.rol === "director") && (
            <MenuLink
              to="/cursos"
              icon={<BookOpen size={20} />}
              label="Cursos"
              onClick={closeSidebar}
            />
          )}
          {user?.rol === "admin" && (
            <MenuLink
              to="/usuarios"
              icon={<Shield size={20} />}
              label="Usuarios"
              onClick={closeSidebar}
            />
          )}
        </nav>

        {/* Usuario + Logout */}
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "1rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "white",
                margin: 0,
              }}
            >
              {user?.nombre}
            </p>
            <span
              style={{
                display: "inline-block",
                background: badge.color,
                color: "white",
                padding: "0.1rem 0.5rem",
                borderRadius: "9999px",
                fontSize: "0.7rem",
                marginTop: "0.25rem",
              }}
            >
              {badge.label}
            </span>
          </div>
          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              width: "100%",
              background: "transparent",
              border: "1px solid #334155",
              color: "#94a3b8",
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.875rem",
              transition: "all 0.2s",
            }}
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content" style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
};

const MenuLink = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    style={({ isActive }) => ({
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "0.75rem 1rem",
      borderRadius: "8px",
      textDecoration: "none",
      color: isActive ? "white" : "#94a3b8",
      background: isActive ? "#1e293b" : "transparent",
      transition: "all 0.2s",
      fontWeight: isActive ? "600" : "400",
    })}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default Layout;
