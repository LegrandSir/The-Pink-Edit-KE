import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const NAV_LINKS = [
  { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Products & Stock', path: '/admin/products', icon: Package },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Store Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin', { replace: true });
      return;
    }
    try {
      const stored = JSON.parse(localStorage.getItem('adminUser') || 'null');
      setAdminUser(stored);
    } catch {
      setAdminUser(null);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    showToast('Signed out of Admin Portal', 'info');
    navigate('/admin');
  };

  const activeSection =
    NAV_LINKS.find((l) => location.pathname.startsWith(l.path))?.name ||
    'Merchant Console';

  const initials = adminUser
    ? `${adminUser.first_name?.charAt(0) || ''}${adminUser.last_name?.charAt(0) || ''}`.toUpperCase() || 'AD'
    : 'PE';

  return (
    <div className="min-h-screen bg-[#FAF8F6] flex text-[#141414] relative">
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* OBSIDIAN SIDEBAR */}
      <aside
        className={`w-64 bg-[#141414] text-[#FAF8F6] flex flex-col fixed h-full z-40 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          <Link to="/admin/dashboard" className="block">
            <span className="text-xl font-serif tracking-[0.14em] text-white block leading-none">
              THE PINK EDIT
            </span>
            <span className="text-[9px] uppercase tracking-[0.28em] text-[#E8B4BC] block mt-1">
              Merchant Console
            </span>
          </Link>
          <button
            className="lg:hidden text-stone-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 mb-3 text-[9px] uppercase tracking-[0.25em] text-stone-500 font-semibold">
            Operations
          </p>
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 text-xs tracking-wide transition-colors ${
                  isActive
                    ? 'bg-[#C86D85] text-white font-semibold'
                    : 'text-stone-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2.5 text-xs text-stone-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#E8B4BC]" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full text-left text-xs text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT SHELL */}
      <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="h-20 bg-white/95 backdrop-blur-md border-b border-stone-200 px-5 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-[#141414] hover:text-[#C86D85]"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#C86D85] font-semibold">
                The Pink Edit · Admin
              </p>
              <h2 className="font-serif text-xl sm:text-2xl text-[#141414] leading-tight">
                {activeSection}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 text-[10px] uppercase tracking-[0.18em] font-semibold text-stone-600 hover:border-[#141414] hover:text-[#141414] transition-colors"
            >
              View Shop <ExternalLink className="w-3 h-3" />
            </Link>

            <div className="flex items-center gap-3 border-l border-stone-200 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-[#141414]">
                  {adminUser?.name || 'System Admin'}
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#C86D85]" />
                  {adminUser?.role || 'SuperAdmin'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#141414] text-[#F3CFD6] flex items-center justify-center font-serif text-sm font-semibold">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-5 lg:p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}