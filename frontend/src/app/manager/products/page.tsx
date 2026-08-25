'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  Filter,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'Product Name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU code must be at least 3 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  unit: z.string().min(1, 'Unit descriptor is required'),
  sellingPrice: z.coerce.number().min(0, 'Price must be a positive number'),
  minStockLevel: z.coerce.number().min(0, 'Minimum stock level must be positive'),
  description: z.string().optional().default(''),
  imageUrl: z.string().optional().default(''),
  status: z.enum(['active', 'inactive']).default('active'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductData {
  _id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  sellingPrice: number;
  minStockLevel: number;
  description: string;
  imageUrl: string;
  status: 'active' | 'inactive';
}

export default function ManagerProducts() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'active',
      mainStock: 0,
    },
  });

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      showToast('Failed to load products list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    reset({
      name: '',
      sku: '',
      category: '',
      unit: 'pcs',
      sellingPrice: 0,
      minStockLevel: 10,
      description: '',
      imageUrl: '',
      status: 'active',
      mainStock: 0,
    });
    setModalOpen(true);
  };

  const openEditModal = (product: ProductData) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      sellingPrice: product.sellingPrice,
      minStockLevel: product.minStockLevel,
      description: product.description,
      imageUrl: product.imageUrl,
      status: product.status,
      mainStock: product.mainStock,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: ProductFormValues) => {
    setSubmitting(true);
    try {
      if (editingProduct) {
        // Edit flow (exclude mainStock changes here, mainStock managed in Inventory tab)
        const { mainStock, ...editPayload } = data;
        await api.put(`/products/${editingProduct._id}`, editPayload);
        showToast('Product specifications updated successfully', 'success');
      } else {
        // Create flow
        await api.post('/products', data);
        showToast('Product added to catalog successfully', 'success');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save product.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      showToast('Product removed from catalog', 'success');
      fetchProducts();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete product.', 'error');
    }
  };

  // Filter list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
      
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Products Catalog</h2>
          <p className="text-sm text-slate-500">Define standard catalog items, SKU rates, and safety stock rules</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="mr-1.5 h-5 w-5" /> Add Catalog Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        {/* Search */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search products by SKU, name, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="relative w-full sm:w-48">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading catalog...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/55 text-xs font-bold uppercase text-slate-400">
                  <th className="px-6 py-3.5">SKU / Code</th>
                  <th className="px-6 py-3.5">Product Details</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Selling Price</th>
                  <th className="px-6 py-3.5">Safety Stock</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">{p.sku}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{p.name}</div>
                      {p.description && <div className="text-xs text-slate-400 font-normal">{p.description}</div>}
                    </td>
                    <td className="px-6 py-4">{p.category}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">₹{p.sellingPrice.toLocaleString()} / {p.unit}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${p.mainStock <= p.minStockLevel ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                        <span>{p.mainStock} units (Min: {p.minStockLevel})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit specs"
                          className="rounded-lg p-1.5 text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(p._id)}
                          title="Remove product"
                          className="rounded-lg p-1.5 text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">No products matched current filters</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? `Edit Specifications: ${editingProduct.name}` : 'Register New Company Product'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Product Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABC Shirt"
                    {...register('name')}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    SKU Code / Model ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SH-001"
                    {...register('sku')}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{errors.sku.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shirt"
                    {...register('category')}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.category && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Unit descriptor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. pcs, box"
                    {...register('unit')}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.unit && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{errors.unit.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </label>
                  <select
                    {...register('status')}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{errors.status.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="850"
                    {...register('sellingPrice')}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.sellingPrice && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{errors.sellingPrice.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Minimum Safety Stock
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    {...register('minStockLevel')}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.minStockLevel && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{errors.minStockLevel.message}</p>
                  )}
                </div>
              </div>



              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Cotton shirt details..."
                  {...register('description')}
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
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProduct ? 'Save Specifications' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
