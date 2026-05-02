import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, X, Menu, ChevronDown } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { toggleCart, cartItems } = useContext(CartContext);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate('/shop'); 
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav className="flex justify-between items-center px-6 lg:px-12 py-4 lg:py-6 bg-white sticky top-0 z-50 shadow-sm relative">
        
        {/* LEFT COLUMN: Mobile Hamburger OR Desktop Links */}
        <div className="flex-1 flex items-center">
          {/* Mobile Menu Icon */}
          <button className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6 text-gray-900" />
          </button>

          {/* Desktop Links */}
          <div className="hidden lg:flex gap-8 text-sm uppercase tracking-wider text-gray-600 items-center">
            <Link to="/" className="hover:text-pink-500 transition-colors">Journal</Link>
            <Link to="/shop" className="hover:text-pink-500 font-bold transition-colors">Shop</Link>
            
            {/* Desktop Collections Dropdown */}
            <div 
              className="relative py-4" 
              onMouseEnter={() => setIsDropdownOpen(true)} 
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 hover:text-pink-500 transition-colors uppercase tracking-wider">
                Collections <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 w-48 bg-white shadow-xl border border-gray-100 py-4 flex flex-col z-50"
                  >
                    <Link to="/shop?category=Perfumes" className="px-6 py-2 text-sm text-gray-600 hover:text-pink-500 hover:bg-pink-50 transition-colors">
                      Perfumes
                    </Link>
                    <Link to="/shop?category=Fine%20Jewellery" className="px-6 py-2 text-sm text-gray-600 hover:text-pink-500 hover:bg-pink-50 transition-colors">
                      Fine Jewellery
                    </Link>
                    <Link to="/shop?category=Home%20Fragrance" className="px-6 py-2 text-sm text-gray-600 hover:text-pink-500 hover:bg-pink-50 transition-colors">
          Home Fragrance
        </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* CENTER COLUMN: Logo */}
        <div className="flex-shrink-0 text-center">
          <Link to="/" className="text-2xl lg:text-3xl font-serif text-pink-400 tracking-widest hover:opacity-80 transition-opacity">
            ✧ The Pink Edit
          </Link>
        </div>
        
        {/* RIGHT COLUMN: Icons */}
        <div className="flex-1 flex justify-end gap-5 lg:gap-6 text-gray-600 items-center">
          <Search onClick={() => setIsSearchOpen(true)} className="w-5 h-5 cursor-pointer hover:text-pink-500 transition-colors" />
          
          <Link to={localStorage.getItem('userToken') ? "/account" : "/login"}>
            <User className="w-5 h-5 cursor-pointer hover:text-pink-500 transition-colors" />
          </Link>
          
          <div className="relative cursor-pointer group" onClick={toggleCart}>
            <ShoppingBag className="w-5 h-5 group-hover:text-pink-500 transition-colors" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartItems.reduce((total, item) => total + item.qty, 0)}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 bg-white z-[100] flex flex-col lg:hidden"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <span className="text-xl font-serif text-pink-400 tracking-widest">✧ The Pink Edit</span>
              <button onClick={closeMobileMenu} className="text-gray-400 hover:text-pink-500">
                <X className="w-7 h-7" />
              </button>
            </div>
            
            <div className="flex flex-col px-6 py-8 space-y-6 overflow-y-auto">
              <Link to="/shop" onClick={closeMobileMenu} className="text-2xl font-serif text-gray-900">Shop All</Link>
              <Link to="/" onClick={closeMobileMenu} className="text-2xl font-serif text-gray-900">Journal</Link>
              
              <div className="pt-6 border-t border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500 mb-6">Collections</p>
                <div className="flex flex-col space-y-5 pl-4 border-l border-pink-100">
                  <Link to="/shop?category=Perfumes" onClick={closeMobileMenu} className="text-lg font-serif text-gray-700">Perfumes</Link>
                  <Link to="/shop?category=Fine%20Jewellery" onClick={closeMobileMenu} className="text-lg font-serif text-gray-700">Fine Jewellery</Link>
                  <Link to="/shop?category=Home%20Fragrance" onClick={closeMobileMenu} className="text-lg font-serif text-gray-700">Home Fragrance</Link>
                </div>
              </div>
            </div>
            
            {/* Mobile Menu Footer Element */}
            <div className="mt-auto px-6 py-8 bg-[#faf8f8] border-t border-gray-100">
              <Link to={localStorage.getItem('userToken') ? "/account" : "/login"} onClick={closeMobileMenu} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-900">
                <User className="w-5 h-5 text-pink-500" /> 
                {localStorage.getItem('userToken') ? "My Account" : "Sign In / Register"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCH OVERLAY (Unchanged, already responsive!) */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 w-full bg-white z-[100] shadow-xl border-b border-gray-200 py-8 lg:py-12 px-6 lg:px-12 flex justify-center"
          >
            <button onClick={() => setIsSearchOpen(false)} className="absolute top-6 right-6 lg:top-8 lg:right-12 text-gray-400 hover:text-pink-500 transition-colors">
              <X className="w-6 h-6 lg:w-8 lg:h-8" />
            </button>
            <div className="max-w-3xl w-full text-center mt-6 lg:mt-0">
              <span className="text-pink-500 text-[10px] lg:text-xs font-bold tracking-widest uppercase mb-4 block">What are you looking for?</span>
              <form onSubmit={handleSearchSubmit} className="relative mt-6 lg:mt-8">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search perfumes, jewellery..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-2xl lg:text-4xl font-serif border-b-2 border-gray-200 pb-3 lg:pb-4 outline-none focus:border-pink-500 text-center text-gray-900 placeholder-gray-300 bg-transparent transition-colors"
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}