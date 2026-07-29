import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { apiClient } from '../api/client';
import type { AuthUser } from '../types';

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sd_token');
    if (!token) { setLoading(false); return; }
    apiClient
      .get('/auth/me')
      .then((r) => setUser(r.data.data))
      .catch(() => { localStorage.removeItem('sd_token'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await apiClient.post('/auth/login', { email, password });
    const { token, user: u } = r.data.data as { token: string; user: AuthUser };
    localStorage.setItem('sd_token', token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sd_token');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
