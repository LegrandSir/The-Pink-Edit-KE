import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, AlertCircle, Loader2, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 1. Added Navigator Import

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); // 2. Initialized Navigator

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    
    fetch('http://127.0.0.1:5000/api/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
        // 4. Crash Prevention: Only set if we got valid object data
        if (data && !data.error) {
          setStats(data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch stats", err);
        setIsLoading(false);
      });
  }, [navigate]);

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-pink-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  // Formatting helper for currency
  const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif text-gray-900 mb-2">Executive Overview</h1>
          <p className="text-sm text-gray-500 font-light">Real-time performance analytics for your luxury collections.</p>
        </div>
        <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2.5 rounded-sm text-sm font-bold uppercase tracking-widest transition-colors">
          + New Entry
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Revenue', value: formatMoney(stats.total_sales), icon: DollarSign, trend: '+12.5%' },
          { title: 'Pending Orders', value: stats.pending_orders, icon: ShoppingBag, trend: '+18.2%' },
          { title: 'Total Customers', value: stats.total_customers, icon: Users, trend: '+5.4%' },
          { title: 'Low Stock Alerts', value: stats.low_stock_items, icon: AlertCircle, trend: 'Action Needed', isAlert: true },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-sm border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-sm ${stat.isAlert ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold ${stat.isAlert ? 'text-red-500' : 'text-gray-900'}`}>
                {!stat.isAlert && <ArrowUpRight className="w-3 h-3 text-gray-400" />} {stat.trend}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">{stat.title}</p>
            <p className="text-2xl font-serif text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout for Charts/Tables */}
      <div className="grid grid-cols-3 gap-8">
        
        {/* Placeholder for Revenue Chart */}
        <div className="col-span-2 bg-white p-6 rounded-sm border border-gray-100 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-serif text-gray-900 mb-1">Revenue Trends</h3>
          <p className="text-xs text-gray-500 mb-8">Daily performance tracking</p>
          <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 rounded-sm bg-gray-50 text-sm text-gray-400">
            [Chart Integration Pending]
          </div>
        </div>

        {/* Category Breakdown (Simple CSS Bars) */}
        <div className="col-span-1 bg-white p-6 rounded-sm border border-gray-100 shadow-sm">
          <h3 className="text-lg font-serif text-gray-900 mb-1">Category Breakdown</h3>
          <p className="text-xs text-gray-500 mb-8">Order volume by department</p>
          
          <div className="space-y-6">
            {[
              { name: 'Perfumes', width: '85%' },
              { name: 'Fine Jewellery', width: '60%' },
              { name: 'Accessories', width: '35%' },
              { name: 'Gift Sets', width: '20%' },
            ].map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium text-gray-700">{cat.name}</span>
                </div>
                <div className="w-full h-8 bg-gray-100 rounded-sm overflow-hidden">
                  <div className="h-full bg-pink-500" style={{ width: cat.width }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}