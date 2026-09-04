'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import {
  TrendingUp,
  DollarSign,
  Boxes,
  CreditCard,
  PlusCircle,
  Clock,
  ArrowRight,
  CircleDollarSign,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

interface DashboardData {
  metrics: {
    todaySales: number;
    weekSales: number;
    monthSales: number;
    totalStockQty: number;
    totalStockValue?: number;
    pendingAmount: number;
    completedAmount: number;
  };
  recentSales: any[];
  pendingPayments: any[];
  chartData: { day: string; sales: number }[];
}

export default function SalesmanDashboard() {
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await api.get('/dashboard/salesman');
        setData(response.data);
      } catch (error) {
        showToast('Failed to load personal dashboard.', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-semibold text-slate-500">Loading your profile stats...</p>
      </div>
    );
  }

  if (!data) return <p className="text-slate-500">No dashboard data found.</p>;

  const { metrics, recentSales, pendingPayments, chartData } = data;

  return (
    <div className="space-y-8">
      {/* POS Quick Launch Header */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-xl flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-xl font-black md:text-2xl tracking-tight">POS Terminal</h2>
          <p className="text-slate-400 text-xs mt-1">Select company products, add extra items, and record transactions instantly</p>
        </div>
        <Link
          href="/salesman/add-sale"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all font-sans"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> ADD NEW SALE (POS)
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Today's Sales */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">My Sales Today</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">₹{metrics.todaySales.toLocaleString()}</h3>
            </div>
            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">My Sales This Week</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">₹{metrics.weekSales.toLocaleString()}</h3>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Total Price of Stock */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Price of Stock</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                ₹{(metrics.totalStockValue || 0).toLocaleString()}
              </h3>
              <p className="mt-1 text-xs text-slate-400 font-medium">
                {metrics.totalStockQty} units in hand
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
              <CircleDollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Assigned Stock Quantity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">My Assigned Stock</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">{metrics.totalStockQty} units</h3>
              <Link href="/salesman/my-stock" className="mt-1 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                View Stock &rarr;
              </Link>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Boxes className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Pending collections */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">My Pending Collections</p>
              <h3 className="mt-2 text-2xl font-black text-rose-600">₹{metrics.pendingAmount.toLocaleString()}</h3>
            </div>
            <div className="rounded-lg bg-rose-50 p-3 text-rose-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Performance Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-6">My 7-Day Revenue Trend</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: '12px', fill: '#64748b' }} />
              <YAxis tickLine={false} axisLine={false} style={{ fontSize: '12px', fill: '#64748b' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val) => [`₹${val}`, 'Sales']} />
              <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">My Recent Invoices</h3>
            <Link href="/salesman/sales" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {recentSales.map((sale) => (
                  <tr key={sale._id}>
                    <td className="py-2.5 font-bold text-indigo-600">{sale.invoiceNumber}</td>
                    <td className="py-2.5">{sale.customerName}</td>
                    <td className="py-2.5 font-bold text-slate-900">₹{sale.grandTotal.toLocaleString()}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        sale.paymentStatus === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">No invoices logged yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Collections list */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">My Outstanding Collections</h3>
            <Link href="/salesman/payments" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Balance Due</th>
                  <th className="pb-2">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {pendingPayments.map((sale) => (
                  <tr key={sale._id}>
                    <td className="py-2.5 font-bold text-indigo-600">{sale.invoiceNumber}</td>
                    <td className="py-2.5">{sale.customerName}</td>
                    <td className="py-2.5 font-black text-rose-600">₹{sale.pendingAmount.toLocaleString()}</td>
                    <td className="py-2.5 text-xs text-slate-500">
                      {sale.dueDate ? new Date(sale.dueDate).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
                {pendingPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">No outstanding payments pending</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
