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

interface Product {
  _id: string;
  name: string;
  unit: string;
}

interface SalesmanStock {
  _id: string;
  salesmanId: { _id: string } | null;
  productId: { _id: string } | null;
  quantity: number;
}

interface TransferRecord {
  _id: string;
  transferId: string;
  productId: { name: string; unit: string } | null;
  quantity: number;
  from: string;
  to: string;
  toSalesmanId: { name: string } | null;
  fromSalesmanId: { name: string } | null;
  performedBy: { name: string } | null;
  status: string;
  createdAt: string;
}

export default function ManagerStockTransfer() {
  const { showToast } = useToast();

  // Data lists
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allStock, setAllStock] = useState<SalesmanStock[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedSourceSalesmanId, setSelectedSourceSalesmanId] = useState('');
  const [selectedTargetSalesmanId, setSelectedTargetSalesmanId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [usersRes, productsRes, stockRes, transfersRes] = await Promise.all([
        api.get('/users'),
        api.get('/products'),
        api.get('/inventory/salesman-stock'),
        api.get('/stock-transfers'),
      ]);

      // Filter users to only include active salesmen
      const activeSalesmen = usersRes.data.filter(
        (u: any) => u.role === 'SALESMAN' && u.status === 'active'
      );
      setSalesmen(activeSalesmen);

      // Only show active products for transfer
      const activeProducts = productsRes.data.filter((p: any) => p.status === 'active');
      setProducts(activeProducts);

      setAllStock(stockRes.data);
      setTransfers(transfersRes.data);

      // Pre-select first values if available
      if (activeSalesmen.length > 0) {
        if (!selectedSourceSalesmanId) {
          setSelectedSourceSalesmanId(activeSalesmen[0]._id);
        }
        if (!selectedTargetSalesmanId) {
          setSelectedTargetSalesmanId(activeSalesmen[1]?._id || activeSalesmen[0]._id);
        }
      }
      if (activeProducts.length > 0 && !selectedProductId) {
        setSelectedProductId(activeProducts[0]._id);
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

    if (!selectedSourceSalesmanId) {
      showToast('Please select a source salesman.', 'error');
      return;
    }
    if (!selectedTargetSalesmanId) {
      showToast('Please select a target salesman.', 'error');
      return;
    }
    if (selectedSourceSalesmanId === selectedTargetSalesmanId) {
      showToast('Source and target salesmen must be different.', 'error');
      return;
    }
    if (!selectedProductId) {
      showToast('Please select a product.', 'error');
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a positive transfer quantity.', 'error');
      return;
    }

    // Check available stock locally
    const sourceStockRecord = allStock.find(
      (s) => s.salesmanId?._id === selectedSourceSalesmanId && s.productId?._id === selectedProductId
    );
    const availableQty = sourceStockRecord ? sourceStockRecord.quantity : 0;

    if (availableQty < qty) {
      showToast(`Insufficient stock for source salesman. Available quantity: ${availableQty}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/stock-transfers', {
        fromSalesmanId: selectedSourceSalesmanId,
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

  const sourceStockRecord = allStock.find(
    (s) => s.salesmanId?._id === selectedSourceSalesmanId && s.productId?._id === selectedProductId
  );
  const availableStock = sourceStockRecord ? sourceStockRecord.quantity : 0;
  const selectedProduct = products.find((p) => p._id === selectedProductId);

  return (
    <div className="space-y-8">
      {/* Overview Head */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Stock Distribution</h2>
        <p className="text-sm text-slate-500">Transfer company inventory directly from one salesman's personal stock to another</p>
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
              {/* Source Salesman Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  From Salesman (Source)
                </label>
                <select
                  value={selectedSourceSalesmanId}
                  onChange={(e) => setSelectedSourceSalesmanId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {salesmen.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                  {salesmen.length === 0 && <option value="">No active salesmen</option>}
                </select>
              </div>

              {/* Target Salesman Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  To Salesman (Target)
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
                  {salesmen.length === 0 && <option value="">No active salesmen</option>}
                </select>
              </div>

              {/* Product Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Product Item
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                  {products.length === 0 && <option value="">No products available</option>}
                </select>
              </div>

              {/* Available Stock Indicator */}
              {selectedProduct && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Source Available Stock:</span>
                  <span className={`font-black ${availableStock > 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                    {availableStock} {selectedProduct.unit}
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
                  placeholder="e.g. 10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || salesmen.length === 0 || products.length === 0}
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
            <Boxes className="mr-2 h-5 w-5 text-indigo-600" /> Stock Transfer History
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
                    <th className="pb-3">Performed By</th>
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
                      </td>
                      <td className="py-3.5 font-extrabold text-slate-900">
                        {t.quantity} {t.productId?.unit || 'pcs'}
                      </td>
                      <td className="py-3.5">
                        <span className="text-slate-500 text-xs">{t.from}</span>
                        <ArrowRight className="h-3 w-3 inline mx-1.5 text-slate-400" />
                        <span className="text-slate-800 text-xs font-bold">{t.to}</span>
                      </td>
                      <td className="py-3.5 text-xs text-slate-500">{t.performedBy?.name || 'System'}</td>
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
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">No stock transfers executed yet</td>
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
