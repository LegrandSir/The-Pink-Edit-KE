import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  User,
  ShoppingBag,
  X,
  Menu,
  ChevronDown,
  ShieldCheck,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { toggleCart, cartCount, wishlistIds } = useContext(CartContext);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = Boolean(localStorage.getItem('userToken'));
  const isAdminLoggedIn = Boolean(localStorage.getItem('adminToken'));

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setIsSearchOpen(false);
    if (trimmed) {
      navigate(`/shop?search=${encodeURIComponent(trimmed)}`);
      setSearchQuery('');
    } else {
      navigate('/shop');
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#141414] text-[#FAF8F6] text-[10px] sm:text-[11px] tracking-[0.18em] uppercase px-4 py-2.5 flex items-center justify-between lg:justify-center relative z-50">
        <p className="truncate pr-3">
          Complimentary Nairobi Express Delivery on Orders Above Ksh 25,000
        </p>
        <Link
          to={isAdminLoggedIn ? '/admin/dashboard' : '/admin'}
          className="lg:absolute lg:right-8 inline-flex items-center gap-1.5 text-[#E8B4BC] hover:text-white transition-colors shrink-0 font-semibold"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Demo</span>
        </Link>
      </div>

      {/* MAIN NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-[#FAF8F6]/90 backdrop-blur-md border-b border-stone-200/80 px-5 lg:px-12 h-20 flex items-center justify-between transition-colors">
        {/* LEFT COLUMN */}
        <div className="flex-1 flex items-center">
          <button
            className="lg:hidden p-1.5 -ml-1.5 text-[#141414] hover:text-[#C86D85] transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 stroke-[1.5]" />
          </button>

          <div className="hidden lg:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] text-stone-600 font-medium">
            <Link
              to="/shop"
              className={`hover:text-[#141414] transition-colors ${
                location.pathname === '/shop' ? 'text-[#141414] font-semibold' : ''
              }`}
            >
              Shop All
            </Link>

            <div
              className="relative py-5"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 hover:text-[#141414] transition-colors uppercase tracking-[0.2em]">
                Collections <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full left-0 w-60 bg-white shadow-xl border border-stone-200/80 py-3 flex flex-col z-50"
                  >
                    {[
                      { label: 'Artisanal Perfumes', sub: 'Extrait & Eau de Parfum', cat: 'Perfumes' },
                      { label: 'Fine Jewellery', sub: '18k Gold & Freshwater Pearls', cat: 'Fine Jewellery' },
                      { label: 'Home Fragrance', sub: 'Hand-Poured Atelier Candles', cat: 'Home Fragrance' },
                    ].map((entry) => (
                      <Link
                        key={entry.cat}
                        to={`/shop?category=${encodeURIComponent(entry.cat)}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-5 py-3 hover:bg-[#FAF8F6] transition-colors group"
                      >
                        <p className="text-xs font-medium tracking-wider text-[#141414] group-hover:text-[#C86D85] transition-colors">
                          {entry.label}
                        </p>
                        <p className="text-[10px] tracking-normal normal-case text-stone-400 mt-0.5">
                          {entry.sub}
                        </p>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a
              href="/#atelier"
              className="hover:text-[#141414] transition-colors"
            >
              Our Story
            </a>
          </div>
        </div>

        {/* CENTER COLUMN: BRAND WORDMARK */}
        <div className="shrink-0 text-center">
          <Link
            to="/"
            className="inline-flex flex-col items-center group"
          >
            <span className="text-2xl lg:text-[28px] font-serif text-[#141414] tracking-[0.14em] leading-none group-hover:text-[#C86D85] transition-colors">
              THE PINK EDIT
            </span>
            <span className="text-[9px] uppercase tracking-[0.35em] text-[#C86D85] mt-1 font-medium">
              Nairobi Atelier
            </span>
          </Link>
        </div>

        {/* RIGHT COLUMN: ICONS */}
        <div className="flex-1 flex justify-end items-center gap-4 sm:gap-6 text-[#141414]">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hover:text-[#C86D85] transition-colors p-1"
            aria-label="Search collection"
          >
            <Search className="w-[19px] h-[19px] stroke-[1.6]" />
          </button>

          <Link
            to={isLoggedIn ? '/account?tab=wishlist' : '/login'}
            className="relative hidden sm:inline-flex hover:text-[#C86D85] transition-colors p-1"
            aria-label="Wishlist"
          >
            <Heart className="w-[19px] h-[19px] stroke-[1.6]" />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-0.5 -right-1 bg-[#C86D85] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          <Link
            to={isLoggedIn ? '/account' : '/login'}
            className="relative hover:text-[#C86D85] transition-colors p-1"
            aria-label="Account"
          >
            <User className="w-[19px] h-[19px] stroke-[1.6]" />
            {isLoggedIn && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#FAF8F6]" />
            )}
          </Link>

          <button
            onClick={toggleCart}
            className="relative group hover:text-[#C86D85] transition-colors p-1 flex items-center gap-1.5"
            aria-label="Shopping bag"
          >
            <ShoppingBag className="w-[19px] h-[19px] stroke-[1.6]" />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                className="bg-[#141414] group-hover:bg-[#C86D85] transition-colors text-white text-[9px] font-bold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 h-full w-[86%] max-w-sm bg-[#FAF8F6] z-[100] flex flex-col lg:hidden shadow-2xl"
            >
              <div className="flex justify-between items-center px-6 h-20 border-b border-stone-200">
                <div>
                  <span className="text-xl font-serif tracking-[0.14em] text-[#141414] block leading-none">
                    THE PINK EDIT
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[#C86D85]">
                    Nairobi Atelier
                  </span>
                </div>
                <button onClick={closeMobileMenu} className="text-stone-500 hover:text-[#141414]">
                  <X className="w-6 h-6 stroke-[1.5]" />
                </button>
              </div>

              <div className="flex flex-col px-6 py-8 space-y-6 overflow-y-auto flex-1">
                <Link
                  to="/shop"
                  onClick={closeMobileMenu}
                  className="text-2xl font-serif text-[#141414] flex justify-between items-center"
                >
                  Shop All <ArrowRight className="w-4 h-4 text-stone-400" />
                </Link>
                <a
                  href="/#atelier"
                  onClick={closeMobileMenu}
                  className="text-2xl font-serif text-[#141414] flex justify-between items-center"
                >
                  Our Story <ArrowRight className="w-4 h-4 text-stone-400" />
                </a>

                <div className="pt-6 border-t border-stone-200">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C86D85] mb-5">
                    Curated Departments
                  </p>
                  <div className="flex flex-col space-y-4 pl-4 border-l border-[#C86D85]/30">
                    {['Perfumes', 'Fine Jewellery', 'Home Fragrance'].map((cat) => (
                      <Link
                        key={cat}
                        to={`/shop?category=${encodeURIComponent(cat)}`}
                        onClick={closeMobileMenu}
                        className="text-lg font-serif text-stone-700 hover:text-[#C86D85]"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-stone-200 space-y-3">
                <Link
                  to={isLoggedIn ? '/account' : '/login'}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#141414] py-2"
                >
                  <User className="w-4 h-4 text-[#C86D85]" />
                  {isLoggedIn ? 'My Account & Orders' : 'Sign In / Demo Login'}
                </Link>
                <Link
                  to={isAdminLoggedIn ? '/admin/dashboard' : '/admin'}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 hover:text-[#141414] py-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C86D85]" />
                  Admin Command Center
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SEARCH OVERLAY */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.25 }}
              className="fixed top-0 left-0 w-full bg-[#FAF8F6] z-[100] shadow-2xl border-b border-stone-200 py-10 lg:py-14 px-6 lg:px-12 flex justify-center"
            >
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute top-6 right-6 lg:top-8 lg:right-12 text-stone-400 hover:text-[#141414] transition-colors"
                aria-label="Close search"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="max-w-2xl w-full text-center mt-4 lg:mt-0">
                <span className="text-[#C86D85] text-[10px] font-semibold tracking-[0.25em] uppercase block">
                  Search the Atelier
                </span>
                <form onSubmit={handleSearchSubmit} className="relative mt-6">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Rose Nocturne, 18k gold, oud candle..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-2xl lg:text-4xl font-serif border-b border-stone-300 pb-4 outline-none focus:border-[#141414] text-center text-[#141414] placeholder-stone-300 bg-transparent transition-colors"
                  />
                </form>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {['Rose', 'Oud', 'Pearl', 'Gold', 'Candle'].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(`/shop?search=${encodeURIComponent(term)}`);
                      }}
                      className="px-3.5 py-1.5 text-[10px] uppercase tracking-[0.18em] border border-stone-200 bg-white hover:border-[#141414] text-stone-600 hover:text-[#141414] transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}