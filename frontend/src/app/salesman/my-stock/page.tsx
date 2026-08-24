'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { Boxes, Search, Loader2 } from 'lucide-react';

interface StockItem {
  productId: string;
  name: string;
  sku: string;
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

  const filteredStock = stock.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Assigned Stock</h2>
        <p className="text-sm text-slate-500">View products and inventory quantities currently allocated to your account</p>
      </div>

      {/* Filter and Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search within my stock by name, SKU, or category..."
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
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Selling Price</th>
                  <th className="px-6 py-3.5 text-right">Available Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredStock.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">{item.sku}</td>
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
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">No items found in your stock</td>
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
