import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  Plus,
  RefreshCw,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { apiFetch, formatKsh } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-[#141414] text-[#FAF8F6] px-4 py-3 shadow-xl border border-stone-800 text-xs">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8B4BC] mb-1">{label}</p>
      <p className="font-serif text-lg">{formatKsh(point.revenue)}</p>
      <p className="text-[11px] text-stone-400 mt-0.5">
        {point.orders} {point.orders === 1 ? 'paid order' : 'paid orders'}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [restockingId, setRestockingId] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { ok, status, data } = await apiFetch('/api/admin/dashboard/stats', {
        auth: 'admin',
      });
      if (status === 401 || status === 403) {
        localStorage.removeItem('adminToken');
        navigate('/admin', { replace: true });
        return;
      }
      if (ok) {
        setStats(data);
      } else {
        showToast(data.error || 'Failed to load analytics', 'error');
      }
    } catch {
      showToast('Unable to reach analytics server', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showToast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleQuickRestock = async (variant) => {
    setRestockingId(variant.id);
    try {
      const { ok, data } = await apiFetch(`/api/admin/variants/${variant.id}/stock`, {
        method: 'PATCH',
        auth: 'admin',
        body: JSON.stringify({ delta: 10 }),
      });
      if (ok) {
        showToast(`Added +10 units to ${variant.product_name} (${variant.size})`);
        loadStats();
      } else {
        showToast(data.error || 'Restock failed', 'error');
      }
    } catch {
      showToast('Network error during restock', 'error');
    } finally {
      setRestockingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white border border-stone-200" />
          ))}
        </div>
        <div className="h-80 bg-white border border-stone-200" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white border border-stone-200 p-12 text-center">
        <p className="text-sm text-stone-500 mb-4">Analytics data could not be loaded.</p>
        <button
          onClick={loadStats}
          className="bg-[#141414] text-white px-6 py-2.5 text-xs uppercase tracking-[0.2em]"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Paid Revenue',
      value: formatKsh(stats.total_sales),
      sub: `Avg. Order ${formatKsh(stats.avg_order_value)}`,
      icon: TrendingUp,
      to: '/admin/orders',
    },
    {
      title: 'Orders to Fulfill',
      value: stats.pending_orders,
      sub: `${stats.total_orders} total orders placed`,
      icon: ShoppingBag,
      to: '/admin/orders',
    },
    {
      title: 'Clientele',
      value: stats.total_customers,
      sub: 'Registered accounts',
      icon: Users,
      to: '/admin/customers',
    },
    {
      title: 'Low Stock Alerts',
      value: stats.low_stock_items,
      sub: stats.low_stock_items > 0 ? 'SKUs below 8 units' : 'All inventory healthy',
      icon: AlertTriangle,
      alert: stats.low_stock_items > 0,
      to: '/admin/products',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#141414]">
            Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Live revenue performance, fulfillment queue, and inventory health across The Pink Edit.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={loadStats}
            className="px-4 py-2.5 bg-white border border-stone-200 text-stone-600 hover:border-[#141414] hover:text-[#141414] text-[11px] font-semibold uppercase tracking-[0.18em] inline-flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link
            to="/admin/products"
            className="flex-1 sm:flex-none px-5 py-2.5 bg-[#141414] hover:bg-[#C86D85] text-white text-[11px] font-semibold uppercase tracking-[0.18em] inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className="group bg-white p-6 border border-stone-200 hover:border-[#141414] transition-colors flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-2.5 ${
                    card.alert
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-[#FAF8F6] text-[#141414]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-[#C86D85] transition-colors" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-bold mb-1">
                  {card.title}
                </p>
                <p className="text-2xl sm:text-3xl font-serif text-[#141414] truncate">
                  {card.value}
                </p>
                <p
                  className={`text-[11px] mt-1.5 ${
                    card.alert ? 'text-amber-700 font-medium' : 'text-stone-500'
                  }`}
                >
                  {card.sub}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ANALYTICS ROW: RECHARTS + CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 14-Day Revenue Chart */}
        <div className="lg:col-span-8 bg-white p-6 border border-stone-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-serif text-[#141414]">14-Day Revenue Trajectory</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Daily paid order volume (KES) from Neon Postgres
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 bg-[#F7ECEF] text-[#A64D66] font-semibold">
              Live Data
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.revenue_trend || []}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="roseRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C86D85" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#C86D85" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECE8E3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#78716C' }}
                  axisLine={{ stroke: '#E7E5E4' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716C' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#C86D85"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#roseRevenue)"
                  activeDot={{ r: 5, fill: '#141414', stroke: '#FAF8F6', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-4 bg-white p-6 border border-stone-200 flex flex-col">
          <h3 className="text-xl font-serif text-[#141414]">Department Mix</h3>
          <p className="text-xs text-stone-500 mt-0.5 mb-6">
            Share of paid revenue by product line
          </p>

          {stats.category_breakdown?.length ? (
            <div className="space-y-5 flex-1">
              {stats.category_breakdown.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between items-baseline text-xs mb-1.5">
                    <span className="font-semibold text-[#141414]">{cat.name}</span>
                    <span className="text-stone-500">
                      {formatKsh(cat.revenue)} ({cat.share}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-[#141414] transition-all duration-700"
                      style={{ width: `${Math.max(6, cat.bar_width)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    {cat.units} {cat.units === 1 ? 'unit' : 'units'} sold
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic my-auto text-center">
              No paid category data yet.
            </p>
          )}
        </div>
      </div>

      {/* OPERATIONS ROW: RECENT ORDERS + LOW STOCK ACTION QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-white border border-stone-200">
          <div className="p-5 border-b border-stone-200 flex justify-between items-center">
            <div>
              <h3 className="font-serif text-xl text-[#141414]">Recent Orders</h3>
              <p className="text-[11px] text-stone-500">Click any order to inspect or fulfill</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C86D85] hover:text-[#141414]"
            >
              All Orders →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] uppercase tracking-[0.18em] text-stone-400">
                  <th className="p-4 font-semibold">Order</th>
                  <th className="p-4 font-semibold">Client</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {(stats.recent_orders || []).map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="hover:bg-[#FAF8F6] cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-mono font-semibold text-[#C86D85]">
                      {order.order_number}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-[#141414]">
                        {order.customer?.name || 'Guest'}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {new Date(order.date).toLocaleDateString('en-KE', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 text-[9px] uppercase tracking-[0.16em] font-bold ${
                          order.fulfillment_status === 'Fulfilled'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.fulfillment_status === 'Canceled'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {order.fulfillment_status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-[#141414] whitespace-nowrap">
                      {formatKsh(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Action Queue */}
        <div className="lg:col-span-5 bg-white border border-stone-200 flex flex-col">
          <div className="p-5 border-b border-stone-200 flex justify-between items-center">
            <div>
              <h3 className="font-serif text-xl text-[#141414]">Inventory Watchlist</h3>
              <p className="text-[11px] text-stone-500">SKUs running low on available stock</p>
            </div>
            <Link
              to="/admin/products"
              className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C86D85] hover:text-[#141414]"
            >
              Manage →
            </Link>
          </div>

          <div className="p-5 space-y-3 flex-1">
            {stats.low_stock_list?.length ? (
              stats.low_stock_list.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3.5 bg-[#FAF8F6] border border-stone-200/80"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-xs text-[#141414] truncate">
                      {item.product_name}
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5 font-mono">
                      {item.size} · {item.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-bold ${
                        item.available_stock === 0 ? 'text-rose-600' : 'text-amber-700'
                      }`}
                    >
                      {item.available_stock} left
                    </span>
                    <button
                      onClick={() => handleQuickRestock(item)}
                      disabled={restockingId === item.id}
                      className="px-2.5 py-1.5 bg-[#141414] hover:bg-[#C86D85] text-white text-[10px] uppercase tracking-wider font-semibold transition-colors disabled:opacity-50"
                    >
                      {restockingId === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        '+10'
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 text-stone-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                <p className="text-xs font-medium text-[#141414]">Inventory Healthy</p>
                <p className="text-[11px] mt-0.5">Every active SKU has 8+ units ready.</p>
              </div>
            )}
          </div>

          <div className="px-5 py-3.5 border-t border-stone-100 bg-[#FAF8F6] flex items-center gap-2 text-[11px] text-stone-500">
            <Package className="w-3.5 h-3.5 text-[#C86D85]" />
            <span>Restocking updates live storefront stock counts instantly.</span>
          </div>
        </div>
      </div>
    </div>
  );
}