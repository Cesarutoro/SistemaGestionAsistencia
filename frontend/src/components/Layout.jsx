import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, ClipboardCheck, AlertTriangle, AppWindow, BookOpen, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleBadge = {
    admin: { label: 'Admin', color: '#2563eb' },
    director: { label: 'Director', color: '#7c3aed' },
    inspector: { label: 'Inspector', color: '#059669' },
};

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const badge = roleBadge[user?.rol] || { label: user?.rol, color: '#64748b' };

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
                gap: '2rem',
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: 0,
                overflowY: 'auto'
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem' }}>
                    <AppWindow size={28} color="#38bdf8" />
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Registro Asistencia</h1>
                </div>

                {/* Nav */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <MenuLink to="/asistencia" icon={<ClipboardCheck size={20} />} label="Asistencia" />
                    <MenuLink to="/atrasos" icon={<AlertTriangle size={20} />} label="Atrasos" />
                    <MenuLink to="/estudiantes" icon={<Users size={20} />} label="Estudiantes" />
                    {/* Solo admin puede ver cursos y usuarios */}
                    {(user?.rol === 'admin' || user?.rol === 'director') && (
                        <MenuLink to="/cursos" icon={<BookOpen size={20} />} label="Cursos" />
                    )}
                    {user?.rol === 'admin' && (
                        <MenuLink to="/usuarios" icon={<Shield size={20} />} label="Usuarios" />
                    )}
                </nav>

                {/* Usuario + Logout */}
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white', margin: 0 }}>
                            {user?.nombre}
                        </p>
                        <span style={{
                            display: 'inline-block',
                            background: badge.color,
                            color: 'white',
                            padding: '0.1rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            marginTop: '0.25rem'
                        }}>
                            {badge.label}
                        </span>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            width: '100%', background: 'transparent', border: '1px solid #334155',
                            color: '#94a3b8', padding: '0.5rem 0.75rem', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s'
                        }}
                    >
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', marginLeft: '260px', maxWidth: 'calc(100% - 260px)' }}>
                {children}
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
