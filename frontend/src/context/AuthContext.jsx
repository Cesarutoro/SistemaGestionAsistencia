import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Al montar: verificar si hay una sesión válida.
    // Primero intenta con el access token guardado en localStorage.
    // Si falla con 401, el interceptor de api.js intentará /auth/refresh automáticamente
    // (gracias a la cookie httpOnly). Si también falla, el usuario queda sin sesión.
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            api.get('/auth/me')
                .then(res => setUser(res.data.usuario))
                .catch(() => {
                    // El interceptor ya intentó el refresh; si llegamos aquí, no hay sesión válida.
                    localStorage.removeItem('token');
                    delete api.defaults.headers.common['Authorization'];
                })
                .finally(() => setLoading(false));
        } else {
            // Sin access token local: intentar refrescar directamente usando la cookie.
            // Esto cubre el caso de que el usuario recargó la página después de que
            // el access token expiró pero el refresh token aún es válido.
            api.post('/auth/refresh')
                .then(res => {
                    const { token: newToken, usuario } = res.data;
                    localStorage.setItem('token', newToken);
                    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                    setUser(usuario);
                })
                .catch(() => {
                    // No hay refresh token válido tampoco — login requerido
                })
                .finally(() => setLoading(false));
        }
    }, []);

    // Escuchar el evento disparado por el interceptor cuando el refresh falla
    // (por ejemplo, refresh token expirado o revocado).
    useEffect(() => {
        const handleSessionExpired = () => {
            setUser(null);
        };
        window.addEventListener('auth:sessionExpired', handleSessionExpired);
        return () => window.removeEventListener('auth:sessionExpired', handleSessionExpired);
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, usuario } = res.data;
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(usuario);
        return usuario;
    };

    const logout = async () => {
        try {
            // Revoca el refresh token en el servidor y limpia la cookie httpOnly
            await api.post('/auth/logout');
        } catch {
            // Si falla (red caída, etc.) igual limpiamos el estado local
        }
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
