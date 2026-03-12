'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // SOLO usar localStorage, NO fetch a API que no existe
    try {
      const authUserStr = localStorage.getItem('authUser');
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr) as AuthUser;
        setUser(authUser);
      }
    } catch (error) {
      console.error('Error parsing auth user:', error);
      localStorage.removeItem('authUser');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      // Intentar logout en el servidor (opcional)
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      // Siempre limpiar localStorage
      localStorage.removeItem('authUser');
      document.cookie = 'session=; path=/; max-age=0';
      document.cookie = 'authUser=; path=/; max-age=0';
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}