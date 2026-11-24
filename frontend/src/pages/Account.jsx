import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut,
  Package,
  Heart,
  User,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  Save,
  XCircle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CartContext } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { apiFetch, FALLBACK_IMAGE, formatKsh } from '../lib/api';

const ORDER_STEPS = ['Unfulfilled', 'Processing', 'Shipped', 'Fulfilled'];
const STEP_LABELS = ['Placed', 'Preparing', 'Dispatched', 'Delivered'];

function getStepIndex(status) {
  const idx = ORDER_STEPS.indexOf(status);
  return idx === -1 ? 0 : idx;
}

export default function Account() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'orders';

  const { clearCart, addToCart, openCart, toggleWishlist } = useContext(CartContext);
  const { showToast } = useToast();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    default_address: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const setTab = (tab) => setSearchParams({ tab });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Load cached profile immediately for instant render
    try {
      const cached = JSON.parse(localStorage.getItem('userData') || 'null');
      if (cached) {
        setUser(cached);
        setProfileForm({
          first_name: cached.first_name || '',
          last_name: cached.last_name || '',
          phone_number: cached.phone_number || '',
          default_address: cached.default_address || '',
        });
      }
    } catch {
      // ignore invalid JSON
    }

    // Fetch fresh profile, orders, and wishlist in parallel
    Promise.all([
      apiFetch('/api/account/profile', { auth: 'customer' }),
      apiFetch('/api/account/orders', { auth: 'customer' }),
      apiFetch('/api/wishlist', { auth: 'customer' }),
    ])
      .then(([profileRes, ordersRes, wishlistRes]) => {
        if (profileRes.status === 401) {
          localStorage.removeItem('userToken');
          localStorage.removeItem('userData');
          navigate('/login', { replace: true });
          return;
        }
        if (profileRes.ok && profileRes.data?.email) {
          setUser(profileRes.data);
          localStorage.setItem('userData', JSON.stringify(profileRes.data));
          setProfileForm({
            first_name: profileRes.data.first_name || '',
            last_name: profileRes.data.last_name || '',
            phone_number: profileRes.data.phone_number || '',
            default_address: profileRes.data.default_address || '',
          });
        }
        if (ordersRes.ok && Array.isArray(ordersRes.data)) {
          setOrders(ordersRes.data);
        }
        if (wishlistRes.ok && Array.isArray(wishlistRes.data)) {
          setWishlist(wishlistRes.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    clearCart();
    showToast('Signed out safely', 'info');
    navigate('/login');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const { ok, data } = await apiFetch('/api/account/profile', {
        method: 'PUT',
        auth: 'customer',
        body: JSON.stringify(profileForm),
      });
      if (ok) {
        setUser(data);
        localStorage.setItem('userData', JSON.stringify(data));
        showToast('Profile and delivery details saved');
      } else {
        showToast(data.error || 'Could not update profile', 'error');
      }
    } catch {
      showToast('Network error saving profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleWishlistRemove = async (product) => {
    await toggleWishlist(product.id);
    setWishlist((prev) => prev.filter((p) => p.id !== product.id));
    showToast(`Removed ${product.title} from wishlist`, 'info');
  };

  const handleWishlistAddToBag = (product) => {
    const variant =
      product.variants?.find((v) => v.available_stock > 0) || product.variants?.[0];
    addToCart({
      id: product.id,
      variantId: variant?.id,
      sku: variant?.sku,
      name: product.title,
      title: product.title,
      category: product.category,
      size: variant?.size || 'Standard',
      price: variant ? variant.price : product.base_price,
      qty: 1,
      img: product.media?.[0]?.image_url || FALLBACK_IMAGE,
    });
    showToast(`Added ${product.title} to your bag`);
    openCart();
  };

  const displayInitial =
    user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'C';
  const displayName =
    user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Client';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F6] text-[#141414]">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 lg:px-12 py-10 lg:py-16">
        {/* CLIENT HEADER CARD */}
        <div className="bg-white border border-stone-200 p-6 sm:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#141414] text-[#F3CFD6] flex items-center justify-center text-2xl font-serif shrink-0">
              {displayInitial}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-serif text-[#141414]">
                  {displayName}
                </h1>
                {user?.status && (
                  <span
                    className={`px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] font-bold ${
                      user.status === 'VIP'
                        ? 'bg-[#141414] text-[#E8B4BC]'
                        : 'bg-[#F7ECEF] text-[#A64D66]'
                    }`}
                  >
                    {user.status} Member
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1">{user?.email}</p>
              <div className="flex flex-wrap gap-5 mt-3 text-[11px] text-stone-600">
                <span>
                  <strong className="text-[#141414]">{orders.length}</strong> Orders
                </span>
                <span>
                  <strong className="text-[#141414]">{formatKsh(user?.total_spent || 0)}</strong> Lifetime Spend
                </span>
                <span>
                  <strong className="text-[#141414]">{wishlist.length}</strong> Saved Pieces
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 border border-stone-300 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600 hover:border-[#141414] hover:text-[#141414] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-stone-200 mb-8 gap-6 overflow-x-auto hide-scrollbar">
          {[
            { id: 'orders', label: 'Orders & Tracking', icon: Package, count: orders.length },
            { id: 'wishlist', label: 'Saved Wishlist', icon: Heart, count: wishlist.length },
            { id: 'profile', label: 'Profile & Delivery', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`pb-4 text-xs uppercase tracking-[0.2em] font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-[#141414] text-[#141414]'
                    : 'border-transparent text-stone-400 hover:text-[#141414]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full ${
                      active ? 'bg-[#141414] text-white' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center text-[#C86D85]">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        ) : (
          <>
            {/* TAB 1: ORDERS & TRACKING */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {orders.length === 0 ? (
                  <div className="bg-white border border-stone-200 p-14 text-center">
                    <Package className="w-10 h-10 text-stone-300 mx-auto mb-4 stroke-[1.3]" />
                    <h2 className="font-serif text-2xl text-[#141414] mb-2">No orders yet</h2>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto mb-7">
                      Explore our artisanal extraits and fine jewellery to place your first order.
                    </p>
                    <Link
                      to="/shop"
                      className="inline-block bg-[#141414] text-white px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-[#C86D85] transition-colors"
                    >
                      Explore Collection
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => {
                    const isCanceled = order.fulfillment_status === 'Canceled';
                    const stepIdx = getStepIndex(order.fulfillment_status);
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-stone-200 overflow-hidden"
                      >
                        {/* Order Header */}
                        <div className="p-5 sm:p-6 bg-[#FAF8F6] border-b border-stone-200 flex flex-wrap justify-between items-center gap-4">
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
                                Order Number
                              </p>
                              <p className="font-mono text-sm font-bold text-[#141414] mt-0.5">
                                {order.order_number}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
                                Placed On
                              </p>
                              <p className="text-xs text-stone-700 mt-0.5">
                                {new Date(order.date).toLocaleDateString('en-KE', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
                                Total
                              </p>
                              <p className="text-sm font-semibold text-[#141414] mt-0.5">
                                {formatKsh(order.total_amount)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 text-[10px] uppercase tracking-[0.18em] font-bold ${
                                order.payment_status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : order.payment_status === 'Refunded'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {order.payment_status}
                            </span>
                            <span
                              className={`px-3 py-1 text-[10px] uppercase tracking-[0.18em] font-bold ${
                                order.fulfillment_status === 'Fulfilled'
                                  ? 'bg-[#141414] text-white'
                                  : isCanceled
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-[#F7ECEF] text-[#A64D66]'
                              }`}
                            >
                              {order.fulfillment_status}
                            </span>
                          </div>
                        </div>

                        {/* 4-Step Visual Progress Tracker */}
                        <div className="px-5 sm:px-6 py-5 border-b border-stone-100">
                          {isCanceled ? (
                            <div className="flex items-center gap-2 text-xs text-rose-700 font-medium">
                              <XCircle className="w-4 h-4" /> This order was canceled and any reserved inventory was released.
                            </div>
                          ) : (
                            <div>
                              <div className="grid grid-cols-4 gap-2 relative">
                                {STEP_LABELS.map((label, idx) => {
                                  const completed = idx <= stepIdx;
                                  return (
                                    <div key={label} className="flex flex-col items-center text-center">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] mb-1.5 transition-colors ${
                                          completed
                                            ? 'bg-[#141414] text-white'
                                            : 'bg-stone-100 text-stone-400 border border-stone-200'
                                        }`}
                                      >
                                        {completed ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-[#E8B4BC]" />
                                        ) : (
                                          <Clock className="w-3 h-3" />
                                        )}
                                      </div>
                                      <span
                                        className={`text-[9px] sm:text-[10px] uppercase tracking-[0.14em] ${
                                          completed ? 'text-[#141414] font-semibold' : 'text-stone-400'
                                        }`}
                                      >
                                        {label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              {order.tracking_number && (
                                <p className="text-[11px] text-stone-500 mt-4 flex items-center gap-1.5">
                                  <Truck className="w-3.5 h-3.5 text-[#C86D85]" />
                                  Tracking Ref:{' '}
                                  <span className="font-mono font-semibold text-[#141414]">
                                    {order.tracking_number}
                                  </span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Order Line Items */}
                        <div className="p-5 sm:p-6 space-y-4">
                          {(order.items || []).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <Link
                                  to={item.product_id ? `/product/${item.product_id}` : '/shop'}
                                  className="w-14 h-16 bg-stone-100 overflow-hidden shrink-0 border border-stone-200"
                                >
                                  <img
                                    src={item.image_url || FALLBACK_IMAGE}
                                    onError={(e) => {
                                      e.currentTarget.src = FALLBACK_IMAGE;
                                    }}
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                </Link>
                                <div className="min-w-0">
                                  <Link
                                    to={item.product_id ? `/product/${item.product_id}` : '/shop'}
                                    className="font-serif text-lg text-[#141414] hover:text-[#C86D85] transition-colors truncate block"
                                  >
                                    {item.product_name}
                                  </Link>
                                  <p className="text-[11px] text-stone-500">
                                    {item.size ? `${item.size} · ` : ''}Qty {item.quantity} · SKU {item.sku}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm font-medium text-[#141414] shrink-0">
                                {formatKsh(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}

                          {order.shipping_address && (
                            <div className="pt-4 border-t border-stone-100 flex flex-wrap justify-between gap-3 text-[11px] text-stone-500">
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#C86D85]" />
                                {order.delivery_method ? `${order.delivery_method} — ` : ''}
                                {order.shipping_address}
                              </span>
                              {order.payments?.[0]?.transaction_reference && (
                                <span className="font-mono text-stone-400">
                                  Ref: {order.payments[0].transaction_reference}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: SAVED WISHLIST */}
            {activeTab === 'wishlist' && (
              <div>
                {wishlist.length === 0 ? (
                  <div className="bg-white border border-stone-200 p-14 text-center">
                    <Heart className="w-10 h-10 text-stone-300 mx-auto mb-4 stroke-[1.3]" />
                    <h2 className="font-serif text-2xl text-[#141414] mb-2">
                      Your wishlist is empty
                    </h2>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto mb-7">
                      Tap the heart on any fragrance or fine jewellery piece to save it here for later.
                    </p>
                    <Link
                      to="/shop"
                      className="inline-block bg-[#141414] text-white px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-[#C86D85] transition-colors"
                    >
                      Discover Pieces
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white border border-stone-200 overflow-hidden flex flex-col"
                      >
                        <Link
                          to={`/product/${product.id}`}
                          className="aspect-[4/5] bg-stone-100 overflow-hidden relative group"
                        >
                          <img
                            src={product.media?.[0]?.image_url || FALLBACK_IMAGE}
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </Link>
                        <div className="p-5 flex flex-col flex-1 justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#C86D85] font-semibold">
                              {product.category}
                            </p>
                            <Link
                              to={`/product/${product.id}`}
                              className="font-serif text-xl text-[#141414] hover:text-[#C86D85] transition-colors block mt-1"
                            >
                              {product.title}
                            </Link>
                            <p className="text-sm font-medium text-stone-600 mt-1">
                              {formatKsh(product.base_price)}
                            </p>
                          </div>
                          <div className="flex gap-2 mt-5">
                            <button
                              onClick={() => handleWishlistAddToBag(product)}
                              className="flex-1 bg-[#141414] hover:bg-[#C86D85] text-white py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add to Bag
                            </button>
                            <button
                              onClick={() => handleWishlistRemove(product)}
                              aria-label="Remove from wishlist"
                              className="px-3 border border-stone-200 text-stone-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PROFILE & DELIVERY DETAILS */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl bg-white border border-stone-200 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-4 h-4 text-[#C86D85]" />
                  <h2 className="font-serif text-2xl text-[#141414]">
                    Saved Contact &amp; Delivery Address
                  </h2>
                </div>
                <p className="text-xs text-stone-500 mb-6">
                  These details auto-fill your checkout form for faster M-Pesa Express ordering.
                </p>

                <form onSubmit={handleProfileSave} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.first_name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, first_name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.last_name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, last_name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                      M-Pesa / Delivery Phone
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone_number}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phone_number: e.target.value })
                      }
                      placeholder="0712 345 678"
                      className="w-full px-4 py-3 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
                      Default Delivery Address
                    </label>
                    <textarea
                      rows="3"
                      value={profileForm.default_address}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, default_address: e.target.value })
                      }
                      placeholder="Kilimani, Rose Avenue, Apt 4B, Nairobi"
                      className="w-full px-4 py-3 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 bg-[#141414] hover:bg-[#C86D85] text-white px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] transition-colors disabled:opacity-60"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Details
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}