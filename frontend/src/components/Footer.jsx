import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      const { ok, data } = await apiFetch('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (ok) {
        showToast(data.message || 'Subscribed to The Edit.');
        setEmail('');
      } else {
        showToast(data.error || 'Could not subscribe right now.', 'error');
      }
    } catch {
      showToast('Unable to reach server. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#141414] text-[#FAF8F6] pt-20 pb-10 px-6 lg:px-12 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-stone-800">
        {/* Newsletter & Brand */}
        <div className="lg:col-span-5">
          <p className="text-2xl font-serif tracking-[0.16em] text-white">THE PINK EDIT</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#E8B4BC] mt-1 mb-6">
            Nairobi Luxury Atelier
          </p>
          <p className="text-stone-400 text-sm font-light leading-relaxed mb-6 max-w-md">
            Subscribe to receive private collection previews, olfactory journal essays, and invitations to Nairobi salon pop-ups.
          </p>
          <form onSubmit={handleSubscribe} className="flex border-b border-stone-700 focus-within:border-[#E8B4BC] transition-colors pb-2.5 max-w-md">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="bg-transparent outline-none flex-1 text-sm text-white placeholder-stone-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="uppercase tracking-[0.2em] text-[11px] font-semibold text-[#E8B4BC] hover:text-white transition-colors inline-flex items-center gap-1.5 pl-4"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Join <ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </form>
        </div>

        {/* Shop Links */}
        <div className="lg:col-span-2 lg:col-start-7">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400 mb-5">
            Collections
          </h4>
          <ul className="space-y-3 text-sm text-stone-300 font-light">
            <li><Link to="/shop" className="hover:text-[#E8B4BC] transition-colors">Shop All</Link></li>
            <li><Link to="/shop?category=Perfumes" className="hover:text-[#E8B4BC] transition-colors">Artisanal Perfumes</Link></li>
            <li><Link to="/shop?category=Fine%20Jewellery" className="hover:text-[#E8B4BC] transition-colors">Fine Jewellery</Link></li>
            <li><Link to="/shop?category=Home%20Fragrance" className="hover:text-[#E8B4BC] transition-colors">Home Fragrance</Link></li>
          </ul>
        </div>

        {/* Client Care */}
        <div className="lg:col-span-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400 mb-5">
            Client Care
          </h4>
          <ul className="space-y-3 text-sm text-stone-300 font-light">
            <li><Link to="/login" className="hover:text-[#E8B4BC] transition-colors">Customer Portal</Link></li>
            <li><Link to="/account" className="hover:text-[#E8B4BC] transition-colors">Order Tracking</Link></li>
            <li><Link to="/admin" className="hover:text-[#E8B4BC] transition-colors">Admin Command Center</Link></li>
            <li><a href="mailto:concierge@thepinkedit.com" className="hover:text-[#E8B4BC] transition-colors">Concierge Support</a></li>
          </ul>
        </div>

        {/* Atelier Info */}
        <div className="lg:col-span-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400 mb-5">
            Nairobi Salon
          </h4>
          <p className="text-sm text-stone-300 font-light leading-relaxed">
            14 Riverside Drive<br />
            Westlands, Nairobi<br />
            Mon–Sat · 9am–7pm EAT
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center pt-8 text-[10px] tracking-[0.2em] uppercase text-stone-500 gap-4">
        <p>© 2026 THE PINK EDIT KE. CRAFTED IN NAIROBI.</p>
        <div className="flex gap-6">
          <span>M-PESA EXPRESS</span>
          <span>•</span>
          <span>REACT + FLASK + NEON POSTGRES</span>
        </div>
      </div>
    </footer>
  );
}