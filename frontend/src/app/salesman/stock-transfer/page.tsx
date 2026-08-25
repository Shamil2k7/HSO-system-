'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import {
  Truck,
  Plus,
  Loader2,
  Boxes,
  ArrowRight,
  UserCheck,
  Calendar,
} from 'lucide-react';

interface Salesman {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface PersonalStockItem {
  _id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
}

interface TransferRecord {
  _id: string;
  transferId: string;
  productId: { name: string; sku: string; unit: string } | null;
  quantity: number;
  from: string;
  to: string;
  toSalesmanId: { name: string } | null;
  fromSalesmanId: { name: string } | null;
  performedBy: { name: string } | null;
  status: string;
  createdAt: string;
}

export default function SalesmanStockTransfer() {
  const { showToast } = useToast();

  // Data lists
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [personalStock, setPersonalStock] = useState<PersonalStockItem[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedTargetSalesmanId, setSelectedTargetSalesmanId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [usersRes, stockRes, transfersRes] = await Promise.all([
        api.get('/users'),
        api.get('/inventory/my-stock'),
        api.get('/stock-transfers'),
      ]);

      // Filter users to only include active salesmen, excluding current user
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      
      const activeSalesmen = usersRes.data.filter(
        (u: any) => u.role === 'SALESMAN' && u.status === 'active' && (currentUser ? u._id !== currentUser.id : true)
      );
      setSalesmen(activeSalesmen);

      // Set personal stock
      setPersonalStock(stockRes.data);
      setTransfers(transfersRes.data);

      // Pre-select first values if available
      if (activeSalesmen.length > 0 && !selectedTargetSalesmanId) {
        setSelectedTargetSalesmanId(activeSalesmen[0]._id);
      }
      if (stockRes.data.length > 0 && !selectedProductId) {
        setSelectedProductId(stockRes.data[0].productId);
      }
    } catch (error) {
      showToast('Failed to load stock transfer data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTargetSalesmanId) {
      showToast('Please select a target salesman.', 'error');
      return;
    }
    if (!selectedProductId) {
      showToast('Please select a product from your stock.', 'error');
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a positive transfer quantity.', 'error');
      return;
    }

    // Check available stock locally
    const productRecord = personalStock.find((s) => s.productId === selectedProductId);
    const availableQty = productRecord ? productRecord.quantity : 0;

    if (availableQty < qty) {
      showToast(`Insufficient stock. You only have ${availableQty} available.`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/stock-transfers', {
        toSalesmanId: selectedTargetSalesmanId,
        productId: selectedProductId,
        quantity: qty,
      });

      showToast('Stock transferred successfully!', 'success');
      setQuantity('');
      
      // Reload lists
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Stock transfer failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStockRecord = personalStock.find((s) => s.productId === selectedProductId);

  return (
    <div className="space-y-8">
      {/* Overview Head */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Transfer Stock</h2>
        <p className="text-sm text-slate-500">Transfer items from your personal stock allocation directly to another salesman</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Transfer Form Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-6 flex items-center">
            <Truck className="mr-2 h-5 w-5 text-indigo-600" /> New Stock Transfer
          </h3>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              {/* Target Salesman Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Transfer To (Salesman)
                </label>
                <select
                  value={selectedTargetSalesmanId}
                  onChange={(e) => setSelectedTargetSalesmanId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {salesmen.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                  {salesmen.length === 0 && <option value="">No other active salesmen available</option>}
                </select>
              </div>

              {/* Product Select from Personal Stock */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Product Item
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {personalStock.map((s) => (
                    <option key={s.productId} value={s.productId}>
                      {s.name} (SKU: {s.sku} | In Hand: {s.quantity})
                    </option>
                  ))}
                  {personalStock.length === 0 && <option value="">No stock items in your inventory</option>}
                </select>
              </div>

              {/* Available Stock Indicator */}
              {selectedStockRecord && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Your Available Stock:</span>
                  <span className={`font-black ${selectedStockRecord.quantity > 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                    {selectedStockRecord.quantity} {selectedStockRecord.unit}
                  </span>
                </div>
              )}

              {/* Quantity Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Transfer Quantity
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || salesmen.length === 0 || personalStock.length === 0}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="mr-1.5 h-4 w-4" />
                )}
                Transfer Stock
              </button>
            </form>
          )}
        </div>

        {/* Transfer History Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-6 flex items-center">
            <Boxes className="mr-2 h-5 w-5 text-indigo-600" /> My Transfer History
          </h3>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                    <th className="pb-3">Transfer ID</th>
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">From → To</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {transfers.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 font-bold text-indigo-600">{t.transferId}</td>
                      <td className="py-3.5">
                        <div className="font-bold text-slate-800">
                          {t.productId ? t.productId.name : 'Unknown Product'}
                        </div>
                        {t.productId && <div className="text-[10px] text-slate-400 font-normal">SKU: {t.productId.sku}</div>}
                      </td>
                      <td className="py-3.5 font-extrabold text-slate-900">
                        {t.quantity} {t.productId?.unit || 'pcs'}
                      </td>
                      <td className="py-3.5">
                        <span className="text-slate-500 text-xs">{t.from}</span>
                        <ArrowRight className="h-3 w-3 inline mx-1.5 text-slate-400" />
                        <span className="text-slate-800 text-xs font-bold">{t.to}</span>
                      </td>
                      <td className="py-3.5 text-right text-xs text-slate-400">
                        <span className="flex items-center justify-end">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-slate-300" />
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transfers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">No stock transfers executed yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
