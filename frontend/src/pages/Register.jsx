import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Automatically route them to the login page after successful creation
        navigate('/login', { state: { message: "Account created successfully! Please log in." } });
      } else {
        setError(data.error || 'Failed to create account.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f8] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background Watermarks */}
      <div className="absolute top-20 left-20 text-[200px] font-serif text-gray-200/40 select-none z-0">Pink</div>
      <div className="absolute bottom-10 right-20 text-[200px] font-serif text-gray-200/40 select-none z-0">Edit</div>

      {/* Register Card */}
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
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-4">Create your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 text-sm rounded-sm text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-sm text-sm focus:ring-0 focus:border-pink-400 transition-colors bg-[#faf8f8] outline-none"
                placeholder="Jane Doe"
              />
            </div>
          </div>

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
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                required
                minLength="6"
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
            className={`w-full mt-2 flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-sm text-sm font-bold uppercase tracking-widest text-white transition-colors ${isLoading ? 'bg-pink-300 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'}`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Create Account'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium">
            Already have an account? <Link to="/login" className="text-pink-500 font-bold hover:underline ml-1">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}