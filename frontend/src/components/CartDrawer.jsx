import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function CartDrawer() {
  const { isCartOpen, toggleCart, cartItems, cartTotal } = useContext(CartContext);
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    toggleCart(); // Close drawer
    navigate('/checkout'); // Go to checkout page
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Dark Background Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* The Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 right-0 h-full w-[400px] bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="font-serif text-2xl">Your Bag</h2>
              <X onClick={toggleCart} className="w-5 h-5 cursor-pointer hover:text-pink-500 transition-colors" />
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-24 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{item.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-pink-400 mt-1">{item.category}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-500">Qty: {item.qty}</span>
                      <span className="font-medium text-sm">${item.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer / Checkout Button */}
            <div className="border-t border-gray-200 p-6 bg-[#faf8f8]">
              <div className="flex justify-between items-center mb-6">
                <span className="uppercase tracking-widest text-xs font-bold text-gray-500">Subtotal</span>
                <span className="font-serif text-2xl">${cartTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mb-6 text-center italic">Shipping and taxes calculated at checkout.</p>
              
              <button 
                onClick={handleCheckoutClick}
                className="w-full bg-pink-500 text-white font-bold uppercase tracking-widest py-4 rounded-sm hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> Proceed to Checkout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}