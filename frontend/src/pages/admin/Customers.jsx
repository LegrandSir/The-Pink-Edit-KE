import React, { useState, useEffect } from 'react';
import { Download, Plus, Search, Filter, Loader2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    
    fetch('https://the-pink-edit-ke.onrender.com/api/admin/customers', {
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
          setCustomers(data);
        } else {
          setCustomers([]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [navigate]);

  if (isLoading) return <div className="h-full flex items-center justify-center text-pink-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 px-2 sm:px-0">
      
      {/* MOBILE FIX: Stacked header on small screens */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-gray-900 mb-1 sm:mb-2">Customer Database</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-light">Manage your relationships and view customer lifetime insights.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
          <button className="flex-1 sm:flex-none justify-center items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-sm text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-gray-50 flex">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="flex-1 sm:flex-none justify-center items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-sm text-xs sm:text-sm font-bold uppercase tracking-widest flex">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-gray-100 shadow-sm">
        
        {/* MOBILE FIX: Stacked filters and search */}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50/50">
          <div className="flex gap-2 flex-wrap">
            {['All Customers', 'VIP', 'Returning', 'New'].map((tab, i) => (
              <button key={tab} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${i === 0 ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search name or email..." className="w-full pl-10 pr-4 py-2 lg:py-1.5 bg-white border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-300"/>
          </div>
        </div>

        {/* Table wrapper for horizontal scrolling on mobile */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-500 bg-white">
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Email</th>
                <th className="p-4 font-bold">Orders</th>
                <th className="p-4 font-bold">Total Spent</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 italic">No customers found.</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0">{c.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm sm:text-base">{c.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">ID: CUS-{c.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"/> {c.email}</div>
                  </td>
                  <td className="p-4 text-xs sm:text-sm font-medium">{c.orders_count}</td>
                  {/* Currency updated to Ksh */}
                  <td className="p-4 text-xs sm:text-sm font-bold text-gray-900">Ksh {c.total_spent.toLocaleString()}</td>
                  <td className="p-4">
                     <span className={`px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest font-bold whitespace-nowrap ${
                      c.status === 'VIP' ? 'bg-pink-500 text-white' : 
                      c.status === 'New' ? 'bg-green-100 text-green-700' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {c.status}
                    </span>
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