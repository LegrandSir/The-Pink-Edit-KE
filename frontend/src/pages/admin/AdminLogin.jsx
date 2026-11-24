import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast();

  const finishAdminAuth = (data, toastMsg) => {
    localStorage.setItem('adminToken', data.access_token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    showToast(toastMsg || `Welcome back, ${data.user?.first_name || 'Admin'}`);
    navigate('/admin/dashboard', { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { ok, data } = await apiFetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (ok) {
        finishAdminAuth(data);
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch {
      setError('Unable to connect to the server. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setIsDemoLoading(true);
    setError('');

    try {
      const { ok, data } = await apiFetch('/api/admin/demo-login', {
        method: 'POST',
      });
      if (ok) {
        finishAdminAuth(data, 'Signed into Admin Command Center (Demo SuperAdmin)');
      } else {
        setError(data.error || 'Demo login failed. Verify backend deployment.');
        setIsDemoLoading(false);
      }
    } catch {
      setError('Unable to connect to the server. Please try again.');
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-[#141414] flex flex-col lg:flex-row">
      {/* LEFT OBSIDIAN COMMAND PANEL */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#141414] text-[#FAF8F6] p-14 flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#C86D85]/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-[#E8B4BC]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-stone-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> View Live Storefront
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/15 bg-white/5 text-[10px] uppercase tracking-[0.26em] text-[#E8B4BC] mb-6">
            <ShieldCheck className="w-3.5 h-3.5" /> Merchant Command Center
          </div>
          <h2 className="text-5xl font-serif leading-[1.08] mb-5">
            Run every atelier <span className="italic text-[#F3CFD6]">operation</span> from one console.
          </h2>
          <p className="text-sm text-stone-400 font-light leading-relaxed">
            Monitor 14-day revenue trends, manage multi-variant SKU inventory, dispatch Nairobi orders, and configure M-Pesa Express settings in real time.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[0.2em] text-stone-400">
          <div>
            <p className="text-white font-serif text-lg normal-case tracking-normal">RBAC</p>
            <p className="mt-0.5">JWT Admin Guard</p>
          </div>
          <div>
            <p className="text-white font-serif text-lg normal-case tracking-normal">Neon</p>
            <p className="mt-0.5">Live Postgres</p>
          </div>
          <div>
            <p className="text-white font-serif text-lg normal-case tracking-normal">M-Pesa</p>
            <p className="mt-0.5">Daraja Ready</p>
          </div>
        </div>
      </div>

      {/* RIGHT LOGIN FORM */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-[440px]">
          <Link
            to="/"
            className="lg:hidden inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-stone-500 hover:text-[#141414] mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-8">
              <p className="text-3xl font-serif tracking-[0.14em] text-[#141414]">
                THE PINK EDIT
              </p>
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#C86D85] font-semibold mt-1">
                Administrative Portal
              </p>
            </div>

            {/* ONE-CLICK PORTFOLIO DEMO ADMIN BUTTON */}
            <div className="mb-7 p-4 bg-white border border-stone-200 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#141414] flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#C86D85]" /> Recruiter / Portfolio Access
              </p>
              <p className="text-[11px] text-stone-500 mb-3">
                Explore the full dashboard, inventory CRUD, and order fulfillment with one click.
              </p>
              <button
                type="button"
                onClick={handleDemoAdminLogin}
                disabled={isDemoLoading || isLoading}
                className="w-full py-3 px-4 bg-[#141414] hover:bg-[#C86D85] text-white text-[11px] font-semibold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {isDemoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[#E8B4BC]" />
                )}
                {isDemoLoading ? 'Authenticating...' : 'One-Click Demo Admin Login'}
              </button>
              <p className="text-[10px] text-stone-400 font-mono text-center mt-2">
                admin@thepinkedit.com · Admin123!
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@thepinkedit.com"
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-stone-200 text-sm focus:border-[#141414] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-stone-200 text-sm focus:border-[#141414] outline-none transition-colors tracking-widest"
                  />
                </div>
              </div>

              <button
                disabled={isLoading || isDemoLoading}
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-[#C86D85] hover:bg-[#B25A71] text-white text-xs font-semibold uppercase tracking-[0.22em] transition-colors disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In to Console'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-stone-200 flex justify-between items-center text-[11px] text-stone-500">
              <span>Role-protected merchant console</span>
              <Link
                to="/login"
                className="text-[#141414] font-semibold underline hover:text-[#C86D85]"
              >
                Customer Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}