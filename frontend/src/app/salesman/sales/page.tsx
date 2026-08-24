'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import {
  DollarSign,
  Search,
  X,
  Eye,
  Calendar,
  ShoppingBag,
} from 'lucide-react';

interface SaleItem {
  productType: 'company' | 'extra';
  productId: string | null;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  _id: string;
}

interface SaleRecord {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentStatus: 'COMPLETED' | 'PENDING';
  paymentMethod: string;
  pendingAmount: number;
  dueDate: string | null;
  notes: string;
  saleDate: string;
}

export default function SalesmanSales() {
  const { showToast } = useToast();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [search, setSearch] = useState('');

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data);
    } catch (error) {
      showToast('Failed to load your sales history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Sales History</h2>
        <p className="text-sm text-slate-500">Track and review all POS invoices logged under your account</p>
      </div>

      {/* Filter and Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search by Invoice # or Customer Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Sales Invoices Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading sales records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/55 text-xs font-bold uppercase text-slate-400">
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Grand Total</th>
                  <th className="px-6 py-3.5 text-rose-600">Pending Amount</th>
                  <th className="px-6 py-3.5">Payment Status</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredSales.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4 font-bold text-indigo-600">{s.invoiceNumber}</td>
                    <td className="px-6 py-4">{s.customerName}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-900">₹{s.grandTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 text-rose-650 font-bold">₹{s.pendingAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        s.paymentStatus === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-550">{s.paymentMethod}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(s.saleDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="rounded-lg p-1.5 text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400 text-xs">No invoices logged yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Overlay Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Invoice Details: {selectedSale.invoiceNumber}</h3>
                <p className="text-xs text-slate-400 flex items-center mt-1">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {new Date(selectedSale.saleDate).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="py-4 border-b border-slate-100 text-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Details</h4>
              <p className="font-bold text-slate-800 mt-1">{selectedSale.customerName}</p>
              {selectedSale.customerPhone && <p className="text-slate-500 text-xs mt-0.5">Phone: {selectedSale.customerPhone}</p>}
            </div>

            {/* Line Items */}
            <div className="py-6 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">Invoice Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-medium text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Item Description</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSale.items.map((item) => (
                      <tr key={item._id}>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.productType === 'company'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {item.productType === 'company' ? 'Company' : 'Extra'}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-slate-800">{item.productName}</td>
                        <td className="py-2.5 text-right">₹{item.price.toLocaleString()}</td>
                        <td className="py-2.5 text-center">{item.quantity}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900">₹{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Details */}
            <div className="flex flex-col items-end space-y-2.5 py-6 text-sm">
              <div className="flex w-60 justify-between">
                <span className="text-slate-500 font-semibold">Subtotal:</span>
                <span className="font-bold text-slate-800">₹{selectedSale.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex w-60 justify-between">
                <span className="text-slate-500 font-semibold">Discount:</span>
                <span className="font-bold text-rose-600">-₹{selectedSale.discount.toLocaleString()}</span>
              </div>
              <div className="flex w-60 justify-between border-t border-slate-200 pt-2.5 text-base">
                <span className="text-slate-800 font-bold">Grand Total:</span>
                <span className="font-black text-indigo-600">₹{selectedSale.grandTotal.toLocaleString()}</span>
              </div>
              
              <div className="flex w-60 justify-between pt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Payment Status:</span>
                <span className={`font-black uppercase ${selectedSale.paymentStatus === 'COMPLETED' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedSale.paymentStatus}
                </span>
              </div>

              {selectedSale.paymentStatus === 'PENDING' && (
                <>
                  <div className="flex w-60 justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Pending Balance:</span>
                    <span className="font-black text-rose-600">₹{selectedSale.pendingAmount.toLocaleString()}</span>
                  </div>
                  {selectedSale.dueDate && (
                    <div className="flex w-60 justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Payment Due Date:</span>
                      <span className="font-bold text-slate-700">{new Date(selectedSale.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Notes */}
            {selectedSale.notes && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs mt-4">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Invoice Notes:</span>
                <p className="text-slate-700 font-medium">{selectedSale.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
