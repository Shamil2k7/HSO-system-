'use client';

import React from 'react';
import RoleGuard from '../../components/layout/RoleGuard';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['MANAGER', 'SALESMANAGER']}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleGuard>
  );
}
