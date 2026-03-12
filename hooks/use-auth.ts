import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/lib/auth';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authUserStr = localStorage.getItem('authUser');
    if (authUserStr) {
      try {
        const authUser = JSON.parse(authUserStr) as AuthUser;
        setUser(authUser);
      } catch (error) {
        console.error('Error parsing auth user:', error);
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('authUser');
    // Clear cookie
    document.cookie = 'authUser=; path=/; max-age=0';
    setUser(null);
    router.push('/login');
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  };
}
