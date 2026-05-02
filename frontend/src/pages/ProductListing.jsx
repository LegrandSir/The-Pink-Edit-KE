import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Filter, SlidersHorizontal } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ProductListing() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Read the URL to see if they clicked a specific category from the Navbar
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || "All Collections";

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || "All Collections";
    setActiveCategory(categoryFromUrl);
  }, [searchParams]);

  // Filter States
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeScent, setActiveScent] = useState(null);
  const [activeMaterial, setActiveMaterial] = useState(null);
  
  // Mobile Filter Toggle
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Keep URL in sync with category clicks
  useEffect(() => {
    if (activeCategory === "All Collections") {
      setSearchParams({});
    } else {
      setSearchParams({ category: activeCategory });
    }
  }, [activeCategory, setSearchParams]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/products')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then(data => {
        const formattedProducts = data.map(p => ({
          id: p.id,
          name: p.title,
          category: p.category,
          price: p.base_price,
          tag: p.tags || "",
          inStock: p.variants?.some(v => v.available_stock > 0) || false,
          scent: p.scent_family,
          // Safely grab the metal type from the first variant if it exists
          material: p.variants?.[0]?.metal_type || null, 
          img: p.media?.length > 0 ? p.media[0].image_url : "https://images.unsplash.com/photo-1615397323214-99a3861250ce?q=80&w=500&auto=format&fit=crop"
        }));
        
        setProducts(formattedProducts);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Unable to load the collection. Please try again later.");
        setIsLoading(false);
      });
  }, []);

  // The Magic Filtering Logic
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === "All Collections" || product.category === activeCategory || 
      product.category + "s" === activeCategory;
    const matchesStock = !inStockOnly || product.inStock === true;
    const matchesScent = !activeScent || product.scent === activeScent;
    const matchesMaterial = !activeMaterial || product.material === activeMaterial;
    
    return matchesCategory && matchesStock && matchesScent && matchesMaterial;
  });

  const clearFilters = () => {
    setActiveCategory("All Collections");
    setInStockOnly(false);
    setActiveScent(null);
    setActiveMaterial(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f8] text-gray-900 font-sans">
      <Navbar />

      {/* HEADER SECTION */}
      <div className="pt-16 pb-12 text-center bg-white px-4">
        <span className="text-pink-500 text-xs font-bold tracking-widest uppercase mb-4 block">
          {activeCategory === "All Collections" ? "Curated Collection" : activeCategory}
        </span>
        <h1 className="text-4xl md:text-5xl font-serif mb-4 italic">
          {activeCategory === "All Collections" ? "The Autumn Edit" : `The ${activeCategory} Collection`}
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto font-light text-sm md:text-base">
          Discover a sophisticated curation of rare essences and masterfully crafted pieces, inspired by the transitional beauty of the changing seasons.
        </p>
      </div>

      <div className="border-t border-b border-gray-200 bg-white px-6 md:px-12 py-4 flex justify-between items-center text-xs uppercase tracking-widest text-gray-500">
        <div className="flex gap-2">
          <Link to="/" className="hover:text-pink-500 cursor-pointer">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">{activeCategory}</span>
        </div>
        
        {/* Mobile Filter Button */}
        <button 
          className="flex lg:hidden items-center gap-2 font-bold text-gray-900"
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
        >
          <Filter className="w-4 h-4"/> Filters
        </button>
      </div>

      {/* MAIN LAYOUT: Stack on mobile, side-by-side on desktop */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-8 md:py-12 flex flex-col lg:flex-row gap-12 w-full relative">
        
        {/* SIDEBAR FILTERS (Hidden on mobile unless toggled) */}
        <aside className={`w-full lg:w-64 flex-shrink-0 ${isMobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4"/> Refine By
            </h3>
            <button onClick={clearFilters} className="text-xs text-pink-500 hover:underline">
              Clear All
            </button>
          </div>

          <div className="mb-8 border-b border-gray-200 pb-8">
            <h4 className="font-bold text-sm mb-4">Category</h4>
            <div className="space-y-3 text-sm text-gray-600">
              {["All Collections", "Perfumes", "Fine Jewellery"].map(cat => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={activeCategory === cat}
                    onChange={() => {
                      setActiveCategory(cat);
                      // Reset sub-filters when changing parent categories
                      setActiveScent(null); 
                      setActiveMaterial(null);
                    }}
                    className="w-4 h-4 accent-pink-500"
                  />
                  <span className={activeCategory === cat ? "text-pink-500 font-medium" : ""}>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* DYNAMIC FILTER: SCENT (Only shows for Perfumes or All) */}
          {(activeCategory === "Perfumes" || activeCategory === "All Collections") && (
            <div className="mb-8 border-b border-gray-200 pb-8">
              <h4 className="font-bold text-sm mb-4">Scent Family</h4>
              <div className="grid grid-cols-2 gap-2">
                {["Floral", "Woody", "Citrus", "Oriental"].map(scent => (
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
          )}

          {/* DYNAMIC FILTER: MATERIAL (Only shows for Jewellery or All) */}
          {(activeCategory === "Fine Jewellery" || activeCategory === "All Collections") && (
            <div className="mb-8 border-b border-gray-200 pb-8">
              <h4 className="font-bold text-sm mb-4">Material</h4>
              <div className="space-y-3 text-sm text-gray-600">
                {["18k Yellow Gold", "18k White Gold", "Sterling Silver"].map(mat => (
                  <label key={mat} className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={activeMaterial === mat}
                      onChange={() => setActiveMaterial(activeMaterial === mat ? null : mat)}
                      className="w-4 h-4 accent-pink-500"
                    />
                    <span className={activeMaterial === mat ? "text-pink-500 font-medium" : ""}>{mat}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm uppercase tracking-widest text-gray-700">In Stock Only</h4>
            <div 
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${inStockOnly ? 'bg-pink-400' : 'bg-gray-200'}`}
            >
              <motion.div layout className="w-3 h-3 bg-white rounded-full shadow-sm" style={{ marginLeft: inStockOnly ? 'auto' : '0' }} />
            </div>
          </div>
        </aside>

        {/* PRODUCT GRID */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-8 text-xs text-gray-500">
            {activeCategory !== "All Collections" && (
              <span className="flex items-center gap-1 border border-gray-200 px-3 py-1 rounded-full bg-white">
                {activeCategory} <X className="w-3 h-3 cursor-pointer hover:text-pink-500" onClick={() => setActiveCategory("All Collections")}/>
              </span>
            )}
            {activeScent && (
              <span className="flex items-center gap-1 border border-gray-200 px-3 py-1 rounded-full bg-white">
                {activeScent} <X className="w-3 h-3 cursor-pointer hover:text-pink-500" onClick={() => setActiveScent(null)}/>
              </span>
            )}
            {activeMaterial && (
              <span className="flex items-center gap-1 border border-gray-200 px-3 py-1 rounded-full bg-white">
                {activeMaterial} <X className="w-3 h-3 cursor-pointer hover:text-pink-500" onClick={() => setActiveMaterial(null)}/>
              </span>
            )}
            <span className="ml-auto w-full md:w-auto text-right md:text-left mt-2 md:mt-0 italic font-medium">
              Showing {filteredProducts.length} products
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64 text-pink-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-gray-500 h-64 flex flex-col justify-center">
              <p>{error}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
             <div className="text-center text-gray-500 h-64 flex flex-col justify-center italic bg-white border border-gray-100 rounded-sm">
              <p>No products found matching your selections.</p>
              <button onClick={clearFilters} className="mt-4 text-pink-500 font-bold uppercase tracking-widest text-xs hover:underline">Clear Filters</button>
            </div>
          ) : (
            // RESPONSIVE GRID: 1 col on phones, 2 on tablets, 3 on laptops
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
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
                    <Link to={`/product/${product.id}`} className="group cursor-pointer flex flex-col">
                      <div className="relative bg-gray-100 aspect-[4/5] mb-4 overflow-hidden rounded-sm">
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                             <span className="bg-white px-4 py-2 text-xs uppercase tracking-widest font-bold text-gray-500 border border-gray-200 shadow-sm">Out of Stock</span>
                          </div>
                        )}
                        {product.tag && (
                          <span className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-gray-800 rounded-sm shadow-sm">
                            {product.tag}
                          </span>
                        )}
                        <img src={product.img} alt={product.name} className={`w-full h-full object-cover transition-transform duration-700 ${product.inStock ? 'group-hover:scale-105' : 'grayscale'}`} />
                      </div>
                      <div className="text-center px-2">
                        <span className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">{product.category}</span>
                        <h4 className="font-serif text-lg mt-1 mb-1 group-hover:text-pink-500 transition-colors leading-tight">{product.name}</h4>
                        <p className="text-gray-500 italic text-sm">Ksh {product.price.toLocaleString()}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}