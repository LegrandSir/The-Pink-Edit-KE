import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Lock,
  Loader2,
  ArrowLeft,
  Truck,
  Package,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CartContext, FREE_SHIPPING_THRESHOLD } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { apiFetch, FALLBACK_IMAGE, formatKsh } from '../lib/api';

const DELIVERY_RATES = {
  pickup_mtaani: { label: 'Pickup Mtaani Agent', price: 200, eta: '1–2 Business Days' },
  doorstep_nairobi: { label: 'Doorstep Courier (Nairobi)', price: 500, eta: 'Same-Day / Next-Day' },
  parcel_countrywide: { label: 'Countrywide Express (G4S / Fargo)', price: 800, eta: '2–3 Business Days' },
};

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart, syncCartWithServer } = useContext(CartContext);
  const { showToast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('userToken')));
  const [isDemoSigningIn, setIsDemoSigningIn] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    shippingPhone: '',
    mpesaPhone: '',
    deliveryMethod: 'doorstep_nairobi',
    locationDetails: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('mpesa_demo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Prefill from stored customer profile
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const stored = JSON.parse(localStorage.getItem('userData') || '{}');
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || stored.name || '',
        shippingPhone: prev.shippingPhone || stored.phone_number || '',
        mpesaPhone: prev.mpesaPhone || stored.phone_number || '',
        locationDetails: prev.locationDetails || stored.default_address || '',
      }));
    } catch {
      // ignore malformed storage
    }

    apiFetch('/api/account/profile', { auth: 'customer' }).then(({ ok, data }) => {
      if (ok && data?.email) {
        localStorage.setItem('userData', JSON.stringify(data));
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || data.name || '',
          shippingPhone: prev.shippingPhone || data.phone_number || '',
          mpesaPhone: prev.mpesaPhone || data.phone_number || '',
          locationDetails: prev.locationDetails || data.default_address || '',
        }));
      }
    });
  }, [isAuthenticated]);

  const handleInstantDemoSignIn = async () => {
    setIsDemoSigningIn(true);
    try {
      const { ok, data } = await apiFetch('/api/auth/demo-customer', { method: 'POST' });
      if (ok) {
        localStorage.setItem('userToken', data.access_token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        setIsAuthenticated(true);
        await syncCartWithServer();
        showToast('Signed in as Demo Customer (Amara Wanjiku)');
      } else {
        showToast(data.error || 'Could not start demo session', 'error');
      }
    } catch {
      showToast('Unable to reach server. Please try again.', 'error');
    } finally {
      setIsDemoSigningIn(false);
    }
  };

  const isCartEmpty = cartItems.length === 0;
  const qualifiesForFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const baseDeliveryFee = DELIVERY_RATES[formData.deliveryMethod].price;
  const deliveryFee = qualifiesForFreeShipping ? 0 : baseDeliveryFee;
  const finalTotal = cartTotal + deliveryFee;

  const openWhatsAppReceipt = (orderData, receiptCode) => {
    const itemsList = (orderData.items || [])
      .map((item) => `${item.quantity}x ${item.product_name} (${item.size}) — ${formatKsh(item.price * item.quantity)}`)
      .join('%0A');
    const payLabel = orderData.payment_status === 'Paid' ? `PAID VIA M-PESA (${receiptCode})` : 'PAY ON DELIVERY';
    const msg = `*THE PINK EDIT — ORDER ${orderData.order_number}*%0A%0A*Customer:* ${formData.fullName}%0A*Phone:* ${orderData.shipping_phone}%0A*Delivery:* ${orderData.delivery_method} — ${orderData.shipping_address}%0A%0A*ITEMS:*%0A${itemsList}%0A%0A*TOTAL:* ${formatKsh(orderData.total_amount)}%0A*STATUS:* ${payLabel}`;
    window.open(`https://wa.me/254769562049?text=${msg}`, '_blank');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isAuthenticated) {
      setErrorMessage('Please sign in or use One-Click Demo Customer above to place your order.');
      return;
    }
    if (isCartEmpty) {
      setErrorMessage('Your bag is empty. Add a piece before checking out.');
      return;
    }
    if (!formData.fullName.trim() || !formData.shippingPhone.trim() || !formData.locationDetails.trim()) {
      setErrorMessage('Please complete your name, phone number, and delivery address.');
      return;
    }
    if (paymentMethod.startsWith('mpesa') && !formData.mpesaPhone.trim()) {
      setErrorMessage('Please enter an M-Pesa phone number.');
      return;
    }

    setIsProcessing(true);
    setProcessingStage(
      paymentMethod === 'mpesa_demo'
        ? 'Simulating Safaricom M-Pesa STK Push...'
        : paymentMethod === 'mpesa_live'
        ? 'Initiating Daraja Sandbox STK Push...'
        : 'Confirming your order with the atelier...'
    );

    try {
      // Short realistic delay for the simulated STK Push UX
      if (paymentMethod === 'mpesa_demo') {
        await new Promise((r) => setTimeout(r, 1100));
        setProcessingStage('M-Pesa PIN verified — recording order & updating inventory...');
        await new Promise((r) => setTimeout(r, 900));
      }

      const { ok, data } = await apiFetch('/api/checkout/order', {
        method: 'POST',
        auth: 'customer',
        body: JSON.stringify({
          items: cartItems.map((i) => ({
            id: i.id,
            variantId: i.variantId,
            size: i.size,
            qty: i.qty,
          })),
          delivery_method: formData.deliveryMethod,
          shipping_address: formData.locationDetails,
          shipping_phone: formData.shippingPhone,
          payment_method: paymentMethod,
          mpesa_phone: formData.mpesaPhone || formData.shippingPhone,
          notes: formData.notes,
        }),
      });

      if (!ok) {
        setErrorMessage(data.error || 'Could not complete checkout.');
        setIsProcessing(false);
        return;
      }

      setConfirmedOrder({ order: data.order, receipt: data.receipt });
      clearCart();
      showToast(`Order ${data.order.order_number} confirmed!`);
    } catch {
      setErrorMessage('Network error while connecting to the server. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  // ORDER CONFIRMATION RECEIPT VIEW
  if (confirmedOrder) {
    const { order, receipt } = confirmedOrder;
    return (
      <div className="min-h-screen bg-[#FAF8F6] text-[#141414] flex flex-col">
        <header className="border-b border-stone-200 py-5 text-center bg-white">
          <Link to="/" className="text-2xl font-serif tracking-[0.16em] text-[#141414]">
            THE PINK EDIT
          </Link>
        </header>

        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-stone-200 p-8 sm:p-12 shadow-sm"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center mb-8">
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#C86D85] font-bold mb-2">
                Order Confirmed &amp; Persisted to Neon Postgres
              </p>
              <h1 className="text-3xl sm:text-4xl font-serif text-[#141414] mb-2">
                Thank you for your order
              </h1>
              <p className="text-xs text-stone-500">
                Reference <span className="font-mono font-semibold text-[#141414]">{order.order_number}</span>
                {receipt && (
                  <>
                    {' '}· Receipt <span className="font-mono font-semibold text-[#141414]">{receipt}</span>
                  </>
                )}
              </p>
            </div>

            <div className="border-y border-stone-200 py-6 mb-6 space-y-4">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-serif text-lg text-[#141414]">{item.product_name}</p>
                    <p className="text-[11px] text-stone-500">
                      {item.size} × {item.quantity} · SKU {item.sku}
                    </p>
                  </div>
                  <span className="font-medium">{formatKsh(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs text-stone-600 mb-8">
              <div className="flex justify-between">
                <span>Delivery ({order.delivery_method})</span>
                <span>{order.shipping_cost === 0 ? 'Complimentary' : formatKsh(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span className="font-semibold text-emerald-700">{order.payment_status}</span>
              </div>
              <div className="flex justify-between text-base font-serif text-[#141414] pt-3 border-t border-stone-200">
                <span>Total Paid</span>
                <span className="font-semibold">{formatKsh(order.total_amount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <Link
                to="/account"
                className="bg-[#141414] text-white py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-[#C86D85] transition-colors"
              >
                Track in My Account
              </Link>
              <Link
                to="/admin"
                className="border border-[#141414] text-[#141414] py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-[#141414] hover:text-white transition-colors"
              >
                Inspect in Admin Portal
              </Link>
            </div>

            <button
              onClick={() => openWhatsAppReceipt(order, receipt)}
              className="w-full py-3 border border-stone-200 text-stone-600 hover:border-emerald-600 hover:text-emerald-700 text-[11px] uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Send Copy to WhatsApp Concierge
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-[#141414] flex flex-col">
      <header className="border-b border-stone-200 py-5 px-6 lg:px-12 bg-white sticky top-0 z-40 flex items-center justify-between">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-[#141414]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Shop
        </Link>
        <Link to="/" className="text-2xl font-serif tracking-[0.16em] text-[#141414]">
          THE PINK EDIT
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-stone-400">
          <Lock className="w-3.5 h-3.5 text-[#C86D85]" /> Secure
        </span>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 py-10 lg:py-14 px-6 lg:px-12">
        {/* LEFT COLUMN: SHIPPING & PAYMENT */}
        <div className="lg:col-span-7">
          {/* Zero-Friction Demo Login Banner if Guest */}
          {!isAuthenticated && (
            <div className="mb-8 p-6 bg-[#141414] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#E8B4BC] font-semibold mb-1">
                  Portfolio Quick Checkout
                </p>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Sign in with one click as our pre-seeded VIP customer to test real order persistence and stock deduction.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleInstantDemoSignIn}
                  disabled={isDemoSigningIn}
                  className="bg-[#C86D85] hover:bg-[#E8B4BC] hover:text-[#141414] text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] inline-flex items-center gap-1.5 transition-colors"
                >
                  {isDemoSigningIn ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  Demo Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  className="border border-stone-600 text-stone-200 hover:border-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleCheckout} className="space-y-10">
            {/* 1. Shipping */}
            <div>
              <h2 className="text-2xl font-serif mb-5 flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-[#C86D85]" /> Delivery Details
              </h2>
              <div className="bg-white p-6 sm:p-7 border border-stone-200 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Amara Wanjiku"
                      className="w-full px-4 py-3 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.shippingPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingPhone: e.target.value,
                          mpesaPhone: formData.mpesaPhone || e.target.value,
                        })
                      }
                      placeholder="0712 345 678"
                      className="w-full px-4 py-3 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2.5">
                    Delivery Method
                  </label>
                  <div className="space-y-2.5">
                    {Object.entries(DELIVERY_RATES).map(([key, info]) => {
                      const active = formData.deliveryMethod === key;
                      return (
                        <label
                          key={key}
                          className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                            active
                              ? 'border-[#141414] bg-[#FAF8F6]'
                              : 'border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="delivery"
                              value={key}
                              checked={active}
                              onChange={(e) =>
                                setFormData({ ...formData, deliveryMethod: e.target.value })
                              }
                              className="accent-[#141414]"
                            />
                            <div>
                              <p className="text-sm font-medium text-[#141414]">{info.label}</p>
                              <p className="text-[11px] text-stone-400">{info.eta}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-[#141414]">
                            {qualifiesForFreeShipping ? (
                              <span className="text-emerald-700">Free</span>
                            ) : (
                              formatKsh(info.price)
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                    {formData.deliveryMethod === 'pickup_mtaani'
                      ? 'Pickup Mtaani Agent Location'
                      : 'Delivery Address'}
                  </label>
                  <textarea
                    required
                    rows="2"
                    value={formData.locationDetails}
                    onChange={(e) =>
                      setFormData({ ...formData, locationDetails: e.target.value })
                    }
                    placeholder={
                      formData.deliveryMethod === 'pickup_mtaani'
                        ? 'e.g. Sarit Centre / TRM Mall Agent'
                        : 'e.g. Kilimani, Rose Avenue, Apt 4B, Nairobi'
                    }
                    className="w-full px-4 py-3 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                    Gift Note / Rider Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add a ribbon gift message or gate code..."
                    className="w-full px-4 py-3 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment */}
            <div>
              <h2 className="text-2xl font-serif mb-5 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#C86D85]" /> Payment Method
              </h2>

              <div className="bg-white border border-stone-200 divide-y divide-stone-200">
                {/* M-Pesa Demo Express */}
                <div>
                  <div
                    onClick={() => setPaymentMethod('mpesa_demo')}
                    className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-colors ${
                      paymentMethod === 'mpesa_demo' ? 'bg-[#FAF8F6]' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === 'mpesa_demo'}
                        onChange={() => setPaymentMethod('mpesa_demo')}
                        className="accent-[#141414]"
                      />
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-[#141414]">
                          M-Pesa Express <span className="ml-1.5 text-[9px] uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold">Instant Demo</span>
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Simulates STK Push &amp; records a real paid order in Postgres—works worldwide.
                        </p>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {paymentMethod === 'mpesa_demo' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-[#FAF8F6] border-t border-stone-200"
                      >
                        <div className="p-5 text-xs text-stone-600">
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-2">
                            M-Pesa Phone Number (Demo Accepted)
                          </label>
                          <div className="flex">
                            <span className="bg-stone-200 border border-r-0 border-stone-300 px-3.5 py-2.5 font-medium text-stone-700">
                              +254
                            </span>
                            <input
                              type="text"
                              value={formData.mpesaPhone}
                              onChange={(e) =>
                                setFormData({ ...formData, mpesaPhone: e.target.value })
                              }
                              placeholder="712 345 678"
                              className="flex-1 border border-stone-300 px-4 py-2.5 outline-none focus:border-[#141414] bg-white text-sm"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Pay on Delivery */}
                <div
                  onClick={() => setPaymentMethod('pod')}
                  className={`p-4 sm:p-5 flex items-center gap-3 cursor-pointer transition-colors ${
                    paymentMethod === 'pod' ? 'bg-[#FAF8F6]' : 'hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    checked={paymentMethod === 'pod'}
                    onChange={() => setPaymentMethod('pod')}
                    className="accent-[#141414]"
                  />
                  <Package className="w-5 h-5 text-[#C86D85]" />
                  <div>
                    <p className="text-sm font-semibold text-[#141414]">Pay on Delivery</p>
                    <p className="text-[11px] text-stone-500">
                      Creates a pending order in the system; settle via M-Pesa or cash upon rider arrival.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 text-rose-700 text-xs border border-rose-200 font-medium">
                {errorMessage}
              </div>
            )}

            {isProcessing && processingStage && (
              <div className="p-4 bg-[#141414] text-[#FAF8F6] text-xs flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-[#E8B4BC] shrink-0" />
                <span>{processingStage}</span>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isProcessing || isCartEmpty}
              whileTap={{ scale: isProcessing || isCartEmpty ? 1 : 0.99 }}
              className={`w-full text-white font-semibold uppercase tracking-[0.22em] py-4 transition-colors flex items-center justify-center gap-2 text-xs ${
                isProcessing || isCartEmpty
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-[#141414] hover:bg-[#C86D85]'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {isProcessing
                ? 'Processing Order...'
                : paymentMethod === 'mpesa_demo'
                ? `Pay ${formatKsh(finalTotal)} with M-Pesa Express`
                : `Place Order — ${formatKsh(finalTotal)}`}
            </motion.button>
          </form>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="lg:col-span-5">
          <div className="bg-white p-7 border border-stone-200 sticky top-28">
            <h3 className="font-serif text-2xl mb-5 border-b border-stone-200 pb-4">
              Order Summary
            </h3>

            {isCartEmpty ? (
              <div className="text-center py-10">
                <p className="text-stone-500 text-sm mb-4">Your bag is currently empty.</p>
                <Link
                  to="/shop"
                  className="inline-block bg-[#141414] text-white px-6 py-2.5 text-[10px] uppercase tracking-[0.2em]"
                >
                  Browse Collection
                </Link>
              </div>
            ) : (
              <div className="space-y-4 mb-6 max-h-[42vh] overflow-y-auto pr-1">
                {cartItems.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-3.5">
                    <div className="w-16 h-20 bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                      <img
                        src={item.img || item.image || FALLBACK_IMAGE}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                        alt={item.name || item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-serif text-base text-[#141414] truncate">
                        {item.name || item.title}
                      </h4>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-stone-400 mt-0.5">
                        {item.size ? `${item.size} · ` : ''}Qty {item.qty}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <p className="font-medium text-sm text-[#141414]">
                        {formatKsh(item.price * item.qty)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-stone-200 pt-5 space-y-2.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatKsh(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery ({DELIVERY_RATES[formData.deliveryMethod].label})</span>
                <span className={qualifiesForFreeShipping ? 'text-emerald-700 font-semibold' : ''}>
                  {qualifiesForFreeShipping ? 'Complimentary' : formatKsh(deliveryFee)}
                </span>
              </div>
              {qualifiesForFreeShipping && (
                <p className="text-[11px] text-emerald-700 flex items-center gap-1 pt-1">
                  <Sparkles className="w-3.5 h-3.5" /> Free Nairobi / Nationwide express unlocked
                </p>
              )}
              <div className="flex justify-between text-xl font-serif text-[#141414] pt-4 mt-2 border-t border-stone-200">
                <span>Total</span>
                <span className="font-semibold">{formatKsh(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}