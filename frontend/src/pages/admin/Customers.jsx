import React, { useState, useEffect } from 'react';
import { Download, Plus, Search, Filter, Loader2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    
    fetch('http://127.0.0.1:5000/api/admin/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        // 3. The Security Check! If token is dead, kick them out.
        if (res.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin');
          throw new Error("Unauthorized - Redirecting to login");
        }
        return res.json();
      })
      .then(data => {
        // 4. The Crash Prevention Check! Only set if it's a real array.
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
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-gray-900 mb-2">Customer Database</h1>
          <p className="text-sm text-gray-500 font-light">Manage your relationships and view customer lifetime insights.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex gap-2">
            {['All Customers', 'VIP', 'Returning', 'New'].map((tab, i) => (
              <button key={tab} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${i === 0 ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search name or email..." className="w-full pl-10 pr-4 py-1.5 bg-white border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-300"/>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                      <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-lg">{c.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">ID: CUS-{c.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400"/> {c.email}</td>
                  <td className="p-4 text-sm font-medium">{c.orders_count}</td>
                  <td className="p-4 text-sm font-bold text-gray-900">${c.total_spent.toFixed(2)}</td>
                  <td className="p-4">
                     <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${
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