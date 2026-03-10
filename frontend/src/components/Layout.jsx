import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Users, ClipboardCheck, AlertTriangle, AppWindow, BookOpen } from 'lucide-react';

const Layout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: '#0f172a',
        color: 'white',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem' }}>
          <AppWindow size={28} color="#38bdf8" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Registro Asistencia</h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <MenuLink to="/" icon={<ClipboardCheck size={20} />} label="Asistencia" />
          <MenuLink to="/estudiantes" icon={<Users size={20} />} label="Estudiantes" />
          <MenuLink to="/cursos" icon={<BookOpen size={20} />} label="Cursos" />
          <MenuLink to="/atrasos" icon={<AlertTriangle size={20} />} label="Atrasos" />
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

const MenuLink = ({ to, icon, label }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      textDecoration: 'none',
      color: isActive ? 'white' : '#94a3b8',
      background: isActive ? '#1e293b' : 'transparent',
      transition: 'all 0.2s'
    })}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default Layout;
