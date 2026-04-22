import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // SUCCESS: Save the golden ticket (JWT) to localStorage!
        localStorage.setItem('adminToken', data.access_token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        
        // Redirect to the dashboard
        navigate('/admin/dashboard');
      } else {
        // FAILED: Show the error from Flask
        setError(data.error || 'Login failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f8] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background Watermarks (from your design) */}
      <div className="absolute top-20 left-20 text-[200px] font-serif text-gray-200/40 select-none z-0">Pink</div>
      <div className="absolute bottom-10 right-20 text-[200px] font-serif text-gray-200/40 select-none z-0">Edit</div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-12 rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[480px] z-10 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-8 h-8 mx-auto mb-6 border-2 border-pink-500 transform rotate-45"></div>
          <h1 className="text-3xl font-serif text-gray-900 mb-2">The Pink Edit</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Administrative Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 text-sm rounded-sm text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-sm text-sm focus:ring-0 focus:border-pink-400 transition-colors bg-[#faf8f8] outline-none"
                placeholder="admin@thepinkedit.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold">Password</label>
              <a href="#" className="text-[10px] text-gray-400 hover:text-pink-500 transition-colors">Forgot password?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-sm text-sm focus:ring-0 focus:border-pink-400 transition-colors bg-[#faf8f8] outline-none tracking-widest"
                placeholder="••••••••"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.01 }}
            whileTap={{ scale: isLoading ? 1 : 0.99 }}
            disabled={isLoading}
            type="submit"
            className={`w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-sm text-sm font-bold uppercase tracking-widest text-white transition-colors ${isLoading ? 'bg-pink-300 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'}`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Sign In'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Authorized access only. By continuing, you agree to our <br/>
            <span className="hover:text-pink-500 cursor-pointer transition-colors">Privacy Policy and Security Terms.</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}