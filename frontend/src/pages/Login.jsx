import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f1f5f9', // Gris claro neutro
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '3rem',
                width: '100%',
                maxWidth: '440px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                {/* Logo / Título */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        background: 'transparent',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                        overflow: 'hidden',
                        padding: '4px'
                    }}>
                        <img
                            src="/logoamj.png"
                            alt="Logo AMJ"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', margin: 0, letterSpacing: '-0.025em' }}>
                        Portal Institucional
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>
                        Sistema de Gestión de Asistencia
                    </p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                            Correo Institucional
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="usuario@colegio.cl"
                                required
                                style={{
                                    width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    border: '1px solid #cbd5e1', borderRadius: '8px',
                                    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                    color: '#1e293b'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                            Contraseña
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%', padding: '0.75rem 2.75rem 0.75rem 2.5rem',
                                    border: '1px solid #cbd5e1', borderRadius: '8px',
                                    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                    color: '#1e293b'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                    color: '#64748b', display: 'flex', alignItems: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            background: '#fef2f2', border: '1px solid #fee2e2',
                            borderRadius: '8px', padding: '1rem',
                            color: '#b91c1c', fontSize: '0.875rem', fontWeight: '500'
                        }}>
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            backgroundColor: loading ? '#94a3b8' : '#1e3a8a',
                            color: 'white', border: 'none', borderRadius: '8px',
                            padding: '0.875rem', fontSize: '1rem', fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s',
                            marginTop: '0.5rem'
                        }}
                    >
                        {loading ? 'Validando acceso...' : 'Ingresar al Sistema'}
                    </button>
                </form>
            </div>
        </div>
    );
}
