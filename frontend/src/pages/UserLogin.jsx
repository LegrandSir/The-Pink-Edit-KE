import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { CartContext } from '../context/CartContext';

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { syncCartWithServer } = useContext(CartContext);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Look for the breadcrumb, or default to the shop!
  const redirectTarget = location.state?.from || '/shop';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userToken', data.access_token);
        await syncCartWithServer();
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // UPDATE: Use the redirect target here!
        navigate(redirectTarget, { replace: true });
      } else {
        setError(data.error || 'Invalid email or password.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again.');
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const res = await fetch('http://127.0.0.1:5000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token })
        });
        
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('userToken', data.access_token);
          await syncCartWithServer();
          localStorage.setItem('userData', JSON.stringify(data.user));
          
          // UPDATE: Use the redirect target here too!
          navigate(redirectTarget, { replace: true }); 
        } else {
          setError("Google login failed on our servers.");
        }
      } catch (err) {
        setError("Network error connecting to Google.");
      }
      setIsLoading(false);
    },
    onError: () => setError('Google Sign-In was closed or failed.')
  });

  return (
    <div className="min-h-screen bg-[#faf8f8] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background Watermarks */}
      <div className="absolute top-20 left-20 text-[200px] font-serif text-gray-200/40 select-none z-0">Pink</div>
      <div className="absolute bottom-10 right-20 text-[200px] font-serif text-gray-200/40 select-none z-0">Edit</div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-10 md:p-12 rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[480px] z-10 border border-gray-100 m-4"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-serif text-pink-400 mb-2 tracking-widest">✧ The Pink Edit</h1>
          </Link>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-4">Sign in to your account</p>
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
                placeholder="you@example.com"
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

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="px-4 bg-white text-gray-400 font-bold">Or access with</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => googleLogin()} 
            className="mt-6 w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 rounded-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {/* Google G Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium">
            New to The Pink Edit? <Link to="/register" className="text-pink-500 font-bold hover:underline ml-1">Create an account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}