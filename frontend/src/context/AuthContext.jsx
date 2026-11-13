import { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import { authApi } from '../services/http';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initialized = useRef(false);
  const refresh = useCallback(async () => {
    if (!initialized.current) setLoading(true);
    setError('');
    try {
      setUser((await authApi.me()).user);
    } catch (e) {
      setUser(null);
      if (e.status !== 401) setError(e.message);
    } finally {
      initialized.current = true;
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const sync = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [refresh]);
  const login = async (data) => {
    const result = await authApi.login(data);
    setUser(result.user);
    setError('');
    return result;
  };
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      if (e.status !== 401) throw e;
    }
    // Reiniciar el documento elimina también el estado privado en memoria y
    // evita carreras entre el guard de rutas y el aviso de salida.
    window.location.replace('/iniciar-sesion?sesion=cerrada');
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, error, refresh, login, logout, updateUser: setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
