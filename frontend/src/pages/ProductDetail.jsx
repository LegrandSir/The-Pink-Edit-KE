import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Minus, Plus, ChevronDown, ChevronUp, Truck, ShieldCheck, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CartContext } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams(); 
  const { addToCart, toggleCart } = useContext(CartContext);

  // Data State
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI State
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [openAccordion, setOpenAccordion] = useState('notes');

  useEffect(() => {
    fetch(`http://https://the-pink-edit-ke.onrender.com:5000/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedSize(data.variants[0].size || 'One Size');
        }
        if (data.media && data.media.length > 0) {
          setActiveImage(data.media[0].image_url);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Unable to load product details.");
        setIsLoading(false);
      });
  }, [id]);

  const handleAddToBag = () => {
    if (!product) return;
    
    const variant = product.variants.find(v => v.size === selectedSize) || product.variants[0];
    const finalPrice = product.base_price + (variant.price_adjustment || 0);

    addToCart({
      id: product.id,
      name: product.title,
      category: product.category,
      price: finalPrice,
      qty: quantity,
      size: selectedSize,
      img: activeImage
    });
    toggleCart(); 
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#faf8f8]">
        <Navbar />
        <div className="flex-1 flex justify-center items-center text-pink-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#faf8f8]">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center text-gray-500 px-6 text-center">
          <p>{error}</p>
          <Link to="/shop" className="mt-4 text-pink-500 underline uppercase tracking-widest text-xs">Return to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f8] text-gray-900 font-sans">
      <Navbar />

      {/* Breadcrumbs - Adjusted padding and text size for mobile */}
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-4 lg:py-6 text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 overflow-x-auto whitespace-nowrap flex items-center">
        <Link to="/" className="hover:text-pink-500 transition-colors">Home</Link> <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-pink-500 transition-colors">{product.category}</Link> <span className="mx-2">/</span>
        <span className="text-gray-900 font-bold">{product.title}</span>
      </div>

      {/* Main Grid - Stacks on mobile, splits on laptop */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-16 lg:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 w-full">
        
        {/* Left: Images */}
        {/* MOBILE FIX: flex-col-reverse for horizontal thumbs on phone, lg:flex-row for vertical thumbs on desktop */}
        <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6 lg:h-[600px]">
          
          <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 w-full lg:w-20 flex-shrink-0 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 hide-scrollbar">
            {product.media.map((img) => (
              <img 
                key={img.id} 
                src={img.image_url} 
                onClick={() => setActiveImage(img.image_url)}
                className={`w-16 h-16 lg:w-full lg:h-auto aspect-square object-cover cursor-pointer rounded-sm border-2 transition-all flex-shrink-0 ${activeImage === img.image_url ? 'border-pink-300 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                alt="Thumbnail"
              />
            ))}
          </div>

          <div className="flex-1 bg-gray-100 rounded-sm relative overflow-hidden aspect-[4/5] lg:aspect-auto">
             {product.tags && (
               <span className="absolute top-4 left-4 lg:top-6 lg:left-6 z-10 bg-yellow-100 text-yellow-800 px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-sm">
                  {product.tags}
               </span>
             )}
             <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={activeImage} 
                  className="absolute inset-0 w-full h-full object-cover" 
                  alt={product.title} 
                />
             </AnimatePresence>
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <span className="text-pink-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">{product.collection || product.category}</span>
            <Heart className="w-5 h-5 text-gray-400 cursor-pointer hover:text-pink-500 hover:fill-pink-50 transition-colors" />
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-serif mb-4 leading-tight">{product.title}</h1>
          
          {/* CURRENCY FIX: Updated to Ksh */}
          <p className="text-xl mb-6 font-medium">Ksh {product.base_price.toLocaleString()}</p>
          <p className="text-gray-600 font-light leading-relaxed mb-8 text-sm sm:text-base">
            {product.description}
          </p>

          {/* Size/Variant Selector */}
          {product.variants.length > 0 && product.variants[0].size && (
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-3">
                <span className="font-bold uppercase tracking-widest text-gray-700">Select Variant</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {product.variants.map(v => (
                  <button 
                    key={v.id}
                    onClick={() => setSelectedSize(v.size)}
                    disabled={v.available_stock === 0}
                    className={`py-3 px-2 text-xs sm:text-sm rounded-sm border transition-colors ${selectedSize === v.size ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-700 hover:border-gray-900'} ${v.available_stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {v.size} {v.available_stock === 0 ? '(Out of Stock)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex flex-row gap-4 mb-8">
            <div className="flex items-center border border-gray-300 rounded-sm w-28 sm:w-32 flex-shrink-0">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 sm:px-4 py-3 text-gray-500 hover:text-pink-500 transition-colors"><Minus className="w-4 h-4"/></button>
              <span className="flex-1 text-center font-medium text-sm sm:text-base">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-3 sm:px-4 py-3 text-gray-500 hover:text-pink-500 transition-colors"><Plus className="w-4 h-4"/></button>
            </div>
            <motion.button 
              onClick={handleAddToBag}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-pink-500 text-white font-bold uppercase tracking-widest text-xs sm:text-sm rounded-sm hover:bg-pink-600 transition-colors"
            >
              Add to Bag
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 border-b border-gray-200 pb-8 mb-8 text-[10px] sm:text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-pink-400"/> EXPRESS SHIPPING</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-pink-400"/> AUTHENTICITY GUARANTEED</span>
          </div>

          {/* Accordions */}
          <div className="space-y-4">
            {[
              { id: 'notes', title: 'Details', content: product.scent_family ? `Family: ${product.scent_family}` : 'Exquisite craftsmanship designed for the modern aesthetic.' },
              { id: 'shipping', title: 'Complimentary Shipping', content: 'Free express shipping on all orders above Ksh 15,000. Returns accepted within 14 days of delivery.' }
            ].map(item => (
              <div key={item.id} className="border-b border-gray-200 pb-4">
                <button 
                  onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
                  className="flex justify-between items-center w-full text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-700"
                >
                  {item.title}
                  {openAccordion === item.id ? <ChevronUp className="w-4 h-4 text-pink-500"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
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