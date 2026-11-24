import React, { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Loader2, Trash2, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const Toggle = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-11 h-6 rounded-full cursor-pointer transition-colors flex items-center px-1 shrink-0 ${
      enabled ? 'bg-[#C86D85]' : 'bg-stone-300'
    }`}
  >
    <div
      className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'Fulfillment',
  });

  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsRes, teamRes] = await Promise.all([
        apiFetch('/api/admin/settings', { auth: 'admin' }),
        apiFetch('/api/admin/team', { auth: 'admin' }),
      ]);
      if (settingsRes.status === 401 || settingsRes.status === 403) {
        localStorage.removeItem('adminToken');
        navigate('/admin', { replace: true });
        return;
      }
      if (settingsRes.ok) setSettings(settingsRes.data);
      if (teamRes.ok && Array.isArray(teamRes.data)) setTeam(teamRes.data);
    } catch {
      showToast('Failed to load store settings', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      const { ok, data } = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        auth: 'admin',
        body: JSON.stringify(settings),
      });
      if (ok) {
        setSettings(data.settings);
        showToast('Store settings persisted to database');
      } else {
        showToast(data.error || 'Could not save settings', 'error');
      }
    } catch {
      showToast('Network error saving settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteStaff = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const { ok, data } = await apiFetch('/api/admin/team', {
        method: 'POST',
        auth: 'admin',
        body: JSON.stringify(inviteForm),
      });
      if (ok) {
        setTeam((prev) => [...prev, data.member]);
        setInviteForm({ first_name: '', last_name: '', email: '', role: 'Fulfillment' });
        setIsInviteOpen(false);
        showToast(`Invited ${data.member?.name} as ${data.member?.role}`);
      } else {
        showToast(data.error || 'Could not invite staff member', 'error');
      }
    } catch {
      showToast('Network error inviting staff', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleUpdate = async (member, newRole) => {
    try {
      const { ok, data } = await apiFetch(`/api/admin/team/${member.id}`, {
        method: 'PATCH',
        auth: 'admin',
        body: JSON.stringify({ role: newRole }),
      });
      if (ok) {
        setTeam((prev) => prev.map((m) => (m.id === member.id ? data.member : m)));
        showToast(`Updated ${member.name}'s role to ${newRole}`);
      } else {
        showToast(data.error || 'Role update blocked', 'error');
      }
    } catch {
      showToast('Network error updating role', 'error');
    }
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${member.name} from the admin team?`)) return;
    try {
      const { ok, data } = await apiFetch(`/api/admin/team/${member.id}`, {
        method: 'DELETE',
        auth: 'admin',
      });
      if (ok) {
        setTeam((prev) => prev.filter((m) => m.id !== member.id));
        showToast(`Removed ${member.name}`, 'info');
      } else {
        showToast(data.error || 'Could not remove member', 'error');
      }
    } catch {
      showToast('Network error removing member', 'error');
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="h-64 flex items-center justify-center text-[#C86D85]">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#141414]">Store Settings</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Configure checkout rails, Nairobi delivery thresholds, VAT rate, and team roles.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-full md:w-auto justify-center bg-[#141414] hover:bg-[#C86D85] text-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors inline-flex items-center gap-2 disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Changes
        </button>
      </div>

      {/* GENERAL */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <h2 className="font-serif text-2xl text-[#141414]">Brand Identity</h2>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Core storefront details used across receipts, emails, and headers.
          </p>
        </div>
        <div className="lg:col-span-8 bg-white border border-stone-200 p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
              Store Name
            </label>
            <input
              type="text"
              value={settings.store_name || ''}
              onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
              Concierge Support Email
            </label>
            <input
              type="email"
              value={settings.support_email || ''}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
              Currency
            </label>
            <select
              value={settings.currency || 'KES'}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
            >
              <option value="KES">KES (Ksh) — Kenyan Shilling</option>
              <option value="USD">USD ($) — US Dollar</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
              Timezone
            </label>
            <select
              value={settings.timezone || 'EAT'}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
            >
              <option value="EAT">EAT — East Africa Time (UTC+3)</option>
              <option value="UTC">UTC — Coordinated Universal Time</option>
            </select>
          </div>
        </div>
      </section>

      {/* PAYMENTS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-stone-200">
        <div className="lg:col-span-4">
          <h2 className="font-serif text-2xl text-[#141414]">Payment Channels</h2>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Control active payment rails at checkout. API secrets remain securely stored in server environment variables.
          </p>
        </div>
        <div className="lg:col-span-8 bg-white border border-stone-200 divide-y divide-stone-200">
          {[
            {
              key: 'mpesa_enabled',
              badge: 'M',
              badgeClass: 'bg-emerald-600 text-white',
              title: 'M-Pesa Express (Safaricom Daraja)',
              desc: 'STK Push mobile payments and instant portfolio demo checkout.',
            },
            {
              key: 'pod_enabled',
              badge: 'P',
              badgeClass: 'bg-[#141414] text-[#E8B4BC]',
              title: 'Pay on Delivery',
              desc: 'Allow Nairobi and countrywide clients to settle upon rider arrival.',
            },
            {
              key: 'stripe_enabled',
              badge: 'S',
              badgeClass: 'bg-indigo-600 text-white',
              title: 'International Cards (Stripe)',
              desc: 'Accept Visa, Mastercard, and Apple Pay for diaspora orders.',
            },
          ].map((rail) => (
            <div key={rail.key} className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-9 h-9 flex items-center justify-center font-bold text-sm shrink-0 ${rail.badgeClass}`}
                >
                  {rail.badge}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#141414]">{rail.title}</p>
                  <p className="text-xs text-stone-500">{rail.desc}</p>
                </div>
              </div>
              <Toggle
                enabled={Boolean(settings[rail.key])}
                onChange={() => setSettings({ ...settings, [rail.key]: !settings[rail.key] })}
              />
            </div>
          ))}
        </div>
      </section>

      {/* SHIPPING & TAX */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-stone-200">
        <div className="lg:col-span-4">
          <h2 className="font-serif text-2xl text-[#141414]">Shipping &amp; Tax</h2>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Thresholds automatically recalculate shipping at checkout.
          </p>
        </div>
        <div className="lg:col-span-8 bg-white border border-stone-200 p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
              Flat Nairobi Rate (Ksh)
            </label>
            <input
              type="number"
              min="0"
              value={settings.flat_shipping_rate ?? 500}
              onChange={(e) =>
                setSettings({ ...settings, flat_shipping_rate: parseFloat(e.target.value || 0) })
              }
              className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
              Free Shipping Over (Ksh)
            </label>
            <input
              type="number"
              min="0"
              value={settings.free_shipping_threshold ?? 25000}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  free_shipping_threshold: parseFloat(e.target.value || 0),
                })
              }
              className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2">
              Kenya VAT Rate (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={settings.tax_rate ?? 16}
              onChange={(e) =>
                setSettings({ ...settings, tax_rate: parseFloat(e.target.value || 0) })
              }
              className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
            />
          </div>
        </div>
      </section>

      {/* TEAM & RBAC */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-stone-200">
        <div className="lg:col-span-4">
          <h2 className="font-serif text-2xl text-[#141414]">Team &amp; Permissions</h2>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Manage real staff accounts stored in your Neon Postgres admin table.
          </p>
        </div>
        <div className="lg:col-span-8 bg-white border border-stone-200 p-6">
          <div className="flex justify-between items-center mb-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
              Active Staff ({team.length})
            </p>
            <button
              type="button"
              onClick={() => setIsInviteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 text-[10px] uppercase tracking-[0.18em] font-semibold text-[#141414] hover:border-[#141414] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Invite Staff
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {team.map((member) => {
              const isPrimary = member.email === 'admin@thepinkedit.com';
              return (
                <div
                  key={member.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#FAF8F6] border border-stone-200 text-[#141414] flex items-center justify-center font-serif font-semibold shrink-0">
                      {member.first_name?.charAt(0) || 'A'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#141414] flex items-center gap-1.5 truncate">
                        {member.name}
                        {isPrimary && <ShieldCheck className="w-3.5 h-3.5 text-[#C86D85] shrink-0" />}
                      </p>
                      <p className="text-xs text-stone-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-12 sm:pl-0">
                    <select
                      disabled={isPrimary}
                      value={member.role}
                      onChange={(e) => handleRoleUpdate(member, e.target.value)}
                      className="px-3 py-1.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414] disabled:opacity-60"
                    >
                      <option value="SuperAdmin">SuperAdmin</option>
                      <option value="Editor">Editor</option>
                      <option value="Fulfillment">Fulfillment</option>
                      <option value="Support">Support</option>
                    </select>
                    <button
                      type="button"
                      disabled={isPrimary}
                      onClick={() => handleRemoveMember(member)}
                      title={isPrimary ? 'Primary SuperAdmin is protected' : 'Remove staff'}
                      className="p-1.5 text-stone-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INVITE STAFF MODAL */}
      <AnimatePresence>
        {isInviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-md border border-stone-200 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-stone-200 bg-[#FAF8F6] flex justify-between items-center">
                <h2 className="font-serif text-2xl text-[#141414]">Invite Staff Member</h2>
                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="text-stone-400 hover:text-[#141414]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleInviteStaff} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteForm.first_name}
                      onChange={(e) => setInviteForm({ ...inviteForm, first_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={inviteForm.last_name}
                      onChange={(e) => setInviteForm({ ...inviteForm, last_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="staff@thepinkedit.com"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                    Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs outline-none focus:border-[#141414]"
                  >
                    <option value="Fulfillment">Fulfillment</option>
                    <option value="Editor">Editor</option>
                    <option value="Support">Support</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 text-xs uppercase tracking-[0.18em] text-stone-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="px-6 py-2.5 bg-[#141414] hover:bg-[#C86D85] text-white text-xs font-semibold uppercase tracking-[0.2em] inline-flex items-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {isInviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Send Invite
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