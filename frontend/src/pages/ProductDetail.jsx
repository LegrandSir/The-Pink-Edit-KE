import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Minus, Plus, ChevronDown, ChevronUp, Truck, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CartContext } from '../context/CartContext';

export default function ProductDetail() {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('100ml');
  const [activeImage, setActiveImage] = useState('https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop');
  const [openAccordion, setOpenAccordion] = useState('notes'); 
  
  const { addToCart, toggleCart } = useContext(CartContext);

  const handleAddToBag = () => {
    addToCart({
      id: 'rose-nocturne',
      name: "Rose Nocturne",
      category: "Perfume",
      price: 240.00,
      qty: quantity,
      size: selectedSize,
      img: activeImage
    });
    toggleCart(); 
  };

  const thumbnails = [
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595425970377-c9703bc48baf?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop'
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f8] text-gray-900 font-sans">
      <Navbar />

      {/* BREADCRUMBS */}
      <div className="max-w-7xl mx-auto w-full px-12 py-6 text-xs uppercase tracking-widest text-gray-500">
        <span className="hover:text-pink-500 cursor-pointer">Home</span> <span className="mx-2">/</span>
        <span className="hover:text-pink-500 cursor-pointer">Perfumes</span> <span className="mx-2">/</span>
        <span className="text-gray-900 font-bold">Rose Nocturne</span>
      </div>

      {/* MAIN PRODUCT SECTION */}
      <div className="max-w-7xl mx-auto px-12 pb-24 grid grid-cols-2 gap-16 w-full">
        
        {/* Left: Images */}
        <div className="flex gap-6 h-[600px]">
          <div className="flex flex-col gap-4 w-20 flex-shrink-0">
            {thumbnails.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                onClick={() => setActiveImage(img)}
                className={`w-full aspect-square object-cover cursor-pointer rounded-sm border-2 transition-all ${activeImage === img ? 'border-pink-300 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                alt={`Thumbnail ${idx}`}
              />
            ))}
          </div>
          <div className="flex-1 bg-gray-100 rounded-sm relative overflow-hidden">
             <span className="absolute top-6 left-6 z-10 bg-yellow-100 text-yellow-800 px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-sm">
                Best Seller
             </span>
             <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={activeImage} 
                  className="w-full h-full object-cover" 
                  alt="Rose Nocturne" 
                />
             </AnimatePresence>
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <span className="text-pink-500 text-xs font-bold tracking-widest uppercase">Signature Collection</span>
            <Heart className="w-5 h-5 text-gray-400 cursor-pointer hover:text-pink-500 hover:fill-pink-50" />
          </div>
          
          <h1 className="text-4xl font-serif mb-1">Rose Nocturne</h1>
          <h2 className="text-2xl font-serif italic text-gray-600 mb-4">Eau de Parfum</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex text-yellow-400 text-sm">★★★★★</div>
            <span className="text-xs text-gray-500 underline cursor-pointer">(48 Reviews)</span>
          </div>

          <p className="text-xl mb-6 font-medium">$240.00</p>
          <p className="text-gray-600 font-light leading-relaxed mb-8 text-sm">
            An olfactory narrative of a midnight garden. Rose Nocturne blends the velvety richness of Damask Rose with the mysterious depth of patchouli and smoked oud. A scent crafted for those who find beauty in the shadows.
          </p>

          {/* Size Selector */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-3">
              <span className="font-bold uppercase tracking-widest text-gray-700">Select Size</span>
              <span className="text-gray-400 underline cursor-pointer">Size Guide</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['30ml', '100ml', '200ml'].map(size => (
                <button 
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 text-sm rounded-sm border transition-colors ${selectedSize === size ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-700 hover:border-gray-900'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex gap-4 mb-8">
            <div className="flex items-center border border-gray-300 rounded-sm w-32">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-gray-500 hover:text-pink-500"><Minus className="w-4 h-4"/></button>
              <span className="flex-1 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-gray-500 hover:text-pink-500"><Plus className="w-4 h-4"/></button>
            </div>
            <motion.button 
              onClick={handleAddToBag}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-pink-500 text-white font-bold uppercase tracking-widest text-sm rounded-sm hover:bg-pink-600 transition-colors"
            >
              Add to Bag
            </motion.button>
          </div>

          <div className="flex gap-6 border-b border-gray-200 pb-8 mb-8 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-2"><Truck className="w-4 h-4"/> EXPRESS SHIPPING</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> AUTHENTICITY GUARANTEED</span>
          </div>

          {/* Accordions */}
          <div className="space-y-4">
            {[
              { id: 'notes', title: 'Scent Notes', content: 'Top: Pink Pepper, Bergamot. Heart: Damask Rose, Velvet Woods. Base: Patchouli, Smoked Oud, Vanilla.' },
              { id: 'ingredients', title: 'Ingredients & Care', content: 'Alcohol Denat., Parfum (Fragrance), Aqua (Water), Citronellol, Geraniol. Keep away from direct sunlight.' },
              { id: 'shipping', title: 'Complimentary Shipping', content: 'Free express shipping on all orders above $150. Returns accepted within 14 days of delivery.' }
            ].map(item => (
              <div key={item.id} className="border-b border-gray-200 pb-4">
                <button 
                  onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
                  className="flex justify-between items-center w-full text-sm font-bold uppercase tracking-widest text-gray-700"
                >
                  {item.title}
                  {openAccordion === item.id ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                </button>
                <AnimatePresence>
                  {openAccordion === item.id && (
                    <motion.p 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-gray-500 text-sm mt-4 font-light overflow-hidden"
                    >
                      {item.content}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}