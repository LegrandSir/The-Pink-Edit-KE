import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, User } from 'lucide-react';
import { CartContext } from '../context/CartContext';

export default function Account() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  const { clearCart } = useContext(CartContext); 

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
      navigate('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    clearCart(); 
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-10 lg:py-16 px-6 lg:px-8">
      <h1 className="text-3xl font-serif text-gray-900 mb-6 lg:mb-8 text-center md:text-left">My Account</h1>
      
      {/* MOBILE FIX: flex-col for stacking on phones, md:flex-row for side-by-side on desktop */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 lg:p-8 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
        
        {/* MOBILE FIX: Center text and avatar on phones, align left on desktop */}
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-2xl font-serif flex-shrink-0">
            {user.first_name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm text-gray-500 mt-1 md:mt-0">{user.email}</p>
          </div>
        </div>
        
        {/* MOBILE FIX: Make button full-width on mobile (w-full), auto on desktop (md:w-auto) */}
        <button 
          onClick={handleLogout}
          className="w-full md:w-auto flex items-center justify-center gap-2 border border-gray-200 px-6 py-3 md:py-2 rounded-sm text-sm font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}