import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, AlertCircle, Loader2, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    
    fetch('https://the-pink-edit-ke.onrender.com/api/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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

  // UPDATED: Formatting helper for Ksh currency
  const formatMoney = (amount) => `Ksh ${amount.toLocaleString()}`;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0">
      
      {/* MOBILE FIX: Stacked header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 lg:mb-8 gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-gray-900 mb-1 sm:mb-2">Executive Overview</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-light">Real-time performance analytics for your luxury collections.</p>
        </div>
        <button className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 md:py-2.5 rounded-sm text-xs sm:text-sm font-bold uppercase tracking-widest transition-colors">
          + New Entry
        </button>
      </div>

      {/* MOBILE FIX: Responsive Grid (1 col phone, 2 col tablet, 4 col desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {[
          { title: 'Total Revenue', value: formatMoney(stats.total_sales), icon: DollarSign, trend: '+12.5%' },
          { title: 'Pending Orders', value: stats.pending_orders, icon: ShoppingBag, trend: '+18.2%' },
          { title: 'Total Customers', value: stats.total_customers, icon: Users, trend: '+5.4%' },
          { title: 'Low Stock Alerts', value: stats.low_stock_items, icon: AlertCircle, trend: 'Action Needed', isAlert: true },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 lg:p-6 rounded-sm border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-sm ${stat.isAlert ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'}`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold ${stat.isAlert ? 'text-red-500' : 'text-gray-900'}`}>
                {!stat.isAlert && <ArrowUpRight className="w-3 h-3 text-gray-400" />} {stat.trend}
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">{stat.title}</p>
            <p className="text-xl sm:text-2xl font-serif text-gray-900 truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* MOBILE FIX: Grid layout stacks to 1 column on smaller screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Revenue Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white p-5 lg:p-6 rounded-sm border border-gray-100 shadow-sm min-h-[300px] lg:min-h-[400px]">
          <h3 className="text-base sm:text-lg font-serif text-gray-900 mb-1">Revenue Trends</h3>
          <p className="text-[10px] sm:text-xs text-gray-500 mb-6 lg:mb-8">Daily performance tracking</p>
          <div className="h-48 lg:h-64 flex items-center justify-center border border-dashed border-gray-200 rounded-sm bg-gray-50 text-xs sm:text-sm text-gray-400 text-center px-4">
            [Chart Integration Pending]
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="col-span-1 bg-white p-5 lg:p-6 rounded-sm border border-gray-100 shadow-sm">
          <h3 className="text-base sm:text-lg font-serif text-gray-900 mb-1">Category Breakdown</h3>
          <p className="text-[10px] sm:text-xs text-gray-500 mb-6 lg:mb-8">Order volume by department</p>
          
          <div className="space-y-5 lg:space-y-6">
            {[
              { name: 'Perfumes', width: '85%' },
              { name: 'Fine Jewellery', width: '60%' },
              { name: 'Accessories', width: '35%' },
              { name: 'Gift Sets', width: '20%' },
            ].map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-[10px] sm:text-xs mb-1 sm:mb-2">
                  <span className="font-medium text-gray-700">{cat.name}</span>
                </div>
                <div className="w-full h-6 sm:h-8 bg-gray-100 rounded-sm overflow-hidden">
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