import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Minus, Plus, Trash2, ShoppingBag, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartContext, FREE_SHIPPING_THRESHOLD } from '../context/CartContext';
import { FALLBACK_IMAGE, formatKsh } from '../lib/api';

export default function CartDrawer() {
  const {
    isCartOpen,
    toggleCart,
    cartItems,
    cartTotal,
    cartCount,
    updateQuantity,
    removeFromCart,
  } = useContext(CartContext);
  const navigate = useNavigate();

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const shippingProgress = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleCheckoutClick = () => {
    toggleCart();
    navigate('/checkout');
  };

  const handleExploreClick = () => {
    toggleCart();
    navigate('/shop');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[80]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[430px] bg-[#FAF8F6] z-[90] shadow-2xl flex flex-col border-l border-stone-200"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-stone-200">
              <div>
                <h2 className="font-serif text-2xl text-[#141414]">Your Bag</h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-0.5">
                  {cartCount} {cartCount === 1 ? 'Piece' : 'Pieces'} Selected
                </p>
              </div>
              <button
                onClick={toggleCart}
                className="p-2 text-stone-400 hover:text-[#141414] transition-colors"
                aria-label="Close bag"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Bar */}
            {cartItems.length > 0 && (
              <div className="px-6 py-3.5 bg-[#F7ECEF]/70 border-b border-stone-200/80">
                <p className="text-[11px] text-[#141414] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C86D85] shrink-0" />
                  {remainingForFreeShipping === 0 ? (
                    <span className="font-medium">
                      You&apos;ve unlocked <span className="text-[#A64D66]">Complimentary Express Delivery</span>
                    </span>
                  ) : (
                    <span>
                      Add <strong className="font-semibold">{formatKsh(remainingForFreeShipping)}</strong> for complimentary express shipping
                    </span>
                  )}
                </p>
                <div className="w-full h-1 bg-stone-200 mt-2 overflow-hidden rounded-full">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${shippingProgress}%` }}
                    transition={{ duration: 0.4 }}
                    className="h-full bg-[#C86D85]"
                  />
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-white border border-stone-200 flex items-center justify-center mb-5 text-stone-400">
                    <ShoppingBag className="w-7 h-7 stroke-[1.3]" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#141414] mb-2">Your bag is empty</h3>
                  <p className="text-xs text-stone-500 max-w-xs leading-relaxed mb-8">
                    Discover our artisanal Nairobi fragrances, 18k gold fine jewellery, and hand-poured candles.
                  </p>
                  <button
                    onClick={handleExploreClick}
                    className="bg-[#141414] text-white px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-[#C86D85] transition-colors"
                  >
                    Explore Collection
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cartItems.map((item) => {
                    const key = `${item.id}-${item.variantId || item.size || 'std'}`;
                    return (
                      <motion.div
                        key={key}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className="flex gap-4 bg-white p-3.5 border border-stone-200/70"
                      >
                        <div className="w-20 h-24 bg-stone-100 overflow-hidden shrink-0">
                          <img
                            src={item.img || item.image || FALLBACK_IMAGE}
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                            alt={item.name || item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col justify-between flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="text-[9px] uppercase tracking-[0.2em] text-[#C86D85] font-semibold">
                                {item.category}
                              </p>
                              <h3 className="font-serif text-lg text-[#141414] leading-tight truncate mt-0.5">
                                {item.name || item.title}
                              </h3>
                              {item.size && (
                                <span className="inline-block mt-1 text-[10px] uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5">
                                  {item.size}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(item)}
                              className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex justify-between items-center mt-3">
                            <div className="inline-flex items-center border border-stone-200 bg-[#FAF8F6]">
                              <button
                                onClick={() => updateQuantity(item, -1)}
                                className="px-2.5 py-1 text-stone-500 hover:text-[#141414] transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2.5 text-xs font-medium text-[#141414]">
                                {item.qty}
                              </span>
                              <button
                                onClick={() => updateQuantity(item, 1)}
                                className="px-2.5 py-1 text-stone-500 hover:text-[#141414] transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-medium text-sm text-[#141414]">
                              {formatKsh(item.price * item.qty)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-stone-200 p-6 bg-white">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="uppercase tracking-[0.2em] text-[10px] font-semibold text-stone-500">
                    Estimated Subtotal
                  </span>
                  <span className="font-serif text-2xl text-[#141414]">
                    {formatKsh(cartTotal)}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mb-5">
                  Delivery options &amp; M-Pesa Express confirmed at checkout.
                </p>

                <button
                  onClick={handleCheckoutClick}
                  className="w-full bg-[#141414] text-white font-semibold uppercase tracking-[0.2em] py-4 hover:bg-[#C86D85] transition-colors flex items-center justify-center gap-2 text-xs"
                >
                  <Lock className="w-3.5 h-3.5" /> Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}