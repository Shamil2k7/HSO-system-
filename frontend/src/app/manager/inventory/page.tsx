'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import {
  Boxes,
  Plus,
  ArrowUpRight,
  TrendingDown,
  X,
  Loader2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

interface SalesmanStockData {
  _id: string;
  salesmanId: { _id: string; name: string; email: string } | null;
  productId: { _id: string; name: string; category: string; unit: string; minStockLevel: number; status: string } | null;
  quantity: number;
  updatedAt: string;
}

export default function ManagerInventory() {
  const { showToast } = useToast();
  const [stock, setStock] = useState<SalesmanStockData[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [stockRes, usersRes, productsRes] = await Promise.all([
        api.get('/inventory/salesman-stock'),
        api.get('/users'),
        api.get('/products'),
      ]);

      setStock(stockRes.data);
      
      const activeSalesmen = usersRes.data.filter((u: any) => u.role === 'SALESMAN' && u.status === 'active');
      setSalesmen(activeSalesmen);

      const activeProducts = productsRes.data.filter((p: any) => p.status === 'active');
      setProductsList(activeProducts);

      if (activeSalesmen.length > 0) {
        setSelectedSalesmanId(activeSalesmen[0]._id);
      }
      if (activeProducts.length > 0) {
        setSelectedProductId(activeProducts[0]._id);
      }
    } catch (error) {
      showToast('Failed to load inventory data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddStockModal = (salesmanId: string = '', productId: string = '') => {
    setSelectedSalesmanId(salesmanId || (salesmen[0]?._id || ''));
    setSelectedProductId(productId || (productsList[0]?._id || ''));
    setQuantity('');
    setNotes('');
    setModalOpen(true);
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalesmanId) {
      showToast('Please select a salesman.', 'error');
      return;
    }
    if (!selectedProductId) {
      showToast('Please select a product.', 'error');
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a positive stock quantity.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/inventory/add-stock', {
        salesmanId: selectedSalesmanId,
        productId: selectedProductId,
        quantity: qty,
        notes: notes || 'Direct supply to salesman',
      });
      showToast('Stock replenished successfully', 'success');
      setModalOpen(false);
      setLoading(true);
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to replenish stock.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">HOS Inventory</h2>
          <p className="text-sm text-slate-500">Track and replenish stock assigned directly to HOS (salesman) personal allocation</p>
        </div>
        <button
          onClick={() => openAddStockModal('', '')}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="mr-1.5 h-5 w-5" /> Replenish HOS Stock
        </button>
      </div>

      {/* Main Stock Summary Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Catalog Product Count</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">{productsList.length} items</h3>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Allocated Stock</p>
          <h3 className="mt-2 text-2xl font-black text-indigo-600">
            {stock.reduce((acc, s) => acc + s.quantity, 0).toLocaleString()} units
          </h3>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Low Stock Allocations</p>
          <h3 className="mt-2 text-2xl font-black text-rose-600">
            {stock.filter((s) => s.productId && s.productId.status === 'active' && s.quantity <= s.productId.minStockLevel).length}
          </h3>
        </div>
      </div>

      {/* Stock Levels Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading stock records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/55 text-xs font-bold uppercase text-slate-400">
                  <th className="px-6 py-3.5">HOS User</th>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Allocated Balance</th>
                  <th className="px-6 py-3.5">Safety Point</th>
                  <th className="px-6 py-3.5">Status Check</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {stock.map((s) => {
                  const isLow = s.productId && s.productId.status === 'active' && s.quantity <= s.productId.minStockLevel;
                  return (
                    <tr key={s._id} className="hover:bg-slate-50/30">
                      <td className="px-6 py-4 font-bold text-slate-800">{s.salesmanId?.name || 'Unknown HOS'}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{s.productId?.name || 'Deleted Product'}</td>
                      <td className="px-6 py-4">{s.productId?.category || '-'}</td>
                      <td className={`px-6 py-4 font-extrabold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                        {s.quantity} {s.productId?.unit || 'pcs'}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{s.productId?.minStockLevel || 0} {s.productId?.unit || 'pcs'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isLow
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isLow ? 'Low Stock' : 'Good Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openAddStockModal(s.salesmanId?._id, s.productId?._id)}
                          className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg px-2.5 py-1.5 transition-all"
                        >
                          <Plus className="mr-1 h-3 w-3" /> Replenish
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {stock.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400 text-xs">No product allocations registered in system</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Replenish Stock Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Boxes className="mr-2 h-5 w-5 text-indigo-600" /> Replenish HOS Stock
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddStockSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select HOS User
                </label>
                <select
                  value={selectedSalesmanId}
                  onChange={(e) => setSelectedSalesmanId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {salesmen.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                  {salesmen.length === 0 && <option value="">No active HOS users</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Product Item
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {productsList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                  {productsList.length === 0 && <option value="">No active products</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Refill Quantity
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Replenishment Notes / Source
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Supplier direct shipment, Batch F-99"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || salesmen.length === 0 || productsList.length === 0}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Replenish Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
