'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { Boxes, Search, Loader2, CircleDollarSign, Package, Trash2, AlertTriangle } from 'lucide-react';

interface StockItem {
  productId: string;
  name: string;
  category: string;
  unit: string;
  sellingPrice: number;
  quantity: number;
  status: string;
}

export default function SalesmanStock() {
  const { showToast } = useToast();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchMyStock = async () => {
    try {
      const response = await api.get('/inventory/my-stock');
      setStock(response.data);
    } catch (error) {
      showToast('Failed to load your personal stock.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyStock();
  }, []);

  const handleClearMyStock = async () => {
    setClearing(true);
    try {
      const res = await api.post('/inventory/clear-my-stock');
      showToast(res.data.message || 'Personal stock reset to 0.', 'success');
      setClearModalOpen(false);
      setLoading(true);
      await fetchMyStock();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to clear stock.', 'error');
    } finally {
      setClearing(false);
    }
  };

  const totalStockUnits = stock.reduce((sum, item) => sum + item.quantity, 0);
  const totalStockValuation = stock.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);

  const filteredStock = stock.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Assigned Stock</h2>
          <p className="text-sm text-slate-500">View products and inventory quantities currently allocated to your account</p>
        </div>
        <button
          onClick={() => setClearModalOpen(true)}
          disabled={clearing || stock.length === 0 || totalStockUnits === 0}
          className="inline-flex items-center justify-center rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
          title="Reset all my stock balances to 0"
        >
          <Trash2 className="mr-1.5 h-4 w-4" /> Clear All Stock
        </button>
      </div>

      {/* Stock Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Stock Price</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">₹{totalStockValuation.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Total valuation of assigned stock</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
            <CircleDollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Units in Hand</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">{totalStockUnits.toLocaleString()} units</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Combined quantity across all items</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Boxes className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Product Categories</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">{stock.length} products</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Active assigned product SKUs</p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <Package className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search within my stock by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Stock Cards/Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading assigned stocks...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/55 text-xs font-bold uppercase text-slate-400">
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Selling Price</th>
                  <th className="px-6 py-3.5 text-right">Available Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredStock.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4">₹{item.sellingPrice.toLocaleString()} / {item.unit}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-sm font-black ${
                        item.quantity === 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredStock.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs">No items found in your stock</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear All Stock Confirmation Modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start space-x-3 text-rose-600">
              <div className="rounded-xl bg-rose-50 p-2.5 shrink-0 border border-rose-100">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Clear All Stock?</h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Are you sure you want to clear your assigned stock? This will set <strong>all your product quantities to 0</strong>.
                </p>
                <p className="mt-2 text-xs text-rose-600 font-medium">
                  This action cannot be undone. All assigned balance will reset to 0.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-5 mt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                disabled={clearing}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearMyStock}
                disabled={clearing}
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-500 shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
              >
                {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Yes, Set All to 0
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
