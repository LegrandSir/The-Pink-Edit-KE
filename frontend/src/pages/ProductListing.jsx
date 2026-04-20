import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, List, ChevronDown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Mock Data updated with 'inStock' and 'scent' properties
const products = [
  { id: 1, name: "Rose Noire Eau de Parfum", category: "Perfumes", price: 185, tag: "Best Seller", inStock: true, scent: "Floral", img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=500&auto=format&fit=crop" },
  { id: 2, name: "18k Floating Diamond Necklace", category: "Fine Jewellery", price: 1250, tag: "Limited Edition", inStock: false, scent: null, img: "https://images.unsplash.com/photo-1599643478524-fb66fa5320e5?q=80&w=500&auto=format&fit=crop" },
  { id: 3, name: "Velvet Tuberose Candle", category: "Home Fragrance", price: 65, tag: "", inStock: true, scent: "Woody", img: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=500&auto=format&fit=crop" },
  { id: 4, name: "Petite Pearl Drop Earrings", category: "Fine Jewellery", price: 420, tag: "New", inStock: true, scent: null, img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=500&auto=format&fit=crop" },
  { id: 5, name: "L'Ombre Extrait", category: "Perfumes", price: 340, tag: "", inStock: true, scent: "Woody", img: "https://images.unsplash.com/photo-1523293115678-efa8003fdf53?q=80&w=500&auto=format&fit=crop" },
  { id: 6, name: "Stackable Eternity Band", category: "Fine Jewellery", price: 890, tag: "", inStock: false, scent: null, img: "https://images.unsplash.com/photo-1605100804763-247f67b2548e?q=80&w=500&auto=format&fit=crop" },
  { id: 7, name: "Citron Glacé Mist", category: "Perfumes", price: 95, tag: "", inStock: true, scent: "Citrus", img: "https://images.unsplash.com/photo-1595425964071-1a3b1a8f9411?q=80&w=500&auto=format&fit=crop" },
  { id: 8, name: "Celestial Moon Ring", category: "Fine Jewellery", price: 320, tag: "Handmade", inStock: true, scent: null, img: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=500&auto=format&fit=crop" },
];

export default function ProductListing() {
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Collections");
  const [activeScent, setActiveScent] = useState(null);

  // The Magic Filtering Logic
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === "All Collections" || product.category === activeCategory;
    const matchesStock = !inStockOnly || product.inStock === true;
    const matchesScent = !activeScent || product.scent === activeScent;
    return matchesCategory && matchesStock && matchesScent;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f8] text-gray-900 font-sans">
      <Navbar />

      <div className="pt-16 pb-12 text-center bg-white">
        <span className="text-pink-500 text-xs font-bold tracking-widest uppercase mb-4 block">Curated Collection</span>
        <h1 className="text-5xl font-serif mb-4 italic">The Autumn Edit</h1>
        <p className="text-gray-500 max-w-xl mx-auto font-light">
          Discover a sophisticated curation of rare essences and masterfully crafted jewellery, inspired by the transitional beauty of the changing seasons.
        </p>
      </div>

      <div className="border-t border-b border-gray-200 bg-white px-12 py-4 flex justify-between items-center text-xs uppercase tracking-widest text-gray-500">
        <div className="flex gap-2">
          <span className="hover:text-pink-500 cursor-pointer">Home</span>
          <span>/</span>
          <span className="text-gray-900 font-bold">Shop All</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-12 py-12 flex gap-12 w-full">
        <aside className="w-64 flex-shrink-0">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold uppercase tracking-widest text-sm">Refine By</h3>
            <button 
              onClick={() => { setActiveCategory("All Collections"); setInStockOnly(false); setActiveScent(null); }}
              className="text-xs text-pink-500 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="mb-8">
            <h4 className="font-bold text-sm mb-4">Category</h4>
            <div className="space-y-3 text-sm text-gray-600">
              {["All Collections", "Perfumes", "Fine Jewellery", "Home Fragrance"].map(cat => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={activeCategory === cat}
                    onChange={() => setActiveCategory(cat)}
                    className="w-4 h-4 accent-pink-500"
                  />
                  <span className={activeCategory === cat ? "text-pink-500 font-medium" : ""}>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-8 border-t border-gray-200 pt-6">
            <h4 className="font-bold text-sm mb-4">Scent Family</h4>
            <div className="grid grid-cols-2 gap-2">
              {["Floral", "Woody", "Citrus"].map(scent => (
                <button 
                  key={scent} 
                  onClick={() => setActiveScent(activeScent === scent ? null : scent)}
                  className={`border rounded-sm py-2 text-xs transition-colors ${activeScent === scent ? 'border-pink-500 text-pink-500 bg-pink-50' : 'border-gray-300 text-gray-600 hover:border-pink-400'}`}
                >
                  {scent}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-700">In Stock Only</h4>
            <div 
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${inStockOnly ? 'bg-pink-400' : 'bg-gray-200'}`}
            >
              <motion.div layout className="w-3 h-3 bg-white rounded-full shadow-sm" style={{ marginLeft: inStockOnly ? 'auto' : '0' }} />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center gap-4 mb-8 text-xs text-gray-500">
            {activeCategory !== "All Collections" && (
              <span className="flex items-center gap-1 border border-gray-200 px-3 py-1 rounded-full">
                {activeCategory} <X className="w-3 h-3 cursor-pointer hover:text-pink-500" onClick={() => setActiveCategory("All Collections")}/>
              </span>
            )}
            {activeScent && (
              <span className="flex items-center gap-1 border border-gray-200 px-3 py-1 rounded-full">
                {activeScent} <X className="w-3 h-3 cursor-pointer hover:text-pink-500" onClick={() => setActiveScent(null)}/>
              </span>
            )}
            <span className="ml-auto italic">Showing {filteredProducts.length} products</span>
          </div>

          <motion.div layout className="grid grid-cols-3 gap-x-8 gap-y-12">
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={product.id} 
                >
                  <Link to="/product" className="group cursor-pointer flex flex-col">
                    <div className="relative bg-gray-100 aspect-[4/5] mb-4 overflow-hidden rounded-sm">
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                           <span className="bg-white px-4 py-2 text-xs uppercase tracking-widest font-bold text-gray-500 border border-gray-200">Out of Stock</span>
                        </div>
                      )}
                      {product.tag && (
                        <span className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-gray-800 rounded-sm">
                          {product.tag}
                        </span>
                      )}
                      <img src={product.img} alt={product.name} className={`w-full h-full object-cover transition-transform duration-700 ${product.inStock ? 'group-hover:scale-105' : 'grayscale'}`} />
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">{product.category}</span>
                      <h4 className="font-serif text-lg mt-1 mb-1 group-hover:text-pink-500 transition-colors">{product.name}</h4>
                      <p className="text-gray-500 italic">${product.price}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}