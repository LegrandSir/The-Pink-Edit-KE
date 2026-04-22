import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Edit, CheckCircle2, Clock, MapPin, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch(`http://127.0.0.1:5000/api/admin/orders/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setIsLoading(false);
      })
      .catch(err => console.error(err));
  }, [id]);

  if (isLoading) return <div className="h-full flex items-center justify-center text-pink-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (order.error) return <div className="p-8 text-red-500">Order not found.</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/admin/orders" className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-pink-500 transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-serif text-gray-900">{order.order_number}</h1>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-sm text-[10px] uppercase font-bold tracking-widest border border-gray-200">{order.payment_status}</span>
            <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-sm text-[10px] uppercase font-bold tracking-widest border border-yellow-200">{order.fulfillment_status}</span>
          </div>
          <p className="text-sm text-gray-500">Placed on {new Date(order.date).toLocaleString()}</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-sm text-sm font-bold tracking-widest hover:bg-gray-50">Refund</button>
          <button className="bg-pink-500 text-white px-4 py-2 rounded-sm text-sm font-bold tracking-widest hover:bg-pink-600">Mark as Fulfilled</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Items Card */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-sm p-6">
            <h3 className="font-serif text-lg border-b border-gray-100 pb-4 mb-4 flex justify-between">
              Items & Inventory <span className="text-sm text-gray-400 font-sans">{order.items?.length || 0} Items</span>
            </h3>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-sm"></div>
                    <div>
                      <p className="font-bold text-gray-900">{item.product_name}</p>
                      <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">${item.price.toFixed(2)} x {item.quantity}</p>
                    <p className="font-bold text-gray-900 mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500 italic">No items linked to this order.</p>}
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-sm p-6">
            <h3 className="font-serif text-lg border-b border-gray-100 pb-4 mb-6">Fulfillment Activity</h3>
            <div className="relative border-l border-gray-200 ml-3 space-y-8 pb-4">
              
              <div className="relative pl-8">
                <span className="absolute -left-3 top-0 bg-green-500 text-white p-1 rounded-full"><CheckCircle2 className="w-4 h-4"/></span>
                <p className="font-bold text-sm text-gray-900">Order Placed</p>
                <p className="text-xs text-gray-500 mt-1">Customer placed order through the online storefront.</p>
                <p className="text-[10px] uppercase text-gray-400 mt-2 tracking-widest">{new Date(order.date).toLocaleString()}</p>
              </div>

              <div className="relative pl-8">
                <span className="absolute -left-3 top-0 bg-white border-2 border-gray-300 text-gray-400 p-1 rounded-full"><Clock className="w-4 h-4"/></span>
                <p className="font-bold text-sm text-gray-900">Fulfillment Pending</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting staff to pack and ship items.</p>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Customer & Payment */}
        <div className="space-y-6">
          
          {/* Customer Card */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-pink-50 p-6 flex items-center gap-4 border-b border-pink-100">
              <div className="w-12 h-12 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center font-bold text-xl">
                {order.customer ? order.customer.name.charAt(0) : '?'}
              </div>
              <div>
                <p className="font-serif text-lg font-bold text-gray-900">{order.customer ? order.customer.name : 'Guest User'}</p>
                <p className="text-xs text-pink-600">{order.customer ? order.customer.email : 'No email attached'}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Shipping Address</p>
                  <Edit className="w-3 h-3 text-gray-400 cursor-pointer hover:text-pink-500"/>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  123 Luxury Lane<br/>Nairobi, 00100<br/>Kenya
                </p>
              </div>
              
              <button className="w-full flex justify-center items-center gap-2 py-2 border border-gray-200 rounded-sm text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50">
                <Mail className="w-4 h-4"/> Message Customer
              </button>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-sm p-6">
            <h3 className="font-serif text-lg border-b border-gray-100 pb-4 mb-4">Payment Summary</h3>
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between"><span>Subtotal</span><span>${order.total_amount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>$0.00</span></div>
              <div className="flex justify-between font-serif text-lg text-gray-900 pt-3 border-t border-gray-100">
                <span>Total</span><span className="text-pink-500 font-bold">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-sm border border-gray-200 flex justify-between items-center">
               <span className="text-xs font-bold text-gray-700">M-Pesa Express</span>
               <span className="text-[10px] uppercase bg-white border border-gray-200 px-2 py-1 rounded-sm tracking-widest font-bold">Authorized</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}