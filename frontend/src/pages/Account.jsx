import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, User } from 'lucide-react';
import { CartContext } from '../context/CartContext'; // 1. Imported the Context

export default function Account() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  // 2. Grabbed clearCart from the Context
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
    clearCart(); // <--- Now this works perfectly!
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-16 px-8">
      <h1 className="text-3xl font-serif text-gray-900 mb-8">My Account</h1>
      
      <div className="bg-white border border-gray-200 rounded-sm p-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-2xl font-serif">
            {user.first_name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 border border-gray-200 px-6 py-2 rounded-sm text-sm font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}