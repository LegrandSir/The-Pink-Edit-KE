import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Truck,
  RotateCcw,
  Save,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { apiFetch, FALLBACK_IMAGE, formatKsh } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [fulfillmentStatus, setFulfillmentStatus] = useState('Unfulfilled');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    try {
      const { ok, status, data } = await apiFetch(`/api/admin/orders/${id}`, { auth: 'admin' });
      if (status === 401 || status === 403) {
        localStorage.removeItem('adminToken');
        navigate('/admin', { replace: true });
        return;
      }
      if (ok && !data.error) {
        setOrder(data);
        setFulfillmentStatus(data.fulfillment_status || 'Unfulfilled');
        setTrackingNumber(data.tracking_number || '');
        setShippingAddress(data.shipping_address || '');
        setNotes(data.notes || '');
      } else {
        setOrder({ error: data.error || 'Order not found' });
      }
    } catch {
      showToast('Failed to load order details', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const patchOrder = async (payload, successMsg) => {
    setIsUpdating(true);
    try {
      const { ok, data } = await apiFetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        auth: 'admin',
        body: JSON.stringify(payload),
      });
      if (ok && data.order) {
        setOrder(data.order);
        setFulfillmentStatus(data.order.fulfillment_status);
        setTrackingNumber(data.order.tracking_number || '');
        setShippingAddress(data.order.shipping_address || '');
        setNotes(data.order.notes || '');
        showToast(successMsg);
      } else {
        showToast(data.error || 'Could not update order', 'error');
      }
    } catch {
      showToast('Network error updating order', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveLogistics = (e) => {
    e.preventDefault();
    patchOrder(
      {
        fulfillment_status: fulfillmentStatus,
        tracking_number: trackingNumber.trim() || null,
        shipping_address: shippingAddress.trim() || null,
        notes: notes.trim() || null,
      },
      'Order logistics updated'
    );
  };

  const handleRefund = () => {
    if (!window.confirm('Issue refund and return all line items back to available stock?')) return;
    patchOrder(
      { payment_status: 'Refunded', fulfillment_status: 'Canceled' },
      'Order refunded and inventory restocked'
    );
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-[#C86D85]">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  if (!order || order.error) {
    return (
      <div className="bg-white border border-stone-200 p-12 text-center">
        <p className="text-rose-600 text-sm mb-4">Order not found.</p>
        <Link
          to="/admin/orders"
          className="bg-[#141414] text-white px-6 py-2.5 text-xs uppercase tracking-[0.2em]"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const latestPayment = order.payments?.[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-stone-500 hover:text-[#141414] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {/* HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <h1 className="text-3xl font-serif text-[#141414]">{order.order_number}</h1>
            <span
              className={`px-2.5 py-1 text-[9px] uppercase font-bold tracking-[0.18em] ${
                order.payment_status === 'Paid'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : order.payment_status === 'Refunded'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {order.payment_status}
            </span>
            <span
              className={`px-2.5 py-1 text-[9px] uppercase font-bold tracking-[0.18em] ${
                order.fulfillment_status === 'Fulfilled'
                  ? 'bg-[#141414] text-white'
                  : order.fulfillment_status === 'Canceled'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-[#F7ECEF] text-[#A64D66]'
              }`}
            >
              {order.fulfillment_status}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Placed on {new Date(order.date).toLocaleString('en-KE')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {order.payment_status === 'Pending' && (
            <button
              disabled={isUpdating}
              onClick={() => patchOrder({ payment_status: 'Paid' }, 'Payment marked as Paid')}
              className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold uppercase tracking-[0.18em] inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <CreditCard className="w-3.5 h-3.5" /> Mark Paid
            </button>
          )}
          {order.payment_status !== 'Refunded' && (
            <button
              disabled={isUpdating}
              onClick={handleRefund}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-stone-300 text-stone-700 hover:border-rose-600 hover:text-rose-700 text-[11px] font-semibold uppercase tracking-[0.18em] inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refund &amp; Restock
            </button>
          )}
          {order.fulfillment_status !== 'Fulfilled' && order.fulfillment_status !== 'Canceled' && (
            <button
              disabled={isUpdating}
              onClick={() =>
                patchOrder(
                  {
                    fulfillment_status: 'Fulfilled',
                    tracking_number:
                      trackingNumber.trim() || `TPE-NBO-${order.order_number.slice(-4)}`,
                  },
                  'Order marked as Fulfilled'
                )
              }
              className="flex-1 md:flex-none px-5 py-2.5 bg-[#141414] hover:bg-[#C86D85] text-white text-[11px] font-semibold uppercase tracking-[0.18em] inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Fulfilled
            </button>
          )}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          {/* Items Card */}
          <div className="bg-white border border-stone-200 p-6">
            <div className="flex justify-between items-center border-b border-stone-200 pb-4 mb-5">
              <h2 className="font-serif text-xl text-[#141414]">Order Items</h2>
              <span className="text-xs text-stone-400">
                {order.items_count || order.items?.length || 0} units
              </span>
            </div>
            <div className="divide-y divide-stone-100">
              {(order.items || []).map((item) => (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 flex justify-between items-center gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-16 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                      <img
                        src={item.image_url || FALLBACK_IMAGE}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-lg text-[#141414] truncate">
                        {item.product_name}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {item.size ? `${item.size} · ` : ''}SKU{' '}
                        <span className="font-mono">{item.sku}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-stone-400">
                      {formatKsh(item.price)} × {item.quantity}
                    </p>
                    <p className="font-semibold text-sm text-[#141414] mt-0.5">
                      {formatKsh(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fulfillment & Tracking Editor */}
          <form onSubmit={handleSaveLogistics} className="bg-white border border-stone-200 p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-stone-200 pb-4">
              <h2 className="font-serif text-xl text-[#141414] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C86D85]" /> Fulfillment &amp; Courier Tracking
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                  Fulfillment Stage
                </label>
                <select
                  value={fulfillmentStatus}
                  onChange={(e) => setFulfillmentStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                >
                  <option value="Unfulfilled">Unfulfilled</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped (Out for Delivery)</option>
                  <option value="Fulfilled">Fulfilled (Delivered)</option>
                  <option value="Canceled">Canceled (Restock Items)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                  Courier Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TPE-NBO-4821"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs font-mono outline-none focus:border-[#141414]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                Delivery Address
              </label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                Gift / Dispatch Notes
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal dispatch or rider notes..."
                className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414] resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2.5 bg-[#141414] hover:bg-[#C86D85] text-white text-[11px] font-semibold uppercase tracking-[0.18em] inline-flex items-center gap-2 transition-colors disabled:opacity-60"
              >
                {isUpdating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Logistics
              </button>
            </div>
          </form>

          {/* Activity Timeline */}
          <div className="bg-white border border-stone-200 p-6">
            <h2 className="font-serif text-xl text-[#141414] border-b border-stone-200 pb-4 mb-5">
              Fulfillment Activity
            </h2>
            <div className="relative border-l border-stone-200 ml-3 space-y-6 pb-1">
              <div className="relative pl-7">
                <span className="absolute -left-2.5 top-0 bg-emerald-600 text-white p-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                </span>
                <p className="font-semibold text-xs text-[#141414]">Order Placed</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Created via {order.payment_method === 'mpesa' ? 'M-Pesa Express' : 'Pay on Delivery'}.
                </p>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">
                  {new Date(order.date).toLocaleString('en-KE')}
                </p>
              </div>

              <div className="relative pl-7">
                <span
                  className={`absolute -left-2.5 top-0 p-1 rounded-full ${
                    order.fulfillment_status === 'Fulfilled'
                      ? 'bg-[#141414] text-[#E8B4BC]'
                      : order.fulfillment_status === 'Canceled'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white border-2 border-[#C86D85] text-[#C86D85]'
                  }`}
                >
                  {order.fulfillment_status === 'Fulfilled' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : order.fulfillment_status === 'Canceled' ? (
                    <XCircle className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                </span>
                <p className="font-semibold text-xs text-[#141414]">
                  Current Stage: {order.fulfillment_status}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {order.tracking_number
                    ? `Assigned courier tracking reference ${order.tracking_number}.`
                    : 'Assign a courier tracking reference above when dispatching.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Card */}
          <div className="bg-white border border-stone-200 overflow-hidden">
            <div className="bg-[#141414] text-white p-5 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#C86D85] text-white flex items-center justify-center font-serif text-lg shrink-0">
                {order.customer?.name?.charAt(0) || '?'}
              </div>
              <div className="min-w-0">
                <p className="font-serif text-xl truncate">
                  {order.customer?.name || 'Guest User'}
                </p>
                <p className="text-[11px] text-[#E8B4BC] truncate">
                  {order.customer?.status || 'Customer'} · {order.customer?.orders_count || 1} orders
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs text-stone-600">
              {order.customer?.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#C86D85] shrink-0" />
                  <span className="truncate">{order.customer.email}</span>
                </div>
              )}
              {(order.shipping_phone || order.customer?.phone_number) && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#C86D85] shrink-0" />
                  <span>{order.shipping_phone || order.customer?.phone_number}</span>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C86D85] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 font-bold mb-0.5">
                    {order.delivery_method || 'Shipping Address'}
                  </p>
                  <p className="text-stone-700 leading-relaxed">
                    {order.shipping_address || 'No address specified'}
                  </p>
                </div>
              </div>

              {order.customer?.email && (
                <a
                  href={`mailto:${order.customer.email}?subject=Your%20The%20Pink%20Edit%20Order%20${order.order_number}`}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 border border-stone-200 text-[10px] font-bold uppercase tracking-[0.2em] text-[#141414] hover:border-[#141414] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> Email Customer
                </a>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-stone-200 p-6">
            <h3 className="font-serif text-xl text-[#141414] border-b border-stone-200 pb-3.5 mb-4">
              Payment Summary
            </h3>
            <div className="space-y-2.5 text-xs text-stone-600 mb-5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatKsh(order.subtotal ?? order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {order.shipping_cost === 0 ? 'Complimentary' : formatKsh(order.shipping_cost)}
                </span>
              </div>
              <div className="flex justify-between font-serif text-xl text-[#141414] pt-3 border-t border-stone-200">
                <span>Total</span>
                <span className="font-semibold">{formatKsh(order.total_amount)}</span>
              </div>
            </div>

            <div className="bg-[#FAF8F6] p-3.5 border border-stone-200 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-500">Method</span>
                <span className="font-semibold uppercase text-[#141414]">
                  {order.payment_method === 'mpesa' ? 'M-Pesa Express' : 'Pay on Delivery'}
                </span>
              </div>
              {latestPayment?.transaction_reference && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Reference</span>
                  <span className="font-mono font-semibold text-[#141414]">
                    {latestPayment.transaction_reference}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}