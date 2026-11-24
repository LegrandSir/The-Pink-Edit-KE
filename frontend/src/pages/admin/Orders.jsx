import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  X,
  ShoppingBag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiFetch, formatKsh } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const TABS = ['All', 'Unfulfilled', 'Processing', 'Shipped', 'Fulfilled', 'Unpaid', 'Canceled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Manual Order Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_id: '',
    variant_id: '',
    quantity: 1,
    payment_method: 'mpesa',
    payment_status: 'Paid',
    delivery_method: 'Doorstep (Nairobi CBD)',
    shipping_cost: 500,
    shipping_address: '',
    notes: '',
  });

  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { ok, status, data } = await apiFetch('/api/admin/orders', { auth: 'admin' });
      if (status === 401 || status === 403) {
        localStorage.removeItem('adminToken');
        navigate('/admin', { replace: true });
        return;
      }
      if (ok && Array.isArray(data)) {
        setOrders(data);
      }
    } catch {
      showToast('Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openCreateModal = async () => {
    setIsCreateOpen(true);
    if (customers.length === 0 || variants.length === 0) {
      const [custRes, prodRes] = await Promise.all([
        apiFetch('/api/admin/customers', { auth: 'admin' }),
        apiFetch('/api/admin/products', { auth: 'admin' }),
      ]);
      if (custRes.ok && Array.isArray(custRes.data)) {
        setCustomers(custRes.data);
        if (custRes.data[0]) {
          setNewOrder((prev) => ({
            ...prev,
            customer_id: String(custRes.data[0].id),
            shipping_address: custRes.data[0].default_address || '',
          }));
        }
      }
      if (prodRes.ok && Array.isArray(prodRes.data)) {
        const flatVariants = prodRes.data.flatMap((p) =>
          (p.variants || [])
            .filter((v) => v.available_stock > 0)
            .map((v) => ({
              id: v.id,
              label: `${p.title} (${v.size}) — ${formatKsh(v.price)} [${v.available_stock} in stock]`,
              price: v.price,
            }))
        );
        setVariants(flatVariants);
        if (flatVariants[0]) {
          setNewOrder((prev) => ({ ...prev, variant_id: String(flatVariants[0].id) }));
        }
      }
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { ok, data } = await apiFetch('/api/admin/orders', {
        method: 'POST',
        auth: 'admin',
        body: JSON.stringify({
          ...newOrder,
          customer_id: parseInt(newOrder.customer_id, 10),
          variant_id: parseInt(newOrder.variant_id, 10),
          quantity: parseInt(newOrder.quantity, 10),
          shipping_cost: parseFloat(newOrder.shipping_cost || 0),
        }),
      });
      if (ok) {
        showToast(`Created order ${data.order?.order_number}`);
        setIsCreateOpen(false);
        loadOrders();
      } else {
        showToast(data.error || 'Could not create order', 'error');
      }
    } catch {
      showToast('Network error creating order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesTab =
        activeTab === 'All'
          ? true
          : activeTab === 'Unpaid'
          ? o.payment_status === 'Pending'
          : o.fulfillment_status === activeTab;

      const matchesQuery =
        !q ||
        o.order_number?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.email?.toLowerCase().includes(q) ||
        o.shipping_phone?.toLowerCase().includes(q);

      return matchesTab && matchesQuery;
    });
  }, [orders, activeTab, searchTerm]);

  const tabCount = (tab) => {
    if (tab === 'All') return orders.length;
    if (tab === 'Unpaid') return orders.filter((o) => o.payment_status === 'Pending').length;
    return orders.filter((o) => o.fulfillment_status === tab).length;
  };

  const handleExportCSV = () => {
    const headers = [
      'Order Number',
      'Date',
      'Customer',
      'Email',
      'Payment Status',
      'Fulfillment Status',
      'Total (KES)',
    ];
    const rows = filteredOrders.map((o) =>
      [
        o.order_number,
        new Date(o.date).toISOString().slice(0, 10),
        `"${o.customer?.name || 'Guest'}"`,
        o.customer?.email || '',
        o.payment_status,
        o.fulfillment_status,
        o.total_amount,
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `the-pink-edit-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported orders CSV');
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-[#C86D85]">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-7">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#141414]">Orders &amp; Fulfillment</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Track M-Pesa payments, dispatch Nairobi riders, and issue refunds with automatic restocking.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-none justify-center items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] hover:border-[#141414] transition-colors flex"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={openCreateModal}
            className="flex-1 md:flex-none justify-center items-center gap-2 bg-[#141414] hover:bg-[#C86D85] text-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors flex whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Create Order
          </button>
        </div>
      </div>

      {/* MAIN TABLE CONTAINER */}
      <div className="bg-white border border-stone-200 overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="flex border-b border-stone-200 px-4 text-xs font-medium text-stone-500 overflow-x-auto hide-scrollbar whitespace-nowrap">
          {TABS.map((tab) => {
            const count = tabCount(tab);
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-4 border-b-2 transition-colors shrink-0 flex items-center gap-2 ${
                  active
                    ? 'border-[#141414] text-[#141414] font-semibold'
                    : 'border-transparent hover:text-[#141414]'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    active ? 'bg-[#141414] text-white' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-stone-200 bg-[#FAF8F6] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search order #, customer name, email, or phone..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 text-xs focus:outline-none focus:border-[#141414]"
            />
          </div>
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="border-b border-stone-200 text-[10px] uppercase tracking-[0.2em] text-stone-400 bg-white">
                <th className="p-4 font-bold">Order ID</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Placed</th>
                <th className="p-4 font-bold">Items</th>
                <th className="p-4 font-bold">Fulfillment</th>
                <th className="p-4 font-bold">Payment</th>
                <th className="p-4 font-bold text-right">Total</th>
                <th className="p-4 font-bold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-stone-400 italic">
                    <ShoppingBag className="w-7 h-7 mx-auto mb-2 text-stone-300" />
                    No orders match this view.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="hover:bg-[#FAF8F6] cursor-pointer transition-colors group"
                  >
                    <td className="p-4 font-mono font-semibold text-[#C86D85] group-hover:underline">
                      {order.order_number}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#141414] text-[#F3CFD6] flex items-center justify-center text-xs font-serif shrink-0">
                          {order.customer?.name?.charAt(0) || 'G'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#141414] truncate">
                            {order.customer?.name || 'Guest User'}
                          </p>
                          <p className="text-[10px] text-stone-400 truncate">
                            {order.customer?.email || order.shipping_phone || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-stone-500 whitespace-nowrap">
                      {formatDate(order.date)}
                    </td>
                    <td className="p-4 text-stone-600">
                      {order.items_count || order.items?.length || 1} pcs
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] font-bold ${
                          order.fulfillment_status === 'Fulfilled'
                            ? 'bg-[#141414] text-white'
                            : order.fulfillment_status === 'Shipped'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : order.fulfillment_status === 'Processing'
                            ? 'bg-[#F7ECEF] text-[#A64D66]'
                            : order.fulfillment_status === 'Canceled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {order.fulfillment_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] font-bold ${
                          order.payment_status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.payment_status === 'Refunded'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {order.payment_status === 'Paid' && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-[#141414] whitespace-nowrap">
                      {formatKsh(order.total_amount)}
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center justify-center w-7 h-7 border border-stone-200 group-hover:border-[#141414] group-hover:bg-[#141414] group-hover:text-white transition-colors">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL CONCIERGE ORDER MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-lg border border-stone-200 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-stone-200 bg-[#FAF8F6] flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-2xl text-[#141414]">Create Concierge Order</h2>
                  <p className="text-[11px] text-stone-500">
                    Record a WhatsApp, Instagram DM, or in-salon purchase.
                  </p>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="text-stone-400 hover:text-[#141414]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                    Customer *
                  </label>
                  <select
                    required
                    value={newOrder.customer_id}
                    onChange={(e) => {
                      const picked = customers.find((c) => String(c.id) === e.target.value);
                      setNewOrder({
                        ...newOrder,
                        customer_id: e.target.value,
                        shipping_address: picked?.default_address || newOrder.shipping_address,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                    Product Variant *
                  </label>
                  <select
                    required
                    value={newOrder.variant_id}
                    onChange={(e) => setNewOrder({ ...newOrder, variant_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                  >
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newOrder.quantity}
                      onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Shipping (Ksh)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newOrder.shipping_cost}
                      onChange={(e) => setNewOrder({ ...newOrder, shipping_cost: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Payment
                    </label>
                    <select
                      value={newOrder.payment_status}
                      onChange={(e) => setNewOrder({ ...newOrder, payment_status: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={newOrder.shipping_address}
                    onChange={(e) => setNewOrder({ ...newOrder, shipping_address: e.target.value })}
                    placeholder="Westlands, Nairobi"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                  />
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 text-xs uppercase tracking-[0.18em] text-stone-500 hover:text-[#141414]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#141414] hover:bg-[#C86D85] text-white text-xs font-semibold uppercase tracking-[0.2em] inline-flex items-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Create Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}