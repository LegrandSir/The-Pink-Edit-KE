import React, { useState, useEffect } from 'react';
import { Download, Plus, Search, Calendar, MoreHorizontal, Loader2, CheckCircle2 } from 'lucide-react'; // Ensure CheckCircle2 is imported if you use it in the UI!
import { useNavigate } from 'react-router-dom'; // 1. Added Navigator Import

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); // 2. Initialized Navigator

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    
    fetch('http://127.0.0.1:5000/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        // 3. Security Check: Kick to login if token is dead
        if (res.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin');
          throw new Error("Unauthorized - Redirecting to login");
        }
        return res.json();
      })
      .then(data => {
        // 4. Crash Prevention: Only set if it's a real array
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [navigate]);

  // ... (Keep your formatDate function and the entire return statement below here) ...

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-pink-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  // Format Date Helper
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-gray-900 mb-2">Orders</h1>
          <p className="text-sm text-gray-500 font-light">Manage your customer transactions, fulfillments, and payments in one place.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest transition-colors">
             Create Order
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-sm border border-gray-100 shadow-sm">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 text-sm font-medium text-gray-500">
            {['All Orders', 'Unfulfilled', 'Unpaid', 'Open', 'Closed'].map((tab, i) => (
                <button key={tab} className={`px-4 py-4 border-b-2 transition-colors ${i === 0 ? 'border-pink-500 text-gray-900' : 'border-transparent hover:text-gray-900 hover:border-gray-300'}`}>
                    {tab} {i === 1 && <span className="ml-1 bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">12</span>}
                </button>
            ))}
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex gap-4 items-center bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Order ID, Customer, or Email..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-300"
            />
          </div>
          <button className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-sm hover:bg-gray-50">
               <Calendar className="w-4 h-4"/> Date Range
          </button>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-500 bg-white">
                <th className="p-4 font-bold w-10"><input type="checkbox" className="accent-pink-500" /></th>
                <th className="p-4 font-bold">Order ID</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Fulfillment</th>
                <th className="p-4 font-bold">Payment</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-500 italic">No orders found.</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4"><input type="checkbox" className="accent-pink-500" /></td>
                  <td className="p-4 font-medium text-pink-500 cursor-pointer hover:underline">{order.order_number}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {order.customer ? order.customer.name.charAt(0) : 'G'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.customer ? order.customer.name : 'Guest User'}</p>
                        <p className="text-xs text-gray-500">{order.customer ? order.customer.email : 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{formatDate(order.date)}</td>
                  
                  {/* Fulfillment Badge */}
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border flex items-center w-max gap-1 ${
                      order.fulfillment_status === 'Fulfilled' ? 'bg-gray-100 text-gray-700 border-gray-200' : 
                      order.fulfillment_status === 'Partially Fulfilled' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                      'bg-white text-gray-600 border-gray-300'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${order.fulfillment_status === 'Unfulfilled' ? 'bg-gray-400' : 'hidden'}`}></div>
                      {order.fulfillment_status}
                    </span>
                  </td>

                  {/* Payment Badge */}
                  <td className="p-4">
                     <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border flex items-center w-max gap-1 ${
                      order.payment_status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 
                      order.payment_status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                       {order.payment_status === 'Paid' && <CheckCircle2 className="w-3 h-3 text-green-600"/>}
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-bold text-gray-900">${order.total_amount.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <button className="text-gray-400 hover:text-gray-900"><MoreHorizontal className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}