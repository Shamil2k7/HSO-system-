'use client';

import React from 'react';
import RoleGuard from '../../components/layout/RoleGuard';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function SalesmanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['SALESMAN', 'CASHIER']}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleGuard>
  );
}
