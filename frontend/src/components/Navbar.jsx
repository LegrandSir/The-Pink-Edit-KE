import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, X } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { toggleCart, cartItems } = useContext(CartContext);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate('/shop'); 
    }
  };

  return (
    <>
      <nav className="flex justify-between items-center px-12 py-6 bg-white sticky top-0 z-50 shadow-sm relative">
        <div className="flex gap-8 text-sm uppercase tracking-wider text-gray-600">
          <Link to="/shop" className="hover:text-pink-500 font-bold transition-colors">Shop</Link>
          <Link to="/shop" className="hover:text-pink-500 transition-colors">Collections</Link>
          <Link to="/" className="hover:text-pink-500 transition-colors">Journal</Link>
        </div>
        
        <Link to="/" className="text-3xl font-serif text-pink-400 tracking-widest hover:opacity-80 transition-opacity">
          ✧ The Pink Edit
        </Link>
        
        <div className="flex gap-6 text-gray-600 items-center">
          <Search onClick={() => setIsSearchOpen(true)} className="w-5 h-5 cursor-pointer hover:text-pink-500" />
          <User className="w-5 h-5 cursor-pointer hover:text-pink-500" />
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

      {/* SEARCH OVERLAY */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 w-full bg-white z-[100] shadow-xl border-b border-gray-200 py-12 px-12 flex justify-center"
          >
            <button onClick={() => setIsSearchOpen(false)} className="absolute top-8 right-12 text-gray-400 hover:text-pink-500">
              <X className="w-8 h-8" />
            </button>
            <div className="max-w-3xl w-full text-center">
              <span className="text-pink-500 text-xs font-bold tracking-widest uppercase mb-4 block">What are you looking for?</span>
              <form onSubmit={handleSearchSubmit} className="relative mt-8">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search perfumes, jewellery, or collections..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-4xl font-serif border-b-2 border-gray-200 pb-4 outline-none focus:border-pink-500 text-center text-gray-900 placeholder-gray-300 bg-transparent transition-colors"
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}