import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

    const roleBadgeStyle = (color) => ({
        display: 'inline-block',
        background: color,
        color: 'white',
        padding: '0.15rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        marginRight: '0.25rem'
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2.5rem',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
            }}>
                {/* Logo / Título */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                        borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <Lock color="white" size={28} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                        Registro Asistencia
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                        Inicia sesión para continuar
                    </p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem' }}>
                            Correo electrónico
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="inspector@colegio.cl"
                                required
                                style={{
                                    width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem',
                                    border: '1px solid #d1d5db', borderRadius: '8px',
                                    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem' }}>
                            Contraseña
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem',
                                    border: '1px solid #d1d5db', borderRadius: '8px',
                                    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem',
                            color: '#dc2626', fontSize: '0.875rem'
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                            color: 'white', border: 'none', borderRadius: '8px',
                            padding: '0.75rem', fontSize: '0.95rem', fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>


            </div>
        </div>
    );
}
