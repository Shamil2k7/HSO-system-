'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Loader2,
  ShieldCheck,
  User,
  Power,
} from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'SALESMAN', 'SALESMANAGER', 'WAREHOUSEMANAGER', 'CASHIER']),
  status: z.enum(['active', 'inactive']).default('active'),
  password: z.string().optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SALESMAN' | 'SALESMANAGER' | 'WAREHOUSEMANAGER' | 'CASHIER';
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'SALESMAN',
      status: 'active',
    },
  });

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      showToast('Failed to load user list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      role: 'SALESMAN',
      status: 'active',
      password: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: '', // blank password unless changing
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: UserFormValues) => {
    // If creating, password is required
    if (!editingUser && !data.password) {
      showToast('Password is required for new users', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        // Edit flow
        const payload: any = { ...data };
        if (!payload.password) delete payload.password; // don't send empty password
        
        await api.put(`/users/${editingUser._id}`, payload);
        showToast('User profile updated successfully', 'success');
      } else {
        // Create flow
        await api.post('/users', data);
        showToast('User created successfully', 'success');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save user.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user: UserData) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/users/${user._id}`, { status: nextStatus });
      showToast(`User marked as ${nextStatus}`, 'success');
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update user status.', 'error');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      showToast('User deleted successfully', 'success');
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">Create, edit, and manage login authorization for Managers and Salesmen</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add New User
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading user catalog...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/55 text-xs font-bold uppercase text-slate-400">
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'MANAGER'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2.5">
                        <button
                          onClick={() => toggleStatus(u)}
                          title={u.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                          className={`rounded-lg p-1.5 border transition-all ${
                            u.status === 'active'
                              ? 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100'
                              : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit Profile"
                          className="rounded-lg p-1.5 text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(u._id)}
                          title="Delete User"
                          className="rounded-lg p-1.5 text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">No users registered in the system</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingUser ? `Edit User: ${editingUser.name}` : 'Create New System User'}
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register('name')}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.name && (
                  <p className="mt-1 text-xs font-semibold text-rose-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  {...register('email')}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.email && (
                  <p className="mt-1 text-xs font-semibold text-rose-500">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    System Role
                  </label>
                  <select
                    {...register('role')}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SALESMAN">Salesman</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SALESMANAGER">Sales Manager</option>
                    <option value="WAREHOUSEMANAGER">Warehouse Manager</option>
                    <option value="CASHIER">Cashier</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{errors.role.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Account Status
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password {editingUser && <span className="text-slate-400 normal-case">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.password && (
                  <p className="mt-1 text-xs font-semibold text-rose-500">{errors.password.message}</p>
                )}
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
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
