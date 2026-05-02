import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#faf8f8] pt-16 lg:pt-20 pb-10 px-6 lg:px-12 border-t border-gray-200 mt-auto">
      {/* Responsive Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-sm text-center md:text-left">
        
        <div className="md:col-span-2 flex flex-col items-center md:items-start">
          <h3 className="font-serif text-2xl mb-4 italic">Join the Edit</h3>
          <p className="text-gray-500 mb-6 w-full lg:w-3/4">Subscribe to receive editorial updates, exclusive collection previews, and invitations to private events.</p>
          <div className="flex border-b border-gray-400 pb-2 w-full lg:w-3/4">
            <input type="email" placeholder="Email Address" className="bg-transparent outline-none flex-grow text-center md:text-left" />
            <button className="uppercase tracking-widest font-bold hover:text-pink-500 text-xs lg:text-sm">Subscribe</button>
          </div>
        </div>

        <div>
          <h4 className="font-bold uppercase tracking-widest mb-6">Shop</h4>
          <ul className="space-y-3 text-gray-500">
            <li><Link to="/shop" className="hover:text-pink-500 transition-colors">All Products</Link></li>
            <li><Link to="/shop?category=Perfumes" className="hover:text-pink-500 transition-colors">Perfumes</Link></li>
            <li><Link to="/shop?category=Fine%20Jewellery" className="hover:text-pink-500 transition-colors">Fine Jewellery</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold uppercase tracking-widest mb-6">Company</h4>
          <ul className="space-y-3 text-gray-500">
            <li><a href="#" className="hover:text-pink-500 transition-colors">Our Story</a></li>
            <li><a href="#" className="hover:text-pink-500 transition-colors">The Journal</a></li>
            <li><a href="#" className="hover:text-pink-500 transition-colors">Sustainability</a></li>
          </ul>
        </div>
      </div>
      
      {/* Responsive Bottom Bar */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center border-t border-gray-200 pt-8 text-[10px] md:text-xs text-gray-400 gap-6 lg:gap-0 text-center">
        <p>© 2026 THE PINK EDIT. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-6 font-bold text-gray-500">
          <span className="cursor-pointer hover:text-pink-500 transition-colors">IG</span>
          <span className="cursor-pointer hover:text-pink-500 transition-colors">FB</span>
          <span className="cursor-pointer hover:text-pink-500 transition-colors">X</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#" className="hover:text-pink-500 transition-colors">PRIVACY POLICY</a>
          <a href="#" className="hover:text-pink-500 transition-colors">TERMS OF SERVICE</a>
        </div>
      </div>
    </footer>
  );
}