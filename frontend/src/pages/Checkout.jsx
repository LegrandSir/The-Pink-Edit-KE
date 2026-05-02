import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Lock, Loader2, ArrowLeft, Truck, Package } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, cartTotal } = useContext(CartContext);
  
  // Shipping Form State
  const [formData, setFormData] = useState({
    fullName: '',
    shippingPhone: '',
    mpesaPhone: '',
    deliveryMethod: 'pickup_mtaani',
    locationDetails: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('mpesa'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const isCartEmpty = cartItems.length === 0;

  // UPDATED: Realistic Ksh Delivery Rates
  const deliveryRates = {
    pickup_mtaani: { label: 'Pickup Mtaani', price: 200 },
    doorstep_nairobi: { label: 'Doorstep (Nairobi CBD)', price: 500 },
    parcel_countrywide: { label: 'Countrywide (G4S/Fargo)', price: 800 },
  };

  const deliveryFee = deliveryRates[formData.deliveryMethod].price;
  const finalTotal = cartTotal + deliveryFee;

  // --- WHATSAPP GENERATOR ---
  const sendToWhatsApp = (isPaid) => {
    // Formats numbers with commas (e.g. 2,500)
    const formatKsh = (num) => `Ksh ${num.toLocaleString()}`;

    const itemsList = cartItems.map(item => 
      `${item.qty}x ${item.name || item.title} (${formatKsh(item.price * item.qty)})`
    ).join('%0A');

    const paymentStatus = isPaid ? "✅ *PAID VIA M-PESA*" : "⚠️ *PAY ON DELIVERY*";
    const deliveryString = `*Method:* ${deliveryRates[formData.deliveryMethod].label}%0A*Location:* ${formData.locationDetails}`;

    const message = `*✨ NEW ORDER - THE PINK EDIT ✨*%0A%0A*Customer:* ${formData.fullName}%0A*Phone:* ${formData.shippingPhone}%0A%0A*🛒 ORDER DETAILS:*%0A${itemsList}%0A%0A*Subtotal:* ${formatKsh(cartTotal)}%0A*Delivery:* ${formatKsh(deliveryFee)}%0A*TOTAL:* *${formatKsh(finalTotal)}*%0A%0A*STATUS:* ${paymentStatus}%0A%0A📦 *SHIPPING INFO:*%0A${deliveryString}`;

    // Replace with actual merchant phone
    const merchantPhone = '254700000000'; 
    const whatsappUrl = `https://wa.me/${merchantPhone}?text=${message}`;

    window.open(whatsappUrl, '_blank');
  };

  // --- CHECKOUT HANDLER ---
  const handleCheckout = async (e) => {
    e.preventDefault();

    if (isCartEmpty) {
      setStatusMessage("Your bag is empty! Add some items before checking out.");
      return;
    }

    if (!formData.fullName || !formData.shippingPhone || !formData.locationDetails) {
      setStatusMessage("Please fill in all shipping details.");
      return;
    }

    // SCENARIO 1: PAY ON DELIVERY
    if (paymentMethod === 'pod') {
      sendToWhatsApp(false);
      return;
    }

    // SCENARIO 2: M-PESA EXPRESS
    if (paymentMethod === 'mpesa') {
      if (!formData.mpesaPhone) {
        setStatusMessage("Please enter your M-Pesa number.");
        return;
      }

      setIsProcessing(true);
      setStatusMessage("Connecting to Safaricom...");

      try {
        const response = await fetch('http://127.0.0.1:5000/api/checkout/mpesa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: formData.mpesaPhone,
            amount: finalTotal, 
            cart_items: cartItems
          })
        });

        const data = await response.json();

        if (response.ok) {
          // THE REALISTIC DEMO FIX: Simulate the user taking time to enter their PIN
          setStatusMessage("Prompt sent! Please enter your M-Pesa PIN on your phone...");
          
          setTimeout(() => {
            setStatusMessage("✅ Payment Confirmed! Redirecting to WhatsApp...");
            setTimeout(() => {
              setIsProcessing(false);
              sendToWhatsApp(true);
            }, 1500);
          }, 8000); // Waits 8 seconds to mimic Safaricom network delay
          
        } else {
          setStatusMessage(data.error || "Failed to initiate payment.");
          setIsProcessing(false);
        }
      } catch (err) {
        setStatusMessage("Network error. Please try again.");
        setIsProcessing(false);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-[#faf8f8] text-gray-900 font-sans flex flex-col">
      <header className="border-b border-gray-200 py-6 text-center bg-white sticky top-0 z-50">
        <Link to="/" className="text-3xl font-serif text-pink-400 tracking-widest hover:opacity-80 transition-opacity">
          ✧ The Pink Edit
        </Link>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 pt-12 pb-24 px-6 lg:px-12">
        
        {/* LEFT COLUMN: FORM */}
        <div className="lg:col-span-7">
          <Link to="/shop" className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-pink-500 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Return to Shop
          </Link>

          <form id="checkout-form" onSubmit={handleCheckout}>
            
            {/* --- 1. SHIPPING SECTION --- */}
            <h2 className="text-2xl font-serif mb-6 flex items-center gap-2"><Truck className="w-6 h-6 text-pink-500"/> Shipping Details</h2>
            <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm mb-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Full Name</label>
                  <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 bg-[#faf8f8] border border-gray-200 rounded-sm focus:border-pink-400 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Phone Number</label>
                  <input type="tel" required value={formData.shippingPhone} onChange={(e) => setFormData({...formData, shippingPhone: e.target.value, mpesaPhone: e.target.value})} className="w-full px-4 py-3 bg-[#faf8f8] border border-gray-200 rounded-sm focus:border-pink-400 outline-none" placeholder="07XX XXX XXX" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Delivery Method</label>
                <div className="space-y-3">
                  {Object.entries(deliveryRates).map(([key, data]) => (
                    <label key={key} className={`flex items-center justify-between p-4 border rounded-sm cursor-pointer transition-colors ${formData.deliveryMethod === key ? 'border-pink-500 bg-pink-50/30' : 'border-gray-200 hover:border-pink-300'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="delivery" value={key} checked={formData.deliveryMethod === key} onChange={(e) => setFormData({...formData, deliveryMethod: e.target.value})} className="accent-pink-500" />
                        <span className="text-sm font-medium text-gray-700">{data.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">Ksh {data.price.toLocaleString()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                  {formData.deliveryMethod === 'pickup_mtaani' ? 'Which Pickup Mtaani Agent?' : 'Exact Delivery Address'}
                </label>
                <textarea required rows="2" value={formData.locationDetails} onChange={(e) => setFormData({...formData, locationDetails: e.target.value})} className="w-full px-4 py-3 bg-[#faf8f8] border border-gray-200 rounded-sm focus:border-pink-400 outline-none resize-none" placeholder={formData.deliveryMethod === 'pickup_mtaani' ? "e.g. TRM Mall Agent" : "e.g. Kilimani, Rose Ave, Apt 4B"} />
              </div>
            </div>

            {/* --- 2. PAYMENT SECTION --- */}
            <h2 className="text-2xl font-serif mb-6">Payment Method</h2>
            <div className="border border-gray-300 rounded-sm overflow-hidden mb-8 bg-white shadow-sm">
              
              <div onClick={() => setPaymentMethod('mpesa')} className={`p-4 border-b border-gray-200 flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === 'mpesa' ? 'bg-pink-50/30' : 'bg-white hover:bg-gray-50'}`}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'mpesa' ? 'border-pink-500' : 'border-gray-400'}`}>
                  {paymentMethod === 'mpesa' && <div className="w-2 h-2 rounded-full bg-pink-500"></div>}
                </div>
                <Smartphone className={`w-5 h-5 ${paymentMethod === 'mpesa' ? 'text-pink-500' : 'text-gray-500'}`} />
                <span className="font-bold text-sm">M-Pesa Express (Pay Now)</span>
              </div>
              
              <AnimatePresence>
                {paymentMethod === 'mpesa' && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#faf8f8] border-b border-gray-200">
                    <div className="p-6 text-sm text-gray-600">
                      <p className="mb-4">A prompt will be sent to your phone to enter your M-Pesa PIN.</p>
                      <div className="flex">
                        <span className="bg-gray-200 border border-r-0 border-gray-300 rounded-l-sm px-4 py-3 font-medium text-gray-700">+254</span>
                        <input type="text" placeholder="7XX XXX XXX" value={formData.mpesaPhone} onChange={(e) => setFormData({...formData, mpesaPhone: e.target.value})} className="flex-1 border border-gray-300 rounded-r-sm px-4 py-3 outline-none focus:border-pink-400 bg-white" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div onClick={() => setPaymentMethod('pod')} className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === 'pod' ? 'bg-pink-50/30' : 'bg-white hover:bg-gray-50'}`}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'pod' ? 'border-pink-500' : 'border-gray-400'}`}>
                  {paymentMethod === 'pod' && <div className="w-2 h-2 rounded-full bg-pink-500"></div>}
                </div>
                <Package className={`w-5 h-5 ${paymentMethod === 'pod' ? 'text-pink-500' : 'text-gray-500'}`} />
                <span className="font-bold text-sm">Pay on Delivery</span>
              </div>
            </div>

            {statusMessage && (
              <div className={`p-4 mb-6 rounded-sm text-sm border font-medium ${statusMessage.includes('empty') || statusMessage.includes('error') || statusMessage.includes('failed') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                {statusMessage}
              </div>
            )}

            <motion.button 
              type="submit"
              disabled={isProcessing || isCartEmpty}
              whileHover={{ scale: (isProcessing || isCartEmpty) ? 1 : 1.01 }}
              whileTap={{ scale: (isProcessing || isCartEmpty) ? 1 : 0.99 }}
              className={`w-full text-white font-bold uppercase tracking-widest py-4 rounded-sm transition-colors flex items-center justify-center gap-2 ${(isProcessing || isCartEmpty) ? 'bg-pink-300 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'}`}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Lock className="w-4 h-4"/>}
              {isProcessing 
                ? 'Awaiting Confirmation...' 
                : paymentMethod === 'mpesa' 
                  ? `Pay Ksh ${finalTotal.toLocaleString()} Securely` 
                  : `Complete Order (Ksh ${finalTotal.toLocaleString()})`}
            </motion.button>
          </form>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 sticky top-32">
            <h3 className="font-serif text-xl mb-6 border-b border-gray-200 pb-4">Order Summary</h3>
            
            {isCartEmpty ? (
              <p className="text-gray-500 text-sm italic text-center py-8">Your bag is currently empty.</p>
            ) : (
              <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-20 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0 border border-gray-200">
                      <img src={item.img || item.image} alt={item.name || item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="font-serif text-md">{item.name || item.title}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Qty {item.qty}</p>
                    </div>
                    <div className="flex items-center">
                      <p className="font-medium text-sm">Ksh {(item.price * item.qty).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 pt-6 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Ksh {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping ({deliveryRates[formData.deliveryMethod].label})</span>
                <span>Ksh {deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-serif text-gray-900 mt-4 pt-4 border-t border-gray-200">
                <span>Total</span>
                <span>Ksh {finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}