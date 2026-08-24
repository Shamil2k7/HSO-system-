'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('ADMIN' | 'MANAGER' | 'SALESMAN' | 'SALESMANAGER' | 'WAREHOUSEMANAGER' | 'CASHIER')[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'ADMIN' && !allowedRoles.includes(user.role)) {
        // Admin overrides all roles. If non-admin is not allowed, redirect them.
        if (user.role === 'MANAGER' || user.role === 'SALESMANAGER' || user.role === 'WAREHOUSEMANAGER') {
          router.push('/manager/dashboard');
        } else if (user.role === 'SALESMAN' || user.role === 'CASHIER') {
          router.push('/salesman/dashboard');
        } else {
          router.push('/login');
        }
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-500 text-sm font-medium">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Admin bypasses all checks, otherwise ensure role is in list
  if (!user || (user.role !== 'ADMIN' && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
