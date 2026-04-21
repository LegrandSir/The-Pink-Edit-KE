import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function Checkout() {
  const { cartItems, cartTotal } = useContext(CartContext);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  
  // Checkout State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  // Prevents $0 checkouts!
  const isCartEmpty = cartItems.length === 0;

  const handlePayment = async () => {
    if (isCartEmpty) {
      setStatusMessage("Your bag is empty! Add some items before checking out.");
      return;
    }

    if (paymentMethod === 'mpesa') {
      if (!phoneNumber) {
        setStatusMessage("Please enter your M-Pesa number.");
        return;
      }

      setIsProcessing(true);
      setStatusMessage("Sending prompt to your phone...");

      try {
        const response = await fetch('http://127.0.0.1:5000/api/checkout/mpesa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: phoneNumber,
            amount: cartTotal, 
            cart_items: cartItems
          })
        });

        const data = await response.json();

        if (response.ok) {
          setStatusMessage("Prompt sent! Please enter your PIN on your phone.");
          setIsProcessing(false); // <--- STOPS THE SPINNER ON SUCCESS
        } else {
          setStatusMessage(data.error || "Failed to initiate payment.");
          setIsProcessing(false); // <--- STOPS THE SPINNER ON REJECTION
        }
      } catch (err) {
        setStatusMessage("Network error. Please try again.");
        setIsProcessing(false); // <--- STOPS THE SPINNER ON CRASH
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f8] text-gray-900 font-sans flex flex-col">
      <header className="border-b border-gray-200 py-6 text-center bg-white sticky top-0 z-50">
        <Link to="/" className="text-3xl font-serif text-pink-400 tracking-widest hover:opacity-80 transition-opacity">
          ✧ The Pink Edit
        </Link>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 pt-12 pb-24 px-12">
        
        {/* LEFT COLUMN: CHECKOUT FORM */}
        <div className="lg:col-span-7">
          <Link to="/shop" className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-pink-500 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Return to Shop
          </Link>

          <h2 className="text-2xl font-serif mb-6">Payment Method</h2>
          
          <div className="border border-gray-300 rounded-sm overflow-hidden mb-8 bg-white shadow-sm">
            {/* M-Pesa Option */}
            <div 
              onClick={() => setPaymentMethod('mpesa')}
              className={`p-4 border-b border-gray-200 flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === 'mpesa' ? 'bg-pink-50/30' : 'bg-white hover:bg-gray-50'}`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'mpesa' ? 'border-pink-500' : 'border-gray-400'}`}>
                {paymentMethod === 'mpesa' && <div className="w-2 h-2 rounded-full bg-pink-500"></div>}
              </div>
              <Smartphone className={`w-5 h-5 ${paymentMethod === 'mpesa' ? 'text-pink-500' : 'text-gray-500'}`} />
              <span className="font-bold text-sm">M-Pesa Express</span>
            </div>
            
            <AnimatePresence>
              {paymentMethod === 'mpesa' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#faf8f8] border-b border-gray-200">
                  <div className="p-6 text-sm text-gray-600">
                    <p className="mb-4">Enter your Safaricom phone number. A prompt will be sent to your phone to enter your M-Pesa PIN.</p>
                    <div className="flex">
                      <span className="bg-gray-200 border border-r-0 border-gray-300 rounded-l-sm px-4 py-3 font-medium text-gray-700">+254</span>
                      <input 
                        type="text" 
                        placeholder="7XX XXX XXX" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-r-sm px-4 py-3 outline-none focus:border-pink-400 bg-white" 
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {statusMessage && (
            <div className={`p-4 mb-6 rounded-sm text-sm border ${statusMessage.includes('empty') || statusMessage.includes('error') || statusMessage.includes('failed') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-pink-50 text-pink-600 border-pink-200'}`}>
              {statusMessage}
            </div>
          )}

          <motion.button 
            onClick={handlePayment}
            disabled={isProcessing || isCartEmpty}
            whileHover={{ scale: (isProcessing || isCartEmpty) ? 1 : 1.01 }}
            whileTap={{ scale: (isProcessing || isCartEmpty) ? 1 : 0.99 }}
            className={`w-full text-white font-bold uppercase tracking-widest py-4 rounded-sm transition-colors flex items-center justify-center gap-2 ${(isProcessing || isCartEmpty) ? 'bg-pink-300 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'}`}
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Lock className="w-4 h-4"/>}
            {isProcessing ? 'Processing...' : `Pay $${cartTotal.toFixed(2)} Securely`}
          </motion.button>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200">
            <h3 className="font-serif text-xl mb-6 border-b border-gray-200 pb-4">Order Summary</h3>
            
            {isCartEmpty ? (
              <p className="text-gray-500 text-sm italic text-center py-8">Your bag is currently empty.</p>
            ) : (
              <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-20 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0 border border-gray-200">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="font-serif text-md">{item.name}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{item.size} • Qty {item.qty}</p>
                    </div>
                    <div className="flex items-center">
                      <p className="font-medium text-sm">${(item.price * item.qty).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 pt-6 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Calculated next step</span>
              </div>
              <div className="flex justify-between text-lg font-serif text-gray-900 mt-4 pt-4 border-t border-gray-200">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}