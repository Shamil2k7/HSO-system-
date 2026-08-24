'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import {
  TrendingUp,
  CreditCard,
  Boxes,
  Search,
  Calendar,
  Filter,
  Download,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface Salesman {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
}

export default function ManagerReports() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'sales' | 'payments' | 'stock'>('sales');
  
  // Filter lookups
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSalesmanId, setSelectedSalesmanId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('All');

  // Reports data states
  const [salesReport, setSalesReport] = useState<any>(null);
  const [paymentsReport, setPaymentsReport] = useState<any>(null);
  const [stockReport, setStockReport] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  const fetchFilters = async () => {
    try {
      const [usersRes, productsRes] = await Promise.all([
        api.get('/users'),
        api.get('/products'),
      ]);
      setSalesmen(usersRes.data.filter((u: any) => u.role === 'SALESMAN'));
      setProducts(productsRes.data);
    } catch (e) {
      showToast('Failed to load filter choices.', 'error');
    } finally {
      setLoadingFilters(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  const runSalesReport = async () => {
    setLoadingData(true);
    try {
      let url = '/reports/sales?';
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (selectedSalesmanId) url += `salesmanId=${selectedSalesmanId}&`;
      if (selectedProductId) url += `productId=${selectedProductId}&`;
      if (customerName) url += `customerName=${customerName}&`;

      const response = await api.get(url);
      setSalesReport(response.data);
    } catch (e) {
      showToast('Failed to run sales report.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const runPaymentsReport = async () => {
    setLoadingData(true);
    try {
      let url = '/reports/payments?';
      if (paymentStatus !== 'All') url += `paymentStatus=${paymentStatus}&`;
      if (selectedSalesmanId) url += `salesmanId=${selectedSalesmanId}&`;

      const response = await api.get(url);
      setPaymentsReport(response.data);
    } catch (e) {
      showToast('Failed to run payments report.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const runStockReport = async () => {
    setLoadingData(true);
    try {
      const response = await api.get('/reports/stock');
      setStockReport(response.data);
    } catch (e) {
      showToast('Failed to load stock ledger reports.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sales') {
      runSalesReport();
    } else if (activeTab === 'payments') {
      runPaymentsReport();
    } else if (activeTab === 'stock') {
      runStockReport();
    }
  }, [activeTab]);

  // Client-side CSV Exporter Utility
  const exportToCSV = (headers: string[], rows: any[][], fileName: string) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSales = () => {
    if (!salesReport || salesReport.sales.length === 0) {
      showToast('No sales data available to export.', 'info');
      return;
    }
    const headers = ['Invoice Number', 'Salesman Name', 'Customer Name', 'Subtotal', 'Discount', 'Grand Total', 'Status', 'Method', 'Date'];
    const rows = salesReport.sales.map((s: any) => [
      s.invoiceNumber,
      s.salesmanId?.name || '-',
      s.customerName,
      s.subtotal,
      s.discount,
      s.grandTotal,
      s.paymentStatus,
      s.paymentMethod,
      new Date(s.saleDate).toLocaleDateString(),
    ]);
    exportToCSV(headers, rows, 'Sales_Report');
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">ERP Reporting</h2>
          <p className="text-sm text-slate-500">Run advanced queries on transactions, stock movements, and collections</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'sales'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-1.5" /> Sales Report
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'payments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <CreditCard className="h-4 w-4 inline mr-1.5" /> Collections Report
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'stock'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Boxes className="h-4 w-4 inline mr-1.5" /> Stock Ledger
          </button>
        </nav>
      </div>

      {/* Sales Report Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Query Filters card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center">
              <Filter className="mr-1.5 h-4 w-4 text-indigo-600" /> Filter Criteria
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Salesman</label>
                <select
                  value={selectedSalesmanId}
                  onChange={(e) => setSelectedSalesmanId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                >
                  <option value="">All Salesmen</option>
                  {salesmen.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Catalog Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                >
                  <option value="">All Products</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Name</label>
                <input
                  type="text"
                  placeholder="Search customer name..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={runSalesReport}
                disabled={loadingData}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {loadingData && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Report
              </button>
            </div>
          </div>

          {/* Report output metrics */}
          {salesReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Filtered Sales Revenue</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">₹{salesReport.summary.totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Discount Offered</p>
                  <h3 className="mt-2 text-2xl font-black text-rose-600">₹{salesReport.summary.totalDiscount.toLocaleString()}</h3>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoices Generated</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">{salesReport.summary.totalSalesCount}</h3>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Items Transacted</p>
                  <h3 className="mt-2 text-2xl font-black text-indigo-600">{salesReport.summary.totalItemsSold} units</h3>
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Detailed Transaction Logs</h4>
                  <button
                    onClick={handleExportSales}
                    className="inline-flex items-center text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 transition-all shadow-sm"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400 bg-slate-50/50">
                        <th className="px-6 py-3">Invoice #</th>
                        <th className="px-6 py-3">Salesman</th>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3">Subtotal</th>
                        <th className="px-6 py-3">Discount</th>
                        <th className="px-6 py-3">Grand Total</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                      {salesReport.sales.map((s: any) => (
                        <tr key={s._id} className="hover:bg-slate-50/20">
                          <td className="px-6 py-3.5 font-bold text-indigo-600">{s.invoiceNumber}</td>
                          <td className="px-6 py-3.5">{s.salesmanId?.name || '-'}</td>
                          <td className="px-6 py-3.5">{s.customerName}</td>
                          <td className="px-6 py-3.5">₹{s.subtotal.toLocaleString()}</td>
                          <td className="px-6 py-3.5 text-rose-600">-₹{s.discount.toLocaleString()}</td>
                          <td className="px-6 py-3.5 font-extrabold text-slate-900">₹{s.grandTotal.toLocaleString()}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                              s.paymentStatus === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {s.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right text-xs text-slate-400">
                            {new Date(s.saleDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Aging tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center">
              <Filter className="mr-1.5 h-4 w-4 text-indigo-600" /> Filter Criteria
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                >
                  <option value="All">All Invoices</option>
                  <option value="PENDING">PENDING Payments</option>
                  <option value="COMPLETED">COMPLETED Payments</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Responsible Salesman</label>
                <select
                  value={selectedSalesmanId}
                  onChange={(e) => setSelectedSalesmanId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none"
                >
                  <option value="">All Salesmen</option>
                  {salesmen.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end justify-end">
                <button
                  onClick={runPaymentsReport}
                  disabled={loadingData}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loadingData && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {paymentsReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/20 p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Aging Receivable Balance</p>
                  <h3 className="mt-2 text-2xl font-black text-rose-600">₹{paymentsReport.summary.totalPendingAmount.toLocaleString()}</h3>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Total Value</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">₹{paymentsReport.summary.totalSalesValue.toLocaleString()}</h3>
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Account Aging Detail Ledger</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400 bg-slate-50/50">
                        <th className="px-6 py-3">Invoice #</th>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3">Salesman</th>
                        <th className="px-6 py-3">Grand Total</th>
                        <th className="px-6 py-3 text-rose-600">Pending Balance</th>
                        <th className="px-6 py-3">Due Date</th>
                        <th className="px-6 py-3 text-right">Invoice Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                      {paymentsReport.sales.map((s: any) => (
                        <tr key={s._id} className="hover:bg-slate-50/20">
                          <td className="px-6 py-3.5 font-bold text-indigo-600">{s.invoiceNumber}</td>
                          <td className="px-6 py-3.5">{s.customerName}</td>
                          <td className="px-6 py-3.5">{s.salesmanId?.name || '-'}</td>
                          <td className="px-6 py-3.5">₹{s.grandTotal.toLocaleString()}</td>
                          <td className="px-6 py-3.5 font-extrabold text-rose-600">₹{s.pendingAmount.toLocaleString()}</td>
                          <td className="px-6 py-3.5">
                            {s.dueDate ? new Date(s.dueDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-3.5 text-right text-xs text-slate-400">
                            {new Date(s.saleDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Ledger tab */}
      {activeTab === 'stock' && stockReport && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Main Warehouse Balance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center">
              <Boxes className="mr-1.5 h-4 w-4 text-indigo-600" /> Central Warehouse Inventory
            </h3>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                    <th>SKU</th>
                    <th>Product</th>
                    <th>Safety Min</th>
                    <th className="text-right">Warehouse Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {stockReport.warehouseStock.map((w: any) => (
                    <tr key={w._id}>
                      <td className="py-2.5 font-mono text-xs">{w.sku}</td>
                      <td className="py-2.5 font-bold text-slate-800">{w.name}</td>
                      <td className="py-2.5 text-slate-400">{w.minStockLevel} {w.unit}</td>
                      <td className={`py-2.5 text-right font-extrabold ${w.mainStock <= w.minStockLevel ? 'text-rose-600' : 'text-slate-900'}`}>
                        {w.mainStock} {w.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Salesmen Stock distribution */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center">
              <ShieldCheck className="mr-1.5 h-4 w-4 text-indigo-600" /> Salesmen stock distribution
            </h3>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                    <th>Salesman</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th className="text-right">Personal Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {stockReport.salesmanStock.map((s: any) => (
                    <tr key={s._id}>
                      <td className="py-2.5 font-bold text-slate-800">{s.salesmanId?.name || 'Salesman'}</td>
                      <td className="py-2.5">{s.productId?.name || 'Product'}</td>
                      <td className="py-2.5 font-mono text-xs">{s.productId?.sku || '-'}</td>
                      <td className="py-2.5 text-right font-extrabold text-slate-900">
                        {s.quantity} {s.productId?.unit || 'pcs'}
                      </td>
                    </tr>
                  ))}
                  {stockReport.salesmanStock.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">No distributed stock logs</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Movements logs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">Central Stock Movement Ledger (Last 50)</h3>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                    <th className="pb-2">Product SKU</th>
                    <th className="pb-2">Movement Type</th>
                    <th className="pb-2 text-right">Adjustment</th>
                    <th className="pb-2">From → To</th>
                    <th className="pb-2">By User</th>
                    <th className="pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {stockReport.movements.map((m: any) => (
                    <tr key={m._id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono text-xs">
                        <span className="font-bold text-slate-800">{m.productId?.name}</span> ({m.productId?.sku})
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          ['INITIAL', 'STOCK_ADDED'].includes(m.type)
                            ? 'bg-emerald-50 text-emerald-800'
                            : m.type === 'TRANSFER'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}>
                          {m.type}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-extrabold ${m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="py-3 text-xs">
                        <span className="text-slate-500">{m.from}</span>
                        <ArrowRight className="h-3 w-3 inline mx-1 text-slate-400" />
                        <span className="text-slate-800 font-bold">{m.to}</span>
                      </td>
                      <td className="py-3 text-xs text-slate-500">{m.performedBy?.name || 'System'}</td>
                      <td className="py-3 text-right text-xs text-slate-400">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {stockReport.movements.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 text-xs">No movements cataloged</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
