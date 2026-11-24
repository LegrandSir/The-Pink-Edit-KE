import React, { useContext, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  SlidersHorizontal,
  Heart,
  Plus,
  Search,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CartContext } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { apiFetch, FALLBACK_IMAGE, formatKsh } from '../lib/api';

const CATEGORIES = ['All Collections', 'Perfumes', 'Fine Jewellery', 'Home Fragrance'];
const SCENTS = ['Floral', 'Woody', 'Citrus', 'Oriental'];
const MATERIALS = ['18k Yellow Gold', '18k White Gold', 'Sterling Silver'];

export default function ProductListing() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSlowWake, setIsSlowWake] = useState(false);
  const [error, setError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get('category') || 'All Collections'
  );
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeScent, setActiveScent] = useState(null);
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const { addToCart, openCart, wishlistIds, toggleWishlist } = useContext(CartContext);
  const { showToast } = useToast();

  // Keep local filter state synced when navigating from Navbar dropdown or Search overlay
  useEffect(() => {
    const cat = searchParams.get('category') || 'All Collections';
    const q = searchParams.get('search') || '';
    setActiveCategory(cat);
    setSearchTerm(q);
  }, [searchParams]);

  const updateUrlParams = (nextCategory, nextSearch) => {
    const params = {};
    if (nextCategory && nextCategory !== 'All Collections') params.category = nextCategory;
    if (nextSearch && nextSearch.trim()) params.search = nextSearch.trim();
    setSearchParams(params);
  };

  useEffect(() => {
    let active = true;
    const wakeTimer = setTimeout(() => {
      if (active) setIsSlowWake(true);
    }, 3000);

    apiFetch('/api/products')
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok || !Array.isArray(data)) {
          throw new Error('Failed to load products');
        }
        setProducts(data);
        setError(null);
      })
      .catch(() => {
        if (active) setError('Unable to load the collection right now. Please try again.');
      })
      .finally(() => {
        clearTimeout(wakeTimer);
        if (active) {
          setIsLoading(false);
          setIsSlowWake(false);
        }
      });

    return () => {
      active = false;
      clearTimeout(wakeTimer);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const matched = products.filter((p) => {
      const inStock = p.variants?.some((v) => v.available_stock > 0) || false;
      const materials = (p.variants || []).map((v) => v.metal_type).filter(Boolean);

      const matchesCategory =
        activeCategory === 'All Collections' ||
        p.category?.toLowerCase() === activeCategory.toLowerCase();

      const matchesStock = !inStockOnly || inStock;
      const matchesScent =
        !activeScent || p.scent_family?.toLowerCase() === activeScent.toLowerCase();
      const matchesMaterial =
        !activeMaterial ||
        materials.some((m) => m.toLowerCase() === activeMaterial.toLowerCase());

      const matchesSearch =
        !query ||
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.collection?.toLowerCase().includes(query) ||
        p.scent_family?.toLowerCase().includes(query) ||
        p.scent_notes?.toLowerCase().includes(query);

      return (
        matchesCategory &&
        matchesStock &&
        matchesScent &&
        matchesMaterial &&
        matchesSearch
      );
    });

    if (sortBy === 'price_asc') {
      return [...matched].sort((a, b) => a.base_price - b.base_price);
    }
    if (sortBy === 'price_desc') {
      return [...matched].sort((a, b) => b.base_price - a.base_price);
    }
    return matched;
  }, [products, activeCategory, inStockOnly, activeScent, activeMaterial, searchTerm, sortBy]);

  const clearFilters = () => {
    setActiveCategory('All Collections');
    setSearchTerm('');
    setInStockOnly(false);
    setActiveScent(null);
    setActiveMaterial(null);
    setSortBy('featured');
    setSearchParams({});
  };

  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const variant =
      product.variants?.find((v) => v.available_stock > 0) || product.variants?.[0];
    if (variant && variant.available_stock === 0) {
      showToast('This piece is currently sold out.', 'error');
      return;
    }

    const price = variant ? variant.price : product.base_price;
    const img = product.media?.[0]?.image_url || FALLBACK_IMAGE;

    addToCart({
      id: product.id,
      variantId: variant?.id,
      sku: variant?.sku,
      name: product.title,
      title: product.title,
      category: product.category,
      size: variant?.size || 'Standard',
      price,
      qty: 1,
      img,
    });
    showToast(`Added ${product.title} to your bag`);
    openCart();
  };

  const handleHeart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = await toggleWishlist(product.id);
    showToast(
      saved ? `Saved ${product.title} to wishlist` : `Removed ${product.title} from wishlist`,
      'info'
    );
  };

  const activeFilterCount =
    (activeCategory !== 'All Collections' ? 1 : 0) +
    (activeScent ? 1 : 0) +
    (activeMaterial ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F6] text-[#141414]">
      <Navbar />

      {/* EDITORIAL COLLECTION HEADER */}
      <section className="pt-14 pb-12 px-6 bg-white border-b border-stone-200/80 text-center">
        <span className="text-[#C86D85] text-[10px] font-semibold tracking-[0.28em] uppercase mb-3 block">
          {activeCategory === 'All Collections' ? 'Nairobi Atelier Catalog' : activeCategory}
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-4 text-[#141414]">
          {activeCategory === 'All Collections'
            ? 'The Complete Edit'
            : activeCategory}
        </h1>
        <p className="text-stone-500 max-w-xl mx-auto font-light text-sm leading-relaxed">
          Small-batch fragrances, sculptural 18k gold vermeil, and sanctuary vessels crafted for lasting everyday ritual.
        </p>
      </section>

      {/* UTILITY BAR */}
      <div className="border-b border-stone-200 bg-[#FAF8F6] px-6 lg:px-12 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-stone-500">
            <Link to="/" className="hover:text-[#141414] transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#141414] font-semibold">{activeCategory}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setIsMobileFilterOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center gap-2 border border-stone-300 bg-white px-4 py-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-[#141414]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </button>

            <div className="flex items-center gap-2 border border-stone-200 bg-white px-3 py-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-transparent outline-none text-[#141414] font-medium cursor-pointer"
                aria-label="Sort products"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10 lg:py-14 flex flex-col lg:flex-row gap-12 w-full flex-1">
        {/* SIDEBAR FILTERS */}
        <aside
          className={`w-full lg:w-64 shrink-0 space-y-8 ${
            isMobileFilterOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Inline Search */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                Search
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] uppercase tracking-widest text-[#C86D85] font-semibold hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  updateUrlParams(activeCategory, e.target.value);
                }}
                placeholder="Notes, scent, title..."
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-stone-200 text-xs outline-none focus:border-[#141414] transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    updateUrlParams(activeCategory, '');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#141414]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="border-t border-stone-200 pt-7">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500 mb-4">
              Department
            </h4>
            <div className="space-y-2.5">
              {CATEGORIES.map((cat) => {
                const selected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveScent(null);
                      setActiveMaterial(null);
                      updateUrlParams(cat, searchTerm);
                    }}
                    className={`w-full text-left flex items-center justify-between py-1 text-sm transition-colors ${
                      selected
                        ? 'text-[#141414] font-semibold'
                        : 'text-stone-500 hover:text-[#141414]'
                    }`}
                  >
                    <span>{cat}</span>
                    {selected && <span className="w-1.5 h-1.5 rounded-full bg-[#C86D85]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scent Family */}
          {(activeCategory === 'Perfumes' ||
            activeCategory === 'Home Fragrance' ||
            activeCategory === 'All Collections') && (
            <div className="border-t border-stone-200 pt-7">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500 mb-4">
                Olfactory Family
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {SCENTS.map((scent) => {
                  const selected = activeScent === scent;
                  return (
                    <button
                      key={scent}
                      onClick={() => setActiveScent(selected ? null : scent)}
                      className={`py-2 text-xs border transition-colors ${
                        selected
                          ? 'bg-[#141414] text-white border-[#141414]'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-[#141414]'
                      }`}
                    >
                      {scent}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Material */}
          {(activeCategory === 'Fine Jewellery' ||
            activeCategory === 'All Collections') && (
            <div className="border-t border-stone-200 pt-7">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500 mb-4">
                Precious Metal
              </h4>
              <div className="space-y-2.5">
                {MATERIALS.map((mat) => (
                  <label key={mat} className="flex items-center gap-3 cursor-pointer text-xs text-stone-600 hover:text-[#141414]">
                    <input
                      type="checkbox"
                      checked={activeMaterial === mat}
                      onChange={() => setActiveMaterial(activeMaterial === mat ? null : mat)}
                      className="w-3.5 h-3.5 accent-[#141414]"
                    />
                    <span className={activeMaterial === mat ? 'text-[#141414] font-semibold' : ''}>
                      {mat}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* In Stock Toggle */}
          <div className="border-t border-stone-200 pt-7 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-600">
              In Stock Only
            </span>
            <button
              type="button"
              onClick={() => setInStockOnly((prev) => !prev)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                inStockOnly ? 'bg-[#C86D85] justify-end' : 'bg-stone-300 justify-start'
              }`}
              aria-label="Toggle in stock only"
            >
              <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </button>
          </div>
        </aside>

        {/* PRODUCT GRID */}
        <div className="flex-1 min-w-0">
          {/* Active Chips & Count */}
          <div className="flex flex-wrap items-center gap-2 mb-8 text-xs">
            {activeCategory !== 'All Collections' && (
              <span className="inline-flex items-center gap-1.5 border border-stone-200 bg-white px-3 py-1 text-[11px]">
                {activeCategory}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-[#C86D85]"
                  onClick={() => {
                    setActiveCategory('All Collections');
                    updateUrlParams('All Collections', searchTerm);
                  }}
                />
              </span>
            )}
            {searchTerm.trim() && (
              <span className="inline-flex items-center gap-1.5 border border-stone-200 bg-white px-3 py-1 text-[11px]">
                &ldquo;{searchTerm}&rdquo;
                <X
                  className="w-3 h-3 cursor-pointer hover:text-[#C86D85]"
                  onClick={() => {
                    setSearchTerm('');
                    updateUrlParams(activeCategory, '');
                  }}
                />
              </span>
            )}
            {activeScent && (
              <span className="inline-flex items-center gap-1.5 border border-stone-200 bg-white px-3 py-1 text-[11px]">
                {activeScent}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-[#C86D85]"
                  onClick={() => setActiveScent(null)}
                />
              </span>
            )}
            {activeMaterial && (
              <span className="inline-flex items-center gap-1.5 border border-stone-200 bg-white px-3 py-1 text-[11px]">
                {activeMaterial}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-[#C86D85]"
                  onClick={() => setActiveMaterial(null)}
                />
              </span>
            )}

            <span className="ml-auto text-stone-400 text-[11px] uppercase tracking-[0.18em]">
              {isLoading ? 'Loading...' : `${filteredProducts.length} Pieces`}
            </span>
          </div>

          {isLoading ? (
            <div>
              {isSlowWake && (
                <div className="mb-6 p-4 bg-[#F7ECEF] border border-[#E8B4BC] text-xs text-[#141414] flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#C86D85] animate-pulse shrink-0" />
                  <span>Waking up the Render cloud server from idle — your catalog will appear in a few seconds.</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-7 gap-y-12">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="animate-pulse">
                    <div className="aspect-[4/5] bg-stone-200/80 mb-4" />
                    <div className="h-3 w-20 bg-stone-200 mb-2" />
                    <div className="h-5 w-44 bg-stone-200 mb-2" />
                    <div className="h-4 w-24 bg-stone-200" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="bg-white border border-stone-200 p-12 text-center">
              <p className="text-stone-600 text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#141414] text-white px-6 py-2.5 text-[11px] uppercase tracking-[0.2em]"
              >
                Retry
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-stone-200 p-16 text-center">
              <h3 className="font-serif text-2xl text-[#141414] mb-2">No matching pieces</h3>
              <p className="text-xs text-stone-500 mb-6">
                Try clearing a filter or exploring another department.
              </p>
              <button
                onClick={clearFilters}
                className="bg-[#141414] text-white px-7 py-3 text-[11px] uppercase tracking-[0.2em] hover:bg-[#C86D85] transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-7 gap-y-12"
            >
              <AnimatePresence>
                {filteredProducts.map((product) => {
                  const inStock = product.variants?.some((v) => v.available_stock > 0);
                  const mainImg = product.media?.[0]?.image_url || FALLBACK_IMAGE;
                  const secondaryImg = product.media?.[1]?.image_url;
                  const isSaved = wishlistIds.includes(product.id);
                  const minPrice = product.variants?.length
                    ? Math.min(...product.variants.map((v) => v.price))
                    : product.base_price;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      key={product.id}
                    >
                      <Link to={`/product/${product.id}`} className="group block">
                        <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden mb-4">
                          {!inStock && (
                            <div className="absolute inset-0 bg-white/55 z-20 flex items-center justify-center backdrop-blur-[1px]">
                              <span className="bg-[#141414] text-white px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold">
                                Sold Out
                              </span>
                            </div>
                          )}

                          {product.tags && (
                            <span className="absolute top-3.5 left-3.5 z-10 bg-white/95 backdrop-blur-sm px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#141414]">
                              {product.tags}
                            </span>
                          )}

                          <button
                            onClick={(e) => handleHeart(e, product)}
                            aria-label="Toggle wishlist"
                            className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#141414] hover:text-[#C86D85] transition-colors shadow-sm"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isSaved ? 'fill-[#C86D85] text-[#C86D85]' : ''
                              }`}
                            />
                          </button>

                          <img
                            src={mainImg}
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                            alt={product.title}
                            className={`w-full h-full object-cover transition-all duration-700 ${
                              inStock
                                ? secondaryImg
                                  ? 'group-hover:opacity-0'
                                  : 'group-hover:scale-105'
                                : 'grayscale'
                            }`}
                          />

                          {secondaryImg && inStock && (
                            <img
                              src={secondaryImg}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                              alt={`${product.title} alternate view`}
                              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                            />
                          )}

                          {inStock && (
                            <div className="absolute inset-x-3 bottom-3 z-20 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                              <button
                                onClick={(e) => handleQuickAdd(e, product)}
                                className="w-full bg-[#141414]/95 hover:bg-[#C86D85] text-white py-3 text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Quick Add
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-stone-400">
                          <span className="text-[#C86D85] font-semibold">{product.category}</span>
                          {product.variants?.length > 1 && (
                            <span>{product.variants.length} Sizes</span>
                          )}
                        </div>
                        <div className="flex justify-between items-baseline gap-2 mt-1">
                          <h3 className="font-serif text-xl text-[#141414] group-hover:text-[#C86D85] transition-colors truncate">
                            {product.title}
                          </h3>
                          <p className="text-sm font-medium text-stone-700 shrink-0">
                            {product.variants?.length > 1 ? `From ${formatKsh(minPrice)}` : formatKsh(minPrice)}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}