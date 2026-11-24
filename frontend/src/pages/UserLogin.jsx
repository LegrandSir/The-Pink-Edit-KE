import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../lib/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { syncCartWithServer } = useContext(CartContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { ok, data } = await apiFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone_number: phone || undefined,
          password,
        }),
      });

      if (ok && data.access_token) {
        localStorage.setItem('userToken', data.access_token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        await syncCartWithServer();
        showToast(`Welcome to The Pink Edit, ${data.user?.first_name || name}!`);
        navigate('/account', { replace: true });
      } else if (ok) {
        navigate('/login', {
          state: { message: 'Account created! Please sign in to continue.' },
        });
      } else {
        setError(data.error || 'Failed to create account.');
        setIsLoading(false);
      }
    } catch {
      setError('Unable to connect to the server. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-[#141414] flex flex-col lg:flex-row">
      {/* LEFT EDITORIAL PANEL */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#141414] text-[#FAF8F6] p-14 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1000&auto=format&fit=crop"
            alt="The Pink Edit Fine Jewellery"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/70 to-[#141414]/40" />
        </div>

        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-stone-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Storefront
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#E8B4BC] font-semibold mb-3">
            Join the Maison
          </p>
          <h2 className="text-5xl font-serif leading-[1.08] mb-5">
            Unlock private previews &amp; <span className="italic text-[#F3CFD6]">effortless checkout.</span>
          </h2>
          <p className="text-sm text-stone-300 font-light leading-relaxed">
            Save your favorite fragrances, store your Nairobi delivery address, and earn VIP concierge access as your collection grows.
          </p>
        </div>

        <div className="relative z-10 text-[10px] uppercase tracking-[0.22em] text-stone-400 border-t border-white/15 pt-6">
          Complimentary gift wrapping on every order
        </div>
      </div>

      {/* RIGHT REGISTER FORM */}
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
              <Link to="/" className="inline-block">
                <h1 className="text-3xl font-serif tracking-[0.14em] text-[#141414]">
                  THE PINK EDIT
                </h1>
              </Link>
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#C86D85] font-semibold mt-1">
                Create Your Client Account
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Amara Wanjiku"
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-stone-200 text-sm focus:border-[#141414] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-stone-200 text-sm focus:border-[#141414] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
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
                    minLength="6"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-stone-200 text-sm focus:border-[#141414] outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="w-full mt-2 flex justify-center items-center gap-2 py-3.5 px-4 bg-[#141414] hover:bg-[#C86D85] text-white text-xs font-semibold uppercase tracking-[0.22em] transition-colors disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-stone-200 text-center text-[11px] text-stone-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#141414] font-semibold underline hover:text-[#C86D85]">
                Sign in or use Demo Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}