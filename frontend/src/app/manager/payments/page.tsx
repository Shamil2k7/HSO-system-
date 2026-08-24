'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import {
  CreditCard,
  Search,
  X,
  Loader2,
  DollarSign,
  Calendar,
  AlertTriangle,
  History,
} from 'lucide-react';

interface PaymentHistoryItem {
  amountPaid: number;
  paymentMethod: string;
  datePaid: string;
  recordedBy: { name: string } | null;
  _id: string;
}

interface SaleRecord {
  _id: string;
  invoiceNumber: string;
  salesmanId: { name: string };
  customerName: string;
  customerPhone: string;
  grandTotal: number;
  paymentStatus: string;
  paymentMethod: string;
  pendingAmount: number;
  dueDate: string | null;
  saleDate: string;
  paymentHistory: PaymentHistoryItem[];
}

export default function ManagerPayments() {
  const { showToast } = useToast();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal Collection form state
  const [modalOpen, setModalOpen] = useState(false);
  const [targetSale, setTargetSale] = useState<SaleRecord | null>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);
  
  // History Modal state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySale, setHistorySale] = useState<SaleRecord | null>(null);

  const fetchPendingSales = async () => {
    try {
      const response = await api.get('/reports/payments?paymentStatus=PENDING');
      setSales(response.data.sales);
    } catch (error) {
      showToast('Failed to load pending payments list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSales();
  }, []);

  const openCollectionModal = (sale: SaleRecord) => {
    setTargetSale(sale);
    setAmountPaid(String(sale.pendingAmount)); // Default to paying full amount
    setPaymentMethod('CASH');
    setModalOpen(true);
  };

  const openHistoryModal = (sale: SaleRecord) => {
    setHistorySale(sale);
    setHistoryOpen(true);
  };

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSale) return;

    const amount = Number(amountPaid);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid payment amount.', 'error');
      return;
    }

    if (amount > targetSale.pendingAmount) {
      showToast(`Payment amount cannot exceed the pending balance of ₹${targetSale.pendingAmount}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/sales/${targetSale._id}/payment`, {
        amountPaid: amount,
        paymentMethod,
      });

      showToast(`Collection of ₹${amount.toLocaleString()} recorded!`, 'success');
      setModalOpen(false);
      fetchPendingSales();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Collection logging failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Collections Control</h2>
        <p className="text-sm text-slate-500">View and update pending collections, aging receivables, and installment histories</p>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/20 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Receivables Aging</p>
          <h3 className="mt-2 text-2xl font-black text-rose-600">
            ₹{sales.reduce((acc, s) => acc + s.pendingAmount, 0).toLocaleString()}
          </h3>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Invoices Count</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">{sales.length}</h3>
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading pending invoices...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/55 text-xs font-bold uppercase text-slate-400">
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Customer Details</th>
                  <th className="px-6 py-3.5">Salesman</th>
                  <th className="px-6 py-3.5">Grand Total</th>
                  <th className="px-6 py-3.5 text-rose-600">Pending Amount</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5 text-center">Collection Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {sales.map((s) => {
                  const isOverdue = s.dueDate && new Date(s.dueDate).getTime() < Date.now();
                  return (
                    <tr key={s._id} className="hover:bg-slate-50/30">
                      <td className="px-6 py-4 font-bold text-indigo-600">{s.invoiceNumber}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{s.customerName}</div>
                        {s.customerPhone && <div className="text-xs text-slate-400 font-normal">{s.customerPhone}</div>}
                      </td>
                      <td className="px-6 py-4">{s.salesmanId?.name || 'Salesman'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">₹{s.grandTotal.toLocaleString()}</td>
                      <td className="px-6 py-4 font-black text-rose-600">₹{s.pendingAmount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        {s.dueDate ? (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {isOverdue && <AlertTriangle className="mr-1 h-3 w-3 animate-pulse" />}
                            {new Date(s.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openCollectionModal(s)}
                            className="inline-flex items-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg px-2.5 py-1.5 transition-all shadow-sm"
                          >
                            Record Collection
                          </button>
                          {s.paymentHistory.length > 0 && (
                            <button
                              onClick={() => openHistoryModal(s)}
                              title="Payment Ledger"
                              className="rounded-lg p-1.5 text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100"
                            >
                              <History className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">No pending invoices needing collection</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Collection Modal */}
      {modalOpen && targetSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-indigo-600" /> Record Collection Payment
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCollectionSubmit} className="mt-4 space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-bold text-slate-800">{targetSale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-800">{targetSale.customerName}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Total Invoice Value:</span>
                  <span className="font-bold text-slate-800">₹{targetSale.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm border-t border-slate-200 pt-2 text-rose-600 mt-2">
                  <span>Pending Balance:</span>
                  <span>₹{targetSale.pendingAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI (Google Pay/PhonePe)</option>
                  <option value="BANK">BANK (IMPS/NEFT)</option>
                  <option value="OTHER">OTHER</option>
                </select>
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
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Ledger / History Modal */}
      {historyOpen && historySale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Payment History: {historySale.invoiceNumber}</h3>
              <button
                onClick={() => setHistoryOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-4 max-h-60 overflow-y-auto space-y-3">
              {historySale.paymentHistory.map((history, idx) => (
                <div key={history._id || idx} className="rounded-xl border border-slate-100 p-3 bg-slate-50/50 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">₹{history.amountPaid.toLocaleString()}</p>
                    <p className="text-slate-400 mt-0.5">Recorded: {new Date(history.datePaid).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 font-bold uppercase tracking-wider">
                      {history.paymentMethod}
                    </span>
                    {history.recordedBy && <p className="text-[10px] text-slate-400 mt-1">By: {history.recordedBy.name}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
