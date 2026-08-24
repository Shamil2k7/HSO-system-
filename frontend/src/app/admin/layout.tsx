'use client';

import React from 'react';
import RoleGuard from '../../components/layout/RoleGuard';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleGuard>
  );
}
