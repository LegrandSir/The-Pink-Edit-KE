import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Plus, Search, Loader2, Mail, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiFetch, formatKsh } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const TIERS = ['All', 'VIP', 'Regular', 'New'];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTier, setActiveTier] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    default_address: '',
    status: 'New',
  });

  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { ok, status, data } = await apiFetch('/api/admin/customers', { auth: 'admin' });
      if (status === 401 || status === 403) {
        localStorage.removeItem('adminToken');
        navigate('/admin', { replace: true });
        return;
      }
      if (ok && Array.isArray(data)) {
        setCustomers(data);
      }
    } catch {
      showToast('Failed to load customers', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesTier = activeTier === 'All' || c.status === activeTier;
      const matchesQuery =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone_number?.toLowerCase().includes(q);
      return matchesTier && matchesQuery;
    });
  }, [customers, activeTier, searchTerm]);

  const handleStatusChange = async (customer, nextStatus) => {
    try {
      const { ok, data } = await apiFetch(`/api/admin/customers/${customer.id}`, {
        method: 'PATCH',
        auth: 'admin',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (ok) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, status: nextStatus } : c))
        );
        showToast(`Updated ${customer.name} to ${nextStatus}`);
      } else {
        showToast(data.error || 'Could not update tier', 'error');
      }
    } catch {
      showToast('Network error updating tier', 'error');
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { ok, data } = await apiFetch('/api/admin/customers', {
        method: 'POST',
        auth: 'admin',
        body: JSON.stringify(newCustomer),
      });
      if (ok) {
        showToast(`Added ${data.customer?.name} to clientele`);
        setIsModalOpen(false);
        setNewCustomer({
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          default_address: '',
          status: 'New',
        });
        loadCustomers();
      } else {
        showToast(data.error || 'Failed to add customer', 'error');
      }
    } catch {
      showToast('Network error adding customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Orders', 'Total Spent (KES)', 'Tier'];
    const rows = filteredCustomers.map((c) =>
      [
        `CUS-${String(c.id).padStart(4, '0')}`,
        `"${c.name}"`,
        c.email,
        c.phone_number || '',
        c.orders_count,
        c.total_spent,
        c.status,
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `the-pink-edit-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported customer database CSV');
  };

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
          <h1 className="text-3xl font-serif text-[#141414]">Clientele Database</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            View customer lifetime value, order frequency, and manage VIP concierge tiers.
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
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none justify-center items-center gap-2 bg-[#141414] hover:bg-[#C86D85] text-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors flex whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Add Customer
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white border border-stone-200">
        <div className="p-4 border-b border-stone-200 bg-[#FAF8F6] flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          <div className="flex gap-2 flex-wrap">
            {TIERS.map((tier) => {
              const count =
                tier === 'All'
                  ? customers.length
                  : customers.filter((c) => c.status === tier).length;
              const active = activeTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? 'bg-[#141414] text-white'
                      : 'bg-white border border-stone-200 text-stone-600 hover:border-[#141414]'
                  }`}
                >
                  {tier} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, or phone..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 text-xs focus:outline-none focus:border-[#141414]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-stone-200 text-[10px] uppercase tracking-[0.2em] text-stone-400 bg-white">
                <th className="p-4 font-bold">Client</th>
                <th className="p-4 font-bold">Contact</th>
                <th className="p-4 font-bold">Orders</th>
                <th className="p-4 font-bold">Lifetime Spend</th>
                <th className="p-4 font-bold">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-stone-400 italic">
                    No customers match your filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F6]/70 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#141414] text-[#F3CFD6] flex items-center justify-center font-serif text-base shrink-0">
                          {c.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-[#141414] text-sm">{c.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono">
                            CUS-{String(c.id).padStart(4, '0')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2 text-stone-600">
                        <Mail className="w-3.5 h-3.5 text-stone-400" /> {c.email}
                      </div>
                      {c.phone_number && (
                        <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                          <Phone className="w-3 h-3" /> {c.phone_number}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-[#141414]">{c.orders_count}</td>
                    <td className="p-4 font-semibold text-[#141414]">
                      {formatKsh(c.total_spent)}
                    </td>
                    <td className="p-4">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c, e.target.value)}
                        className={`px-3 py-1 text-[10px] uppercase tracking-[0.18em] font-bold border outline-none cursor-pointer ${
                          c.status === 'VIP'
                            ? 'bg-[#141414] text-[#E8B4BC] border-[#141414]'
                            : c.status === 'Regular'
                            ? 'bg-[#F7ECEF] text-[#A64D66] border-[#E8B4BC]'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="New" className="bg-white text-[#141414]">New</option>
                        <option value="Regular" className="bg-white text-[#141414]">Regular</option>
                        <option value="VIP" className="bg-white text-[#141414]">VIP</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CUSTOMER MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-md border border-stone-200 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-stone-200 bg-[#FAF8F6] flex justify-between items-center">
                <h2 className="font-serif text-2xl text-[#141414]">Add New Client</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-stone-400 hover:text-[#141414]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustomer.first_name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, first_name: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newCustomer.last_name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, last_name: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newCustomer.phone_number}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, phone_number: e.target.value })
                      }
                      placeholder="07XX XXX XXX"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Initial Tier
                    </label>
                    <select
                      value={newCustomer.status}
                      onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                    >
                      <option value="New">New</option>
                      <option value="Regular">Regular</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={newCustomer.default_address}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, default_address: e.target.value })
                    }
                    placeholder="Lavington, Nairobi"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                  />
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs uppercase tracking-[0.18em] text-stone-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#141414] hover:bg-[#C86D85] text-white text-xs font-semibold uppercase tracking-[0.2em] inline-flex items-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Add Client
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