import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Users,
  ClipboardCheck,
  AlertTriangle,
  BookOpen,
  LogOut,
  Shield,
  Menu,
  X,
  Clock,
  Coffee,
  LayoutDashboard,
  Moon,
  Sun,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AnuncioBanner from "./AnuncioBanner";

const roleBadge = {
  admin: { label: "Admin", color: "#475569" },
  director: { label: "Director(a)", color: "#1e3a8a" },
  inspector: { label: "Inspector(a)", color: "#0f766e" },
};

const Layout = ({ children }) => {
  const { user, logout, canAccess } = useAuth();
  const badge = roleBadge[user?.rol] || { label: user?.rol, color: "#64748b" };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      <div className="topbar" style={{ backgroundColor: "#1e3a8a" }}>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={22} />
        </button>
        <div
          style={{
            width: "26px", height: "26px", borderRadius: "6px", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.35)", flexShrink: 0, padding: "2px",
          }}
        >
          <img src="/logoamj.png" alt="Logo AMJ" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>
        <span style={{ fontWeight: "700", fontSize: "1rem", color: "white" }}>
          Portal Asistencia
        </span>
      </div>

      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={closeSidebar} />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} style={{ background: "#0f172a", borderRight: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", overflow: "hidden", border: "1px solid #334155", flexShrink: 0, padding: "3px" }}>
              <img src="/logoamj.png" alt="Logo AMJ" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
            </div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: "800", color: "white", letterSpacing: "-0.025em" }}>
              Portal Institucional
            </h1>
          </div>
          <button className="hamburger-btn" onClick={closeSidebar} style={{ display: "none" }} id="sidebar-close-btn">
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          {canAccess('dashboard') && (
            <MenuLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Panel General" onClick={closeSidebar} />
          )}
          <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '0.75rem 0' }} />
          {canAccess('asistencia') && (
            <MenuLink to="/asistencia" icon={<ClipboardCheck size={18} />} label="Registro Diario" onClick={closeSidebar} />
          )}
          {canAccess('atrasos') && (
            <MenuLink to="/atrasos" icon={<AlertTriangle size={18} />} label="Control Atrasos" onClick={closeSidebar} />
          )}
          {canAccess('atrasos-internos') && (
            <MenuLink to="/atrasos-internos" icon={<Coffee size={18} />} label="Atrasos Internos" onClick={closeSidebar} />
          )}
          {canAccess('salidas-anticipadas') && (
            <MenuLink to="/salidas-anticipadas" icon={<Clock size={18} />} label="Salidas Autorizadas" onClick={closeSidebar} />
          )}
          <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '0.75rem 0' }} />
          {canAccess('estudiantes') && (
            <MenuLink to="/estudiantes" icon={<Users size={18} />} label="Base Estudiantes" onClick={closeSidebar} />
          )}
          {canAccess('cursos') && (
            <MenuLink to="/cursos" icon={<BookOpen size={18} />} label="Cursos y Niveles" onClick={closeSidebar} />
          )}
          {user?.rol === "admin" && (
            <>
              <MenuLink to="/usuarios" icon={<Shield size={18} />} label="Config. Usuarios" onClick={closeSidebar} />
              <MenuLink to="/anuncios" icon={<Megaphone size={18} />} label="Anuncios del Sistema" onClick={closeSidebar} />
            </>
          )}
        </nav>

        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "1.25rem", marginTop: "1rem" }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem", width: "100%",
              background: "transparent", border: "1px solid #1e293b", color: "#94a3b8",
              padding: "0.6rem 0.75rem", borderRadius: "8px", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.75rem",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1e293b'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? "Modo Claro" : "Modo Oscuro"}
          </button>

          <div style={{ marginBottom: "1rem", padding: '0 0.5rem' }}>
            <p style={{ fontSize: "0.85rem", fontWeight: "700", color: "white", margin: 0 }}>
              {user?.nombre}
            </p>
            <span style={{ display: "inline-block", backgroundColor: badge.color, color: "white", padding: "0.15rem 0.6rem", borderRadius: "6px", fontSize: "0.65rem", fontWeight: "700", marginTop: "0.4rem", textTransform: 'uppercase', letterSpacing: '0.025em' }}>
              {badge.label}
            </span>
          </div>

          <button
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem", width: "100%",
              background: "transparent", border: "1px solid #1e293b", color: "#94a3b8",
              padding: "0.6rem 0.75rem", borderRadius: "8px", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: "600", transition: "all 0.2s",
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <LogOut size={16} />
            Cerrar Aplicación
          </button>
        </div>
      </aside>

      <main className="main-content" style={{ flex: 1, backgroundColor: "var(--bg-main)" }}>
        <AnuncioBanner />
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
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.85rem 1rem", borderRadius: "8px", textDecoration: "none",
      color: isActive ? "white" : "#94a3b8",
      background: isActive ? "#1e3a8a" : "transparent",
      transition: "all 0.15s", fontWeight: isActive ? "600" : "500", fontSize: "0.9rem",
    })}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default Layout;
