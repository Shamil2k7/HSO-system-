'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Boxes, Wallet } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isSpecial?: boolean;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/salesman/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'POS',
    href: '/salesman/add-sale',
    icon: ShoppingCart,
    isSpecial: true,
  },
  {
    name: 'Stock',
    href: '/salesman/my-stock',
    icon: Boxes,
  },
  {
    name: 'My Collection',
    href: '/salesman/payments',
    icon: Wallet,
  },
];

export default function SalesmanBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(15,23,42,0.08)] transition-all"
    >
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom,0px)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/salesman/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            if (item.isSpecial) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center justify-center -mt-5 group"
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 active:scale-95 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-indigo-600/40 ring-4 ring-indigo-100'
                        : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-indigo-500/30 group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-5 h-5 transition-transform" />
                  </div>
                  <span
                    className={`mt-1 text-[11px] font-bold tracking-tight transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-slate-600'
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 py-1 relative active:scale-95 transition-all group"
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive
                        ? 'text-indigo-600 scale-110'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[11px] font-semibold tracking-tight transition-colors ${
                    isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
