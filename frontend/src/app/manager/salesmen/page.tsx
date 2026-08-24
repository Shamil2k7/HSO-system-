'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import {
  Users,
  TrendingUp,
  DollarSign,
  Boxes,
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  Eye,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';

interface SalesmanSummary {
  id: string;
  name: string;
  today: number;
  week: number;
  month: number;
  pending: number;
}

interface DetailedPerformance {
  salesman: {
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  };
  summary: {
    totalRevenue: number;
    pendingPayments: number;
    salesCount: number;
  };
  sales: any[];
  stock: any[];
  companySalesList: any[];
  extraSalesList: any[];
}

export default function ManagerSalesmen() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('id');

  // Performance ranking state
  const [salesmen, setSalesmen] = useState<SalesmanSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Click-through detailed state
  const [detailData, setDetailData] = useState<DetailedPerformance | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchSalesmenList = async () => {
    try {
      const response = await api.get('/dashboard/manager');
      setSalesmen(response.data.performanceTable);
    } catch (error) {
      showToast('Failed to load salesmen performance ranking.', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchSalesmanDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/reports/salesman/${id}`);
      setDetailData(response.data);
    } catch (error) {
      showToast('Failed to load detailed performance statistics.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchSalesmenList();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchSalesmanDetail(selectedId);
    } else {
      setDetailData(null);
    }
  }, [selectedId]);

  const selectSalesman = (id: string) => {
    router.push(`/manager/salesmen?id=${id}`);
  };

  const clearSelection = () => {
    router.push('/manager/salesmen');
  };

  if (selectedId && detailData) {
    const { salesman, summary, sales, stock, companySalesList, extraSalesList } = detailData;
    return (
      <div className="space-y-6">
        {/* Back Button and Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={clearSelection}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{salesman.name}'s Profile</h2>
            <p className="text-sm text-slate-500">Click-through performance auditing, inventory levels, and transaction history</p>
          </div>
        </div>

        {/* Detailed Metrics Panel */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cumulative Sales</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">₹{summary.totalRevenue.toLocaleString()}</h3>
            <p className="mt-1 text-xs text-slate-400">Total volume of {summary.salesCount} invoices</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Collections</p>
            <h3 className="mt-2 text-2xl font-black text-rose-600">₹{summary.pendingPayments.toLocaleString()}</h3>
            <p className="mt-1 text-xs text-slate-400">Aging accounts receivable balance</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Stock SKUs Assigned</p>
            <h3 className="mt-2 text-2xl font-black text-indigo-600">
              {stock.reduce((acc, item) => acc + item.quantity, 0)} units
            </h3>
            <p className="mt-1 text-xs text-slate-400">Across {stock.length} unique product SKUs</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Personal Assigned Stock */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center">
              <Boxes className="mr-2 h-5 w-5 text-indigo-600" /> Current Personal Stock
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">SKU</th>
                    <th className="pb-2 text-right">Available Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {stock.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-800">{item.productId?.name || 'Deleted Product'}</td>
                      <td className="py-2.5 font-mono text-xs">{item.productId?.sku || '-'}</td>
                      <td className="py-2.5 text-right font-extrabold text-slate-900">
                        {item.quantity} {item.productId?.unit || 'pcs'}
                      </td>
                    </tr>
                  ))}
                  {stock.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400 text-xs">No stock currently assigned</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Company Items Sold Ranking */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-indigo-600" /> Company Products Sold
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                    <th className="pb-2">Product Name</th>
                    <th className="pb-2 text-right">Units Sold</th>
                    <th className="pb-2 text-right">Sales Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {companySalesList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-800">{item.name}</td>
                      <td className="py-2.5 text-right font-extrabold text-slate-900">{item.unitsSold}</td>
                      <td className="py-2.5 text-right text-emerald-600 font-bold">₹{item.totalSalesValue.toLocaleString()}</td>
                    </tr>
                  ))}
                  {companySalesList.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400 text-xs">No company products sold yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Extra Products Sold list */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center">
            <FileSpreadsheet className="mr-2 h-5 w-5 text-indigo-600" /> Extra Inventory Items Sold
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                  <th className="pb-2">Item Name</th>
                  <th className="pb-2 text-right">Units Sold</th>
                  <th className="pb-2 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {extraSalesList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-bold text-slate-800">{item.name}</td>
                    <td className="py-2.5 text-right font-extrabold text-slate-900">{item.qty}</td>
                    <td className="py-2.5 text-right text-emerald-600 font-bold">₹{item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {extraSalesList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400 text-xs">No extra products sold yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales Invoices List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">Invoices Generated</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                  <th className="pb-2.5">Invoice #</th>
                  <th className="pb-2.5">Customer Name</th>
                  <th className="pb-2.5">Subtotal</th>
                  <th className="pb-2.5">Grand Total</th>
                  <th className="pb-2.5">Paid</th>
                  <th className="pb-2.5">Pending</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {sales.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-indigo-600">{s.invoiceNumber}</td>
                    <td className="py-3">{s.customerName}</td>
                    <td className="py-3">₹{s.subtotal.toLocaleString()}</td>
                    <td className="py-3 font-extrabold text-slate-900">₹{s.grandTotal.toLocaleString()}</td>
                    <td className="py-3 text-emerald-600">₹{(s.grandTotal - s.pendingAmount).toLocaleString()}</td>
                    <td className="py-3 text-rose-600">₹{s.pendingAmount.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        s.paymentStatus === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-right text-xs text-slate-400">
                      {new Date(s.saleDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">No invoices generated yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Salesmen Performance</h2>
        <p className="text-sm text-slate-500">Monitor salesman targets, revenue streams, and inventory levels</p>
      </div>

      {/* Performance Summary Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loadingList ? (
          <div className="flex h-48 flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading salesmen index...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/55 text-xs font-bold uppercase text-slate-400">
                  <th className="px-6 py-4">Salesman</th>
                  <th className="px-6 py-4 text-right">Sales Today</th>
                  <th className="px-6 py-4 text-right">Sales This Week</th>
                  <th className="px-6 py-4 text-right">Sales This Month</th>
                  <th className="px-6 py-4 text-right">Pending Payments</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {salesmen.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4.5 font-bold text-slate-800">{s.name}</td>
                    <td className="px-6 py-4.5 text-right text-slate-700 font-semibold">₹{s.today.toLocaleString()}</td>
                    <td className="px-6 py-4.5 text-right text-indigo-600">₹{s.week.toLocaleString()}</td>
                    <td className="px-6 py-4.5 text-right text-slate-900 font-black">₹{s.month.toLocaleString()}</td>
                    <td className="px-6 py-4.5 text-right text-rose-600">₹{s.pending.toLocaleString()}</td>
                    <td className="px-6 py-4.5 text-center">
                      <button
                        onClick={() => selectSalesman(s.id)}
                        className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg px-2.5 py-1.5 transition-all"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Audit Profile
                      </button>
                    </td>
                  </tr>
                ))}
                {salesmen.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">No active salesmen registered</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
