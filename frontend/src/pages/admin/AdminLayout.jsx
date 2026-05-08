import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Image, Settings, LogOut, Search, Bell, Menu, X } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Protect all admin routes: If no token, kick them back to login!
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  // Close sidebar on mobile when a link is clicked
  const handleLinkClick = () => {
    setIsSidebarOpen(false);
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Journal/Gallery', path: '/admin/journal', icon: Image },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f8] flex font-sans text-gray-900 relative">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LIGHT THEMED SIDEBAR (Responsive) */}
      <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-30 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-20 flex items-center justify-between lg:justify-center px-6 lg:px-0 border-b border-gray-200">
          <span className="text-xl font-serif text-pink-500 tracking-widest">✧ The Pink Edit</span>
          {/* Mobile Close Button */}
          <button className="lg:hidden text-gray-400 hover:text-pink-500" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname.includes(link.path);
            const Icon = link.icon;
            return (
              <Link 
                key={link.name} 
                to={link.path}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-pink-50 text-pink-600' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      {/* MOBILE FIX: Remove left margin on small screens, add it back on lg screens */}
      <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu for Mobile */}
            <button className="lg:hidden text-gray-600 hover:text-pink-500" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            
            {/* MOBILE FIX: Hide search bar on phones to save space */}
            <div className="relative w-64 md:w-96 hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search analytics, orders..." 
                className="w-full pl-10 pr-4 py-2 bg-[#faf8f8] border-none rounded-sm text-sm focus:ring-1 focus:ring-pink-200 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button className="relative text-gray-400 hover:text-pink-500 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4 lg:pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">System Admin</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Manager</p>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold font-serif text-sm lg:text-base">
                PE
              </div>
            </div>
          </div>
        </header>

        {/* Page Content injected here */}
        <div className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}