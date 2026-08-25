'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import {
  TrendingUp,
  DollarSign,
  Boxes,
  AlertTriangle,
  CreditCard,
  CheckCircle,
  Clock,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import Link from 'next/link';

interface DashboardData {
  metrics: {
    todaySales: number;
    weekSales: number;
    monthSales: number;
    mainStockTotal: number;
    lowStockCount: number;
    pendingPayments: number;
    completedPayments: number;
  };
  weeklyChartData: { day: string; sales: number }[];
  monthlyChartData: { week: string; sales: number }[];
  performanceTable: {
    id: string;
    name: string;
    today: number;
    week: number;
    month: number;
    pending: number;
  }[];
  recentSales: any[];
  lowStockAlerts: any[];
}

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await api.get('/dashboard/manager');
        setData(response.data);
      } catch (error) {
        showToast('Failed to load dashboard metrics.', 'error');
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
        <p className="mt-4 text-sm font-semibold text-slate-500">Loading metrics dashboard...</p>
      </div>
    );
  }

  if (!data) return <p className="text-slate-500">No dashboard data found.</p>;

  const { metrics, weeklyChartData, monthlyChartData, performanceTable, recentSales, lowStockAlerts } = data;

  return (
    <div className="space-y-8">
      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Sales</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">₹{metrics.todaySales.toLocaleString()}</h3>
            </div>
            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-indigo-600 font-semibold flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" /> Direct channel collections
          </p>
        </div>

        {/* Weekly Sales */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Weekly Revenue</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">₹{metrics.weekSales.toLocaleString()}</h3>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Current calendar week sales</p>
        </div>

        {/* Warehouse Inventory */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Main Stock Units</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">{metrics.mainStockTotal.toLocaleString()}</h3>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Boxes className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Total units in primary warehouse</p>
        </div>

        {/* Low Stock Thresholds */}
        <div className={`rounded-2xl border p-6 shadow-sm ${metrics.lowStockCount > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Low Stock Alerts</p>
              <h3 className={`mt-2 text-2xl font-black ${metrics.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                {metrics.lowStockCount}
              </h3>
            </div>
            <div className={`rounded-lg p-3 ${metrics.lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <p className={`mt-3 text-xs font-semibold ${metrics.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
            {metrics.lowStockCount > 0 ? 'Action required: restock soon' : 'All items sufficiently stocked'}
          </p>
        </div>
      </div>

      {/* Payment Aging Collections Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center space-x-4 rounded-2xl border border-rose-100 bg-rose-50/30 p-5 shadow-sm">
          <div className="rounded-xl bg-rose-100 p-3 text-rose-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pending Payments</p>
            <h4 className="text-xl font-extrabold text-slate-800">₹{metrics.pendingPayments.toLocaleString()}</h4>
          </div>
        </div>

        <div className="flex items-center space-x-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 shadow-sm">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Collections</p>
            <h4 className="text-xl font-extrabold text-slate-800">₹{metrics.completedPayments.toLocaleString()}</h4>
          </div>
        </div>
      </div>

      {/* Chart Visualizations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Revenue trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-6">Weekly Sales Trend</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: '12px', fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '12px', fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val) => [`₹${val}`, 'Sales']} />
                <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-6">Monthly Revenue trend</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} style={{ fontSize: '12px', fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '12px', fill: '#64748b' }} />
                <Tooltip formatter={(val) => [`₹${val}`, 'Sales']} />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Salesman Performance & Recent Invoices */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Salesman Performance Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Salesman Performance</h3>
            <div className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 flex items-center">
              <UserCheck className="h-3 w-3 mr-1" /> Active Salesmen
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                  <th className="pb-3">Salesman</th>
                  <th className="pb-3 text-right">Today</th>
                  <th className="pb-3 text-right">This Week</th>
                  <th className="pb-3 text-right">This Month</th>
                  <th className="pb-3 text-right">Pending Collections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {performanceTable.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-bold text-slate-800">{s.name}</td>
                    <td className="py-3.5 text-right">₹{s.today.toLocaleString()}</td>
                    <td className="py-3.5 text-right text-indigo-600">₹{s.week.toLocaleString()}</td>
                    <td className="py-3.5 text-right text-slate-900 font-extrabold">₹{s.month.toLocaleString()}</td>
                    <td className="py-3.5 text-right text-rose-600">₹{s.pending.toLocaleString()}</td>
                  </tr>
                ))}
                {performanceTable.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">No active salesmen registered</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">Stock Alerts</h3>
            <div className="divide-y divide-slate-100">
              {lowStockAlerts.map((item) => (
                <div key={item._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-600">Stock: {item.mainStock} {item.unit}</p>
                    <p className="text-[10px] text-slate-400">Min: {item.minStockLevel}</p>
                  </div>
                </div>
              ))}
              {lowStockAlerts.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">No items currently below alert levels</div>
              )}
            </div>
          </div>
          <Link href="/admin/inventory" className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-700 transition-all">
            Manage Main Inventory <ArrowRight className="h-3 w-3 ml-1.5" />
          </Link>
        </div>
      </div>

      {/* Recent Sales List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Recent Invoices</h3>
          <Link href="/admin/sales" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center">
            View All Sales <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                <th className="pb-3">Invoice #</th>
                <th className="pb-3">Salesman</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {recentSales.map((sale) => (
                <tr key={sale._id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-bold text-indigo-600">{sale.invoiceNumber}</td>
                  <td className="py-3">{sale.salesmanId?.name || 'Salesman'}</td>
                  <td className="py-3">{sale.customerName}</td>
                  <td className="py-3 font-semibold text-slate-900">₹{sale.grandTotal.toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      sale.paymentStatus === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-slate-500 font-semibold">{sale.paymentMethod}</td>
                  <td className="py-3 text-xs text-slate-400">{new Date(sale.saleDate).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">No sales recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
