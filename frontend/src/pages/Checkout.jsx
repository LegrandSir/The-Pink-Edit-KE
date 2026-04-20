import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, ChevronRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('mpesa'); // 'mpesa' or 'card'

  // Mock cart data based on your design
  const cartItems = [
    { id: 1, name: "Rose Éternelle Eau de Parfum", category: "Perfume", price: 185.00, qty: 1, img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=200&auto=format&fit=crop" },
    { id: 2, name: "Luminous Pearl Drop Earrings", category: "Fine Jewellery", price: 420.00, qty: 1, img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=200&auto=format&fit=crop" }
  ];
  const subtotal = 605.00;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      
      {/* Minimal Header for Checkout */}
      <header className="border-b border-gray-200 py-6 text-center bg-white sticky top-0 z-50">
        <Link to="/" className="text-3xl font-serif text-pink-400 tracking-widest hover:opacity-80 transition-opacity">
          ✧ The Pink Edit
        </Link>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 pt-12 pb-24 px-12">
        
        {/* LEFT COLUMN: CHECKOUT FORM */}
        <div className="lg:col-span-7">
          <div className="flex text-xs uppercase tracking-widest text-gray-400 mb-8 items-center gap-2">
            <Link to="/shop" className="hover:text-pink-500">Cart</Link> <ChevronRight className="w-3 h-3"/>
            <span className="text-gray-900 font-bold">Information & Shipping</span> <ChevronRight className="w-3 h-3"/>
            <span>Payment</span>
          </div>

          <h2 className="text-2xl font-serif mb-6">Contact Information</h2>
          <input type="email" placeholder="Email Address" className="w-full border border-gray-300 rounded-sm px-4 py-3 mb-8 outline-none focus:border-pink-400 text-sm" />

          <h2 className="text-2xl font-serif mb-6">Delivery Address</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" placeholder="First Name" className="w-full border border-gray-300 rounded-sm px-4 py-3 outline-none focus:border-pink-400 text-sm" />
            <input type="text" placeholder="Last Name" className="w-full border border-gray-300 rounded-sm px-4 py-3 outline-none focus:border-pink-400 text-sm" />
          </div>
          <input type="text" placeholder="Street Address" className="w-full border border-gray-300 rounded-sm px-4 py-3 mb-4 outline-none focus:border-pink-400 text-sm" />
          <div className="grid grid-cols-2 gap-4 mb-12">
            <input type="text" placeholder="City" className="w-full border border-gray-300 rounded-sm px-4 py-3 outline-none focus:border-pink-400 text-sm" />
            <input type="text" placeholder="Postal Code (Optional)" className="w-full border border-gray-300 rounded-sm px-4 py-3 outline-none focus:border-pink-400 text-sm" />
          </div>

          <h2 className="text-2xl font-serif mb-6">Payment Method</h2>
          <p className="text-xs text-gray-500 mb-4 flex items-center gap-1"><Lock className="w-3 h-3"/> All transactions are secure and encrypted.</p>
          
          <div className="border border-gray-300 rounded-sm overflow-hidden mb-8">
            {/* M-Pesa Option */}
            <div 
              onClick={() => setPaymentMethod('mpesa')}
              className={`p-4 border-b border-gray-300 flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === 'mpesa' ? 'bg-pink-50/50' : 'bg-white hover:bg-gray-50'}`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'mpesa' ? 'border-pink-500' : 'border-gray-400'}`}>
                {paymentMethod === 'mpesa' && <div className="w-2 h-2 rounded-full bg-pink-500"></div>}
              </div>
              <Smartphone className={`w-5 h-5 ${paymentMethod === 'mpesa' ? 'text-pink-500' : 'text-gray-500'}`} />
              <span className="font-bold text-sm">M-Pesa Express</span>
            </div>
            
            <AnimatePresence>
              {paymentMethod === 'mpesa' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#faf8f8]">
                  <div className="p-6 text-sm text-gray-600">
                    <p className="mb-4">Enter your Safaricom phone number. A prompt will be sent to your phone to enter your M-Pesa PIN and complete the purchase.</p>
                    <div className="flex">
                      <span className="bg-gray-200 border border-r-0 border-gray-300 rounded-l-sm px-4 py-3 font-medium">+254</span>
                      <input type="text" placeholder="7XX XXX XXX" className="flex-1 border border-gray-300 rounded-r-sm px-4 py-3 outline-none focus:border-pink-400" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Credit Card Option */}
            <div 
              onClick={() => setPaymentMethod('card')}
              className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'bg-pink-50/50' : 'bg-white hover:bg-gray-50'}`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'card' ? 'border-pink-500' : 'border-gray-400'}`}>
                {paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-pink-500"></div>}
              </div>
              <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-pink-500' : 'text-gray-500'}`} />
              <span className="font-bold text-sm">Credit or Debit Card</span>
            </div>

            <AnimatePresence>
              {paymentMethod === 'card' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#faf8f8] border-t border-gray-300">
                  <div className="p-6 text-sm text-gray-600 space-y-4">
                    <input type="text" placeholder="Card Number" className="w-full border border-gray-300 rounded-sm px-4 py-3 outline-none focus:border-pink-400" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Expiration Date (MM/YY)" className="w-full border border-gray-300 rounded-sm px-4 py-3 outline-none focus:border-pink-400" />
                      <input type="text" placeholder="Security Code (CVV)" className="w-full border border-gray-300 rounded-sm px-4 py-3 outline-none focus:border-pink-400" />
                    </div>
                    <input type="text" placeholder="Name on Card" className="w-full border border-gray-300 rounded-sm px-4 py-3 outline-none focus:border-pink-400" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-pink-500 text-white font-bold uppercase tracking-widest py-4 rounded-sm hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4"/> Pay ${subtotal.toFixed(2)} Securely
          </motion.button>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="lg:col-span-5 relative">
          <div className="bg-[#faf8f8] p-8 rounded-md sticky top-24 border border-gray-100 shadow-sm">
            <h3 className="font-serif text-xl mb-6">Order Summary</h3>
            
            <div className="space-y-6 mb-8 border-b border-gray-200 pb-8">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-16 bg-white border border-gray-200 rounded-sm overflow-hidden flex-shrink-0">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                      {item.qty}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center text-sm">
                    <h4 className="font-bold text-gray-800">{item.name}</h4>
                    <span className="text-[10px] uppercase tracking-widest text-pink-400">{item.category}</span>
                  </div>
                  <div className="flex items-center text-sm font-medium">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm text-gray-600 mb-6 border-b border-gray-200 pb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-gray-400 italic">Calculated at next step</span>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <span className="font-bold uppercase tracking-widest text-sm">Total</span>
              <span className="font-serif text-3xl text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}