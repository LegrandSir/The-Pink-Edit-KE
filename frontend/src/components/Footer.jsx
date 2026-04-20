import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
// ...
  return (
    <footer className="bg-[#faf8f8] pt-20 pb-10 px-12 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-12 mb-16 text-sm">
        <div className="col-span-2">
          <h3 className="font-serif text-2xl mb-4 italic">Join the Edit</h3>
          <p className="text-gray-500 mb-6 w-3/4">Subscribe to receive editorial updates, exclusive collection previews, and invitations to private events.</p>
          <div className="flex border-b border-gray-400 pb-2 w-3/4">
            <input type="email" placeholder="Email Address" className="bg-transparent outline-none flex-grow" />
            <button className="uppercase tracking-widest font-bold hover:text-pink-500">Subscribe</button>
          </div>
        </div>
        <div>
          <h4 className="font-bold uppercase tracking-widest mb-6">Shop</h4>
          <ul className="space-y-3 text-gray-500">
            <li><Link to="/shop" className="hover:text-pink-500">All Products</Link></li>
            <li><a href="#" className="hover:text-pink-500">Perfumes</a></li>
            <li><a href="#" className="hover:text-pink-500">Fine Jewellery</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold uppercase tracking-widest mb-6">Company</h4>
          <ul className="space-y-3 text-gray-500">
            <li><a href="#" className="hover:text-pink-500">Our Story</a></li>
            <li><a href="#" className="hover:text-pink-500">The Journal</a></li>
            <li><a href="#" className="hover:text-pink-500">Sustainability</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto flex justify-between items-center border-t border-gray-200 pt-8 text-xs text-gray-400">
        <p>© 2026 THE PINK EDIT. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-4 font-bold text-gray-500">
          <span className="cursor-pointer hover:text-pink-500">IG</span>
          <span className="cursor-pointer hover:text-pink-500">FB</span>
          <span className="cursor-pointer hover:text-pink-500">X</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-pink-500">PRIVACY POLICY</a>
          <a href="#" className="hover:text-pink-500">TERMS OF SERVICE</a>
        </div>
      </div>
    </footer>
  );
}