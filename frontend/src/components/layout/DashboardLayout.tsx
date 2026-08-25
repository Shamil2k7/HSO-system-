'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Boxes,
  Truck,
  DollarSign,
  TrendingUp,
  CreditCard,
  LogOut,
  Menu,
  X,
  User,
  ShoppingCart,
  FolderLock,
} from 'lucide-react';

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  if (!user) return null;

  // Determine links based on user role
  const getLinks = (): SidebarLink[] => {
    switch (user.role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Manage Users', href: '/admin/users', icon: Users },
          { name: 'Products Catalog', href: '/admin/products', icon: ShoppingBag },
          { name: 'HOS Inventory', href: '/admin/inventory', icon: Boxes },
          { name: 'Sales Invoices', href: '/admin/sales', icon: DollarSign },
          { name: 'Payments', href: '/admin/payments', icon: CreditCard },
          { name: 'Reports', href: '/admin/reports', icon: TrendingUp },
        ];
      case 'MANAGER':
        return [
          { name: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
          { name: 'HOS Management', href: '/manager/users', icon: Users },
          { name: 'Products Catalog', href: '/manager/products', icon: ShoppingBag },
          { name: 'HOS Inventory', href: '/manager/inventory', icon: Boxes },
          { name: 'Stock Transfer', href: '/manager/stock-transfer', icon: Truck },
          { name: 'HOS Performance', href: '/manager/salesmen', icon: Users },
          { name: 'Business Reports', href: '/manager/reports', icon: TrendingUp },
        ];
      case 'SALESMANAGER':
        return [
          { name: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
          { name: 'HOS Performance', href: '/manager/salesmen', icon: Users },
          { name: 'Sales Invoices', href: '/manager/sales', icon: DollarSign },
          { name: 'Payments', href: '/manager/payments', icon: CreditCard },
          { name: 'Business Reports', href: '/manager/reports', icon: TrendingUp },
        ];
      case 'SALESMAN':
        return [
          { name: 'Dashboard', href: '/salesman/dashboard', icon: LayoutDashboard },
          { name: 'Add Sale (POS)', href: '/salesman/add-sale', icon: ShoppingCart },
          { name: 'My Assigned Stock', href: '/salesman/my-stock', icon: Boxes },
          { name: 'Stock Transfer', href: '/salesman/stock-transfer', icon: Truck },
          { name: 'My Sales', href: '/salesman/sales', icon: DollarSign },
          { name: 'My Collections', href: '/salesman/payments', icon: CreditCard },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SALESMANAGER':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'SALESMAN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Home Shop</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info Capsule */}
        <div className="flex flex-col border-b border-slate-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100">
              <User className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor()}`}>
              {user.role === 'MANAGER' ? 'CLC' : user.role === 'SALESMAN' ? 'HOS' : user.role}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout Option */}
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all"
          >
            <LogOut className="h-5 w-5 text-slate-400 hover:text-rose-600 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mr-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight lg:text-xl">
              {links.find((l) => pathname === l.href || pathname.startsWith(l.href + '/'))?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Profile Capsule */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2 rounded-lg p-1.5 hover:bg-slate-100 focus:outline-none"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="hidden text-sm font-semibold text-slate-700 md:inline-block">
                  {user.name.split(' ')[0]}
                </span>
              </button>

              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-20">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</p>
                      <p className="text-sm font-bold text-slate-700">{user.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="mt-1 flex w-full items-center space-x-2 rounded-lg px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
