'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../lib/api';

export interface UserType {
  id: string;
  name: string;
  mobile: string;
  role: 'ADMIN' | 'MANAGER' | 'SALESMAN' | 'SALESMANAGER';
  status: string;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  login: (mobile: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUser(null);
          setLoading(false);
          // Redirect to login if not on login page
          if (pathname !== '/login') {
            router.push('/login');
          }
          return;
        }

        // Validate token with backend
        const response = await api.get('/auth/me');
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        // If authenticated and on login page, redirect to correct dashboard
        if (pathname === '/login' || pathname === '/') {
          redirectToDashboard(userData.role);
        }
      } catch (error) {
        console.error('Session verification failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname]);

  const redirectToDashboard = (role: string) => {
    if (role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (role === 'MANAGER' || role === 'SALESMANAGER') {
      router.push('/manager/dashboard');
    } else if (role === 'SALESMAN') {
      router.push('/salesman/dashboard');
    } else {
      router.push('/login');
    }
  };

  const login = async (mobile: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { mobile, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      redirectToDashboard(userData.role);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check credentials.';
      setLoading(false);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setLoading(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
