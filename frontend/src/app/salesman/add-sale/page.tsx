'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import {
  ShoppingCart,
  Plus,
  Trash2,
  User,
  ShoppingBag,
  PlusCircle,
  X,
  CreditCard,
  Loader2,
  Calendar,
} from 'lucide-react';

interface CompanyStockItem {
  productId: string;
  name: string;
  sku: string;
  sellingPrice: number;
  quantity: number;
  unit: string;
}

interface SaleLineItem {
  id: string; // Random client ID for tracking
  productType: 'company' | 'extra';
  productId: string | null; // Null for extra products
  productName: string;
  quantity: number;
  price: number;
  total: number;
  maxQuantity?: number; // Safety stock check for company items
}

export default function SalesmanAddSale() {
  const { showToast } = useToast();
  const router = useRouter();

  // Load salesman stock list
  const [stock, setStock] = useState<CompanyStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer Entry
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Invoice Lines
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);

  // Company selection dropdown temp state
  const [selectedCompanyProductId, setSelectedCompanyProductId] = useState('');
  const [companyQuantity, setCompanyQuantity] = useState('1');

  // Extra item input temp state
  const [extraName, setExtraName] = useState('');
  const [extraPrice, setExtraPrice] = useState('');
  const [extraQuantity, setExtraQuantity] = useState('1');
  const [showExtraForm, setShowExtraForm] = useState(false);

  // Billing parameters
  const [discount, setDiscount] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<'COMPLETED' | 'PENDING'>('COMPLETED');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK' | 'OTHER'>('CASH');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStock = async () => {
    try {
      const response = await api.get('/inventory/my-stock');
      setStock(response.data);
      if (response.data.length > 0) {
        setSelectedCompanyProductId(response.data[0].productId);
      }
    } catch (e) {
      showToast('Failed to load available stock catalog.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const addCompanyProduct = () => {
    if (!selectedCompanyProductId) {
      showToast('Please select a product from your stock.', 'error');
      return;
    }

    const item = stock.find((s) => s.productId === selectedCompanyProductId);
    if (!item) return;

    const qty = Number(companyQuantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a positive quantity.', 'error');
      return;
    }

    // Check if product is already in line items
    const existingIndex = lineItems.findIndex(
      (line) => line.productType === 'company' && line.productId === item.productId
    );

    let nextQty = qty;
    if (existingIndex > -1) {
      nextQty += lineItems[existingIndex].quantity;
    }

    // Check stock threshold
    if (item.quantity < nextQty) {
      showToast(
        `Insufficient stock for product "${item.name}". Available quantity: ${item.quantity}`,
        'error'
      );
      return;
    }

    if (existingIndex > -1) {
      // Update quantity
      const updatedLines = [...lineItems];
      updatedLines[existingIndex].quantity = nextQty;
      updatedLines[existingIndex].total = nextQty * item.sellingPrice;
      setLineItems(updatedLines);
    } else {
      // Add new row
      setLineItems((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          productType: 'company',
          productId: item.productId,
          productName: item.name,
          quantity: qty,
          price: item.sellingPrice,
          total: qty * item.sellingPrice,
          maxQuantity: item.quantity,
        },
      ]);
    }

    setCompanyQuantity('1');
    showToast(`Added ${item.name} to sale`, 'success');
  };

  const addExtraProduct = () => {
    if (!extraName) {
      showToast('Please enter extra product name.', 'error');
      return;
    }

    const price = Number(extraPrice);
    if (isNaN(price) || price < 0) {
      showToast('Please enter a valid price.', 'error');
      return;
    }

    const qty = Number(extraQuantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a positive quantity.', 'error');
      return;
    }

    setLineItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        productType: 'extra',
        productId: null,
        productName: extraName,
        quantity: qty,
        price,
        total: qty * price,
      },
    ]);

    // Reset extra form
    setExtraName('');
    setExtraPrice('');
    setExtraQuantity('1');
    setShowExtraForm(false);
    showToast('Extra product added to invoice', 'success');
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((l) => l.id !== id));
  };

  // Calculate totals
  const subtotal = lineItems.reduce((acc, line) => acc + line.total, 0);
  const disc = Number(discount) || 0;
  const grandTotal = Math.max(0, subtotal - disc);

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName) {
      showToast('Customer Name is required.', 'error');
      return;
    }

    if (lineItems.length === 0) {
      showToast('Please add at least one product to the sale.', 'error');
      return;
    }

    if (paymentStatus === 'PENDING' && !dueDate) {
      showToast('Please select a Payment Due Date for pending invoice.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        items: lineItems.map((line) => ({
          productType: line.productType,
          productId: line.productId,
          productName: line.productName,
          quantity: line.quantity,
          price: line.price,
        })),
        discount: disc,
        paymentStatus,
        paymentMethod,
        dueDate: paymentStatus === 'PENDING' ? dueDate : null,
        notes,
      };

      await api.post('/sales', payload);
      showToast('Sale saved successfully!', 'success');
      router.push('/salesman/dashboard');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to place sale.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStockProduct = stock.find((s) => s.productId === selectedCompanyProductId);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Add New Sale</h2>
        <p className="text-sm text-slate-500">Record customer POS orders, deduct catalog inventory, and select billing options</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Product Selection & Customer Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center">
              <User className="mr-1.5 h-5 w-5 text-indigo-600" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. ABC Traders"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Add Company Products Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center">
                <ShoppingBag className="mr-1.5 h-5 w-5 text-indigo-600" /> Add Company Products
              </h3>
              <span className="text-xs font-bold text-slate-400">Deducts personal stock</span>
            </div>

            {loading ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 items-end">
                {/* Product Dropdown */}
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Select Product</label>
                  <select
                    value={selectedCompanyProductId}
                    onChange={(e) => setSelectedCompanyProductId(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {stock.map((item) => (
                      <option key={item.productId} value={item.productId}>
                        {item.name} (SKU: {item.sku} | ₹{item.sellingPrice})
                      </option>
                    ))}
                    {stock.length === 0 && <option value="">No assigned stock available</option>}
                  </select>
                </div>

                {/* Stock details badge */}
                <div className="sm:col-span-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs h-9 flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Stock:</span>
                    <span className="font-black text-slate-850">
                      {selectedStockProduct ? `${selectedStockProduct.quantity} ${selectedStockProduct.unit}` : '0 units'}
                    </span>
                  </div>
                </div>

                {/* Qty Input */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={companyQuantity}
                    onChange={(e) => setCompanyQuantity(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Add trigger */}
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={addCompanyProduct}
                    disabled={stock.length === 0}
                    className="inline-flex w-full h-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Extra Products Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center">
                <PlusCircle className="mr-1.5 h-5 w-5 text-indigo-600" /> Sell Extra Product
              </h3>
              <button
                type="button"
                onClick={() => setShowExtraForm(!showExtraForm)}
                className="text-xs font-bold text-indigo-600 hover:underline focus:outline-none"
              >
                {showExtraForm ? 'Hide form' : 'Open form'}
              </button>
            </div>

            {showExtraForm && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 items-end border-t border-slate-100 pt-4">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Nike Shoes"
                    value={extraName}
                    onChange={(e) => setExtraName(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Price (₹)</label>
                  <input
                    type="number"
                    placeholder="3500"
                    value={extraPrice}
                    onChange={(e) => setExtraPrice(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={extraQuantity}
                    onChange={(e) => setExtraQuantity(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={addExtraProduct}
                    className="inline-flex w-full h-9 items-center justify-center rounded-xl bg-amber-600 text-white hover:bg-amber-500 transition-all shadow-sm"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Invoice Builder & Billing summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md flex flex-col justify-between h-fit">
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center">
              <ShoppingCart className="mr-1.5 h-5 w-5 text-indigo-600" /> Invoice Builder
            </h3>

            {/* List of currently added items */}
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {lineItems.map((line) => (
                <div key={line.id} className="py-3.5 flex items-center justify-between text-sm">
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-slate-800 truncate">{line.productName}</p>
                    <p className="text-xs text-slate-400 flex items-center mt-0.5">
                      <span className={`inline-flex rounded px-1 text-[9px] font-bold mr-1.5 uppercase ${
                        line.productType === 'company' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {line.productType === 'company' ? 'Company' : 'Extra'}
                      </span>
                      {line.quantity} × ₹{line.price}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="font-black text-slate-900 text-xs">₹{line.total.toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => removeLineItem(line.id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {lineItems.length === 0 && (
                <p className="text-slate-400 text-xs text-center py-8">Invoice is currently empty. Add products.</p>
              )}
            </div>

            {/* Billing parameters */}
            <div className="space-y-4 pt-6 border-t border-slate-200 text-xs font-semibold text-slate-600">
              <div className="flex justify-between font-medium">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">₹{subtotal.toLocaleString()}</span>
              </div>

              {/* Discount Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Discount Offered (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-between text-sm border-t border-slate-200 pt-3 text-slate-800 font-bold">
                <span>Grand Total:</span>
                <span className="font-black text-indigo-650 text-base">₹{grandTotal.toLocaleString()}</span>
              </div>

              {/* Payment selection */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-850 bg-white focus:outline-none"
                  >
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-850 bg-white focus:outline-none"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK">BANK</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              {/* Due Date if PENDING */}
              {paymentStatus === 'PENDING' && (
                <div className="animate-in slide-in-from-top-2 duration-150">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Due Date *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-850 focus:outline-none"
                    required
                  />
                </div>
              )}

              {/* Invoice notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Invoice Notes</label>
                <textarea
                  rows={2}
                  placeholder="Delivery terms, balance terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-850 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSaveSale}
              disabled={submitting || lineItems.length === 0 || !customerName}
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ShoppingCart className="mr-1.5 h-4 w-4" />
              )}
              SAVE SALE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
