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
  User,
  Power,
} from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(1, 'Please enter a valid mobile number'),
  role: z.literal('SALESMAN'),
  status: z.enum(['active', 'inactive']),
  password: z.string().optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserData {
  _id: string;
  name: string;
  mobile: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function ManagerUsers() {
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
      // Managers can only view/manage HOS users (role === SALESMAN)
      const salesmenOnly = response.data.filter((u: any) => u.role === 'SALESMAN');
      setUsers(salesmenOnly);
    } catch (error) {
      showToast('Failed to load HOS user list.', 'error');
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
      mobile: '',
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
      mobile: user.mobile,
      role: 'SALESMAN',
      status: user.status,
      password: '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: UserFormValues) => {
    if (!editingUser && !data.password) {
      showToast('Password is required for new HOS users', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: any = { ...data };
        if (!payload.password) delete payload.password;
        
        await api.put(`/users/${editingUser._id}`, payload);
        showToast('HOS user profile updated successfully', 'success');
      } else {
        await api.post('/users', data);
        showToast('HOS user created successfully', 'success');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save HOS user.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user: UserData) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/users/${user._id}`, { status: nextStatus });
      showToast(`HOS user marked as ${nextStatus}`, 'success');
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update user status.', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this HOS user? This action is permanent.')) return;
    try {
      await api.delete(`/users/${id}`);
      showToast('HOS user deleted successfully', 'success');
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete HOS user.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">HOS User Management</h2>
          <p className="text-sm text-slate-500">Register and manage Home Shop HOS (Salesmen) profiles in the system</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all font-sans"
        >
          <UserPlus className="mr-1.5 h-5 w-5" /> Add HOS User
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-2 text-xs font-semibold text-slate-500">Loading user catalog...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/55 text-xs font-bold uppercase text-slate-400">
                  <th className="px-6 py-3.5">User Details</th>
                  <th className="px-6 py-3.5">Mobile Number</th>
                  <th className="px-6 py-3.5">System Role</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4 font-bold text-slate-800">{user.name}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{user.mobile}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        HOS
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2.5">
                        <button
                          onClick={() => openEditModal(user)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          title="Edit user details"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(user)}
                          className={`rounded-lg p-1.5 transition-colors ${
                            user.status === 'active'
                              ? 'text-slate-400 hover:bg-slate-100 hover:text-rose-600'
                              : 'text-slate-400 hover:bg-slate-100 hover:text-emerald-600'
                          }`}
                          title={user.status === 'active' ? 'Suspend user account' : 'Activate user account'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                          title="Delete user account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">No HOS profiles registered in system</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingUser ? `Edit HOS: ${editingUser.name}` : 'Register New HOS User'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  {...register('name')}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-xs font-semibold text-rose-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Mobile Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 7777777777"
                  {...register('mobile')}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {errors.mobile && (
                  <p className="mt-1 text-xs font-semibold text-rose-500">{errors.mobile.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  {editingUser ? 'Password (Leave blank to keep unchanged)' : 'Account Password *'}
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Account Status</label>
                <select
                  {...register('status')}
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
