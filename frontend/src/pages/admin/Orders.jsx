import React, { useState, useEffect } from 'react';
import { Download, Plus, Search, Calendar, MoreHorizontal, Loader2, CheckCircle2 } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom'; 

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); 

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    
    fetch('http://https://the-pink-edit-ke.onrender.com:5000/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin');
          throw new Error("Unauthorized - Redirecting to login");
        }
        return res.json();
      })
      .then(data => {
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

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-pink-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 px-2 sm:px-0">
      
      {/* MOBILE FIX: Stacked Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-gray-900 mb-1 sm:mb-2">Orders</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-light">Manage your customer transactions, fulfillments, and payments in one place.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
          <button className="flex-1 sm:flex-none justify-center items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-sm text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors flex">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="flex-1 sm:flex-none justify-center items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-sm text-xs sm:text-sm font-bold uppercase tracking-widest transition-colors flex whitespace-nowrap">
             Create Order
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden">
        
        {/* MOBILE FIX: Horizontally scrollable tabs */}
        <div className="flex border-b border-gray-100 px-4 text-xs sm:text-sm font-medium text-gray-500 overflow-x-auto hide-scrollbar whitespace-nowrap">
            {['All Orders', 'Unfulfilled', 'Unpaid', 'Open', 'Closed'].map((tab, i) => (
                <button key={tab} className={`px-3 sm:px-4 py-3 sm:py-4 border-b-2 transition-colors flex-shrink-0 ${i === 0 ? 'border-pink-500 text-gray-900' : 'border-transparent hover:text-gray-900 hover:border-gray-300'}`}>
                    {tab} {i === 1 && <span className="ml-1 bg-gray-100 text-gray-600 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full">12</span>}
                </button>
            ))}
        </div>

        {/* MOBILE FIX: Stacked Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center bg-gray-50/50">
          <div className="relative flex-1 w-full max-w-none sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Order ID, Customer..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-sm text-xs sm:text-sm focus:outline-none focus:border-pink-300"
            />
          </div>
          <button className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-sm hover:bg-gray-50 w-full sm:w-auto">
               <Calendar className="w-4 h-4"/> Date Range
          </button>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 bg-white">
                <th className="p-3 sm:p-4 font-bold w-10"><input type="checkbox" className="accent-pink-500" /></th>
                <th className="p-3 sm:p-4 font-bold">Order ID</th>
                <th className="p-3 sm:p-4 font-bold">Customer</th>
                <th className="p-3 sm:p-4 font-bold">Date</th>
                <th className="p-3 sm:p-4 font-bold">Fulfillment</th>
                <th className="p-3 sm:p-4 font-bold">Payment</th>
                <th className="p-3 sm:p-4 font-bold">Total</th>
                <th className="p-3 sm:p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-500 italic">No orders found.</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 sm:p-4"><input type="checkbox" className="accent-pink-500" /></td>
                  <td className="p-3 sm:p-4 font-medium text-pink-500 cursor-pointer hover:underline text-xs sm:text-sm">{order.order_number}</td>
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-600 flex-shrink-0">
                        {order.customer ? order.customer.name.charAt(0) : 'G'}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{order.customer ? order.customer.name : 'Guest User'}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">{order.customer ? order.customer.email : 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 sm:p-4 text-[10px] sm:text-xs text-gray-600 whitespace-nowrap">{formatDate(order.date)}</td>
                  
                  {/* Fulfillment Badge */}
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest font-bold border flex items-center w-max gap-1 ${
                      order.fulfillment_status === 'Fulfilled' ? 'bg-gray-100 text-gray-700 border-gray-200' : 
                      order.fulfillment_status === 'Partially Fulfilled' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                      'bg-white text-gray-600 border-gray-300'
                    }`}>
                      <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${order.fulfillment_status === 'Unfulfilled' ? 'bg-gray-400' : 'hidden'}`}></div>
                      {order.fulfillment_status}
                    </span>
                  </td>

                  {/* Payment Badge */}
                  <td className="p-3 sm:p-4">
                     <span className={`px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest font-bold border flex items-center w-max gap-1 ${
                      order.payment_status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 
                      order.payment_status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                        {order.payment_status === 'Paid' && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600"/>}
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">Ksh {order.total_amount.toLocaleString()}</td>
                  <td className="p-3 sm:p-4 text-center">
                    <button className="text-gray-400 hover:text-gray-900"><MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" /></button>
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