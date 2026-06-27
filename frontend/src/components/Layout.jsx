import { useState, useEffect, useRef } from "react";
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
  admin: { label: "Admin", color: "#586a7d" },
  director: { label: "Director(a)", color: "#24364b" },
  inspector: { label: "Inspector(a)", color: "#55715d" },
};

const buildNavigation = ({ canAccess, isAdmin }) => {
  const sections = [
    {
      label: "General",
      items: canAccess("dashboard")
        ? [{ to: "/dashboard", icon: <LayoutDashboard size={16} />, label: "Panel" }]
        : [],
    },
    {
      label: "Operacion",
      items: [
        canAccess("asistencia") && { to: "/asistencia", icon: <ClipboardCheck size={16} />, label: "Asistencia" },
        canAccess("atrasos") && { to: "/atrasos", icon: <AlertTriangle size={16} />, label: "Atrasos" },
        canAccess("atrasos-internos") && { to: "/atrasos-internos", icon: <Coffee size={16} />, label: "Internos" },
        canAccess("salidas-anticipadas") && { to: "/salidas-anticipadas", icon: <Clock size={16} />, label: "Salidas" },
      ].filter(Boolean),
    },
    {
      label: "Academico",
      items: [
        canAccess("estudiantes") && { to: "/estudiantes", icon: <Users size={16} />, label: "Estudiantes" },
        canAccess("cursos") && { to: "/cursos", icon: <BookOpen size={16} />, label: "Cursos" },
        isAdmin && { to: "/usuarios", icon: <Shield size={16} />, label: "Usuarios" },
        isAdmin && { to: "/anuncios", icon: <Megaphone size={16} />, label: "Anuncios" },
      ].filter(Boolean),
    },
  ];

  return sections.filter((section) => section.items.length > 0);
};

const Layout = ({ children }) => {
  const { user, logout, canAccess } = useAuth();
  const badge = roleBadge[user?.rol] || { label: user?.rol, color: "#667485" };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [academicMenuOpen, setAcademicMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const navSections = buildNavigation({ canAccess, isAdmin: user?.rol === "admin" });
  const academicMenuRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (academicMenuRef.current && !academicMenuRef.current.contains(event.target)) {
        setAcademicMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setAcademicMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="app-shell">
      <header className="topbar topbar-shell">
        <div className="topbar-brand brand-lockup">
          <div className="brand-mark topbar-mark">
            <img src="/logoamj.png" alt="Logo AMJ" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          </div>
        </div>

        <nav className="topbar-nav" aria-label="Navegacion principal">
          {navSections.map((section) => (
            section.label === "Academico" ? (
              <div key={section.label} className="topbar-nav-group topbar-dropdown-group" ref={academicMenuRef}>
                <button
                  type="button"
                  className="topbar-dropdown-trigger"
                  onClick={() => setAcademicMenuOpen((current) => !current)}
                  aria-haspopup="menu"
                  aria-expanded={academicMenuOpen}
                >
                  <BookOpen size={16} />
                  <span>Académico</span>
                  <span className="topbar-dropdown-caret" aria-hidden="true">▾</span>
                </button>

                <div className={`topbar-dropdown-menu ${academicMenuOpen ? "open" : ""}`} role="menu" aria-label="Académico">
                  {section.items.map((item) => (
                    <MenuLink
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      compact
                      onClick={() => setAcademicMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div key={section.label} className="topbar-nav-group">
                <span className="topbar-nav-label">{section.label}</span>
                <div className="topbar-nav-links">
                  {section.items.map((item) => (
                    <MenuLink key={item.to} to={item.to} icon={item.icon} label={item.label} compact />
                  ))}
                </div>
              </div>
            )
          ))}
        </nav>

        <div className="topbar-actions">
          <div className="topbar-user-meta">
            <span className="topbar-user-name">{user?.nombre}</span>
            <span className="role-chip" style={{ backgroundColor: badge.color }}>
              {badge.label}
            </span>
          </div>

          <button onClick={() => setDarkMode(!darkMode)} className="topbar-icon-btn" aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button onClick={logout} className="topbar-logout-btn">
            <LogOut size={16} />
            <span>Salir</span>
          </button>

          <button className="topbar-mobile-toggle" onClick={() => setMobileMenuOpen((current) => !current)} aria-label="Abrir navegación móvil" aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className={`topbar-mobile-panel ${mobileMenuOpen ? "open" : ""}`}>
        {navSections.map((section) => (
          <div key={section.label} className="topbar-mobile-section">
            <div className="sidebar-section-label">{section.label}</div>
            <div className="topbar-mobile-links">
              {section.items.map((item) => (
                <MenuLink key={item.to} to={item.to} icon={item.icon} label={item.label} compact onClick={closeMenu} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={`sidebar-overlay ${mobileMenuOpen ? "open" : ""}`} onClick={closeMenu} />

      <main className="main-content" style={{ flex: 1 }}>
        <AnuncioBanner />
        {children}
      </main>
    </div>
  );
};

const MenuLink = ({ to, icon, label, onClick, compact = false }) => (
  <NavLink to={to} onClick={onClick} className={({ isActive }) => `${compact ? "topbar-link" : "menu-link"}${isActive ? " active" : ""}`}>
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default Layout;
