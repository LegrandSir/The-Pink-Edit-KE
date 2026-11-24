import React, { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Store,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { CartContext } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function PortfolioDemoBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingRole, setLoadingRole] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { syncCartWithServer, syncWishlist } = useContext(CartContext);
  const { showToast } = useToast();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isCustomerSignedIn = Boolean(localStorage.getItem('userToken'));
  const isAdminSignedIn = Boolean(localStorage.getItem('adminToken'));

  const currentMode = isAdminRoute
    ? isAdminSignedIn
      ? 'Admin Mode'
      : 'Admin Login'
    : isCustomerSignedIn
    ? 'VIP Customer'
    : 'Guest Shopper';

  const switchToStorefront = () => {
    setIsExpanded(false);
    navigate('/shop');
  };

  const switchToDemoCustomer = async () => {
    setLoadingRole('customer');
    try {
      const { ok, data } = await apiFetch('/api/auth/demo-customer', { method: 'POST' });
      if (ok && data.access_token) {
        localStorage.setItem('userToken', data.access_token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        await Promise.all([syncCartWithServer(), syncWishlist()]);
        showToast('Switched to VIP Demo Customer (Amara Wanjiku)');
        setIsExpanded(false);
        navigate('/account');
      } else {
        showToast(data.error || 'Could not start customer demo', 'error');
      }
    } catch {
      showToast('Server is waking up—please try again in a moment.', 'error');
    } finally {
      setLoadingRole(null);
    }
  };

  const switchToDemoAdmin = async () => {
    setLoadingRole('admin');
    try {
      const { ok, data } = await apiFetch('/api/admin/demo-login', { method: 'POST' });
      if (ok && data.access_token) {
        localStorage.setItem('adminToken', data.access_token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        showToast('Switched to Merchant Admin Console');
        setIsExpanded(false);
        navigate('/admin/dashboard');
      } else {
        showToast(data.error || 'Could not start admin demo', 'error');
      }
    } catch {
      showToast('Server is waking up—please try again in a moment.', 'error');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[75] font-sans">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="w-72 bg-[#141414] text-[#FAF8F6] border border-stone-800 shadow-2xl p-4"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#E8B4BC]" />
                <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#E8B4BC]">
                  Portfolio Demo Switcher
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-stone-400 hover:text-white p-0.5"
                aria-label="Collapse demo switcher"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-stone-400 leading-relaxed mb-3.5">
              Jump directly into any role with live Neon Postgres data—no signup required.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={switchToStorefront}
                disabled={Boolean(loadingRole)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Store className="w-3.5 h-3.5 text-[#E8B4BC]" />
                  <span>Browse Storefront</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-stone-400">/shop</span>
              </button>

              <button
                type="button"
                onClick={switchToDemoCustomer}
                disabled={Boolean(loadingRole)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors disabled:opacity-60"
              >
                <span className="flex items-center gap-2.5">
                  {loadingRole === 'customer' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8B4BC]" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-[#E8B4BC]" />
                  )}
                  <span>VIP Customer Portal</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-stone-400">1-Click</span>
              </button>

              <button
                type="button"
                onClick={switchToDemoAdmin}
                disabled={Boolean(loadingRole)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#C86D85] hover:bg-[#B25A71] text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                <span className="flex items-center gap-2.5">
                  {loadingRole === 'admin' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Admin Command Center</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-white/80">1-Click</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            type="button"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#141414]/95 hover:bg-[#C86D85] text-[#FAF8F6] border border-white/15 shadow-xl backdrop-blur-md transition-colors text-[10px] uppercase tracking-[0.2em] font-semibold"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Demo · {currentMode}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}