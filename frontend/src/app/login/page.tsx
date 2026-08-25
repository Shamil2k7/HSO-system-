'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TrendingUp, Lock, Mail, Loader2, KeyRound } from 'lucide-react';

const loginSchema = z.object({
  mobile: z.string().min(1, 'Please enter your mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      await login(data.mobile, data.password);
      showToast('Logged in successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (mobile: string) => {
    setValue('mobile', mobile);
    setValue('password', 'password123');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
        {/* Branding Head */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">Home Shop</h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sign in to manage inventory and sales pipeline
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="mobile" className="block text-sm font-semibold text-slate-300">
                Mobile Number
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="mobile"
                  type="text"
                  placeholder="e.g. 9999999999"
                  {...register('mobile')}
                  className={`block w-full rounded-xl border bg-slate-700/50 pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm ${
                    errors.mobile ? 'border-rose-500' : 'border-slate-600'
                  }`}
                />
              </div>
              {errors.mobile && (
                <p className="mt-1 text-xs font-semibold text-rose-400">{errors.mobile.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`block w-full rounded-xl border bg-slate-700/50 pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm ${
                    errors.password ? 'border-rose-500' : 'border-slate-600'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-semibold text-rose-400">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Demo Credentials Sandbox Card */}
        <div className="mt-6 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
          <div className="flex items-center space-x-2 text-indigo-400 mb-3">
            <KeyRound className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Demo User Account</h3>
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fillCredentials('9999999999')}
              className="w-full rounded-lg bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-700 hover:border-indigo-500 hover:text-white transition-all text-center"
            >
              Auto-fill Admin Credentials
            </button>
          </div>
          <p className="mt-3 text-[10px] text-center text-slate-500">
            Default Password: <code className="text-indigo-400 font-mono">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
