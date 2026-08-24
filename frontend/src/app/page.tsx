'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (user.role === 'MANAGER') {
          router.push('/manager/dashboard');
        } else if (user.role === 'SALESMAN') {
          router.push('/salesman/dashboard');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-slate-500 text-sm font-medium">Redirecting you...</p>
      </div>
    </div>
  );
}
