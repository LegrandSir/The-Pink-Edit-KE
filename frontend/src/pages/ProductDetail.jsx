import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Truck,
  ShieldCheck,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CartContext } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { apiFetch, FALLBACK_IMAGE, formatKsh } from '../lib/api';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart, openCart, wishlistIds, toggleWishlist } = useContext(CartContext);
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [openAccordion, setOpenAccordion] = useState('notes');

  useEffect(() => {
    setIsLoading(true);
    setQuantity(1);

    Promise.all([apiFetch(`/api/products/${id}`), apiFetch('/api/products')])
      .then(([detailRes, allRes]) => {
        if (!detailRes.ok) throw new Error('Product not found');
        const data = detailRes.data;
        setProduct(data);

        const defaultVariant =
          data.variants?.find((v) => v.available_stock > 0) || data.variants?.[0];
        setSelectedVariantId(defaultVariant?.id || null);
        setActiveImage(data.media?.[0]?.image_url || FALLBACK_IMAGE);

        if (allRes.ok && Array.isArray(allRes.data)) {
          const others = allRes.data
            .filter((p) => p.id !== data.id)
            .sort((a, b) => (a.category === data.category ? -1 : b.category === data.category ? 1 : 0))
            .slice(0, 4);
          setRelatedProducts(others);
        }
        setError(null);
      })
      .catch(() => {
        setError('Unable to load this piece.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const activeVariant =
    product?.variants?.find((v) => v.id === selectedVariantId) || product?.variants?.[0];

  const displayPrice = activeVariant
    ? activeVariant.price
    : product?.base_price || 0;

  const maxStock = activeVariant ? activeVariant.available_stock : 0;
  const isSaved = product ? wishlistIds.includes(product.id) : false;

  const parsedNotes = (product?.scent_notes || '')
    .split('|')
    .map((segment) => {
      const [label, ...rest] = segment.split(':');
      if (!rest.length) return null;
      return { label: label.trim(), value: rest.join(':').trim() };
    })
    .filter(Boolean);

  const handleAddToBag = () => {
    if (!product || !activeVariant || activeVariant.available_stock === 0) return;

    addToCart({
      id: product.id,
      variantId: activeVariant.id,
      sku: activeVariant.sku,
      name: product.title,
      title: product.title,
      category: product.category,
      price: displayPrice,
      qty: quantity,
      size: activeVariant.size || 'Standard',
      img: activeImage || FALLBACK_IMAGE,
    });
    showToast(`Added ${quantity}x ${product.title} (${activeVariant.size}) to bag`);
    openCart();
  };

  const handleWishlist = async () => {
    if (!product) return;
    const saved = await toggleWishlist(product.id);
    showToast(
      saved ? `Saved ${product.title} to wishlist` : `Removed ${product.title} from wishlist`,
      'info'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F6]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 w-full animate-pulse">
          <div className="aspect-[4/5] bg-stone-200/80" />
          <div className="space-y-4 py-8">
            <div className="h-3 w-32 bg-stone-200" />
            <div className="h-10 w-3/4 bg-stone-200" />
            <div className="h-6 w-32 bg-stone-200" />
            <div className="h-24 w-full bg-stone-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F6]">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center text-stone-500 px-6 text-center py-24">
          <h2 className="font-serif text-3xl text-[#141414] mb-2">Piece Not Found</h2>
          <p className="text-sm mb-6">{error}</p>
          <Link
            to="/shop"
            className="bg-[#141414] text-white px-8 py-3.5 text-xs uppercase tracking-[0.2em]"
          >
            Return to Catalog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const gallery = product.media?.length
    ? product.media
    : [{ id: 'fallback', image_url: FALLBACK_IMAGE }];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F6] text-[#141414]">
      <Navbar />

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-5 text-[10px] uppercase tracking-[0.22em] text-stone-500 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-[#141414]">Home</Link>
        <span>/</span>
        <Link
          to={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-[#141414]"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-[#141414] font-semibold">{product.title}</span>
      </div>

      {/* Main Split Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 w-full">
        {/* Left: Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {gallery.length > 1 && (
            <div className="flex flex-row sm:flex-col gap-3 sm:w-20 shrink-0 overflow-x-auto hide-scrollbar">
              {gallery.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.image_url)}
                  className={`w-16 h-20 sm:w-20 sm:h-24 overflow-hidden border transition-all shrink-0 ${
                    activeImage === img.image_url
                      ? 'border-[#141414] opacity-100'
                      : 'border-stone-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.image_url}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 bg-stone-100 relative overflow-hidden aspect-[4/5]">
            {product.tags && (
              <span className="absolute top-5 left-5 z-10 bg-white/95 backdrop-blur-sm text-[#141414] px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold">
                {product.tags}
              </span>
            )}
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0.2, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                src={activeImage || FALLBACK_IMAGE}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
                className="w-full h-full object-cover"
                alt={product.title}
              />
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#C86D85] text-[10px] font-bold tracking-[0.26em] uppercase">
              {product.collection || product.category}
            </span>
            <button
              onClick={handleWishlist}
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-[#C86D85] transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${isSaved ? 'fill-[#C86D85] text-[#C86D85]' : ''}`}
              />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          <h1 className="text-4xl lg:text-5xl font-serif leading-[1.08] text-[#141414] mb-4">
            {product.title}
          </h1>

          <div className="flex items-baseline gap-4 mb-6">
            <motion.p
              key={displayPrice}
              initial={{ opacity: 0.4, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-medium text-[#141414]"
            >
              {formatKsh(displayPrice)}
            </motion.p>
            {activeVariant && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold ${
                  maxStock === 0
                    ? 'text-rose-600'
                    : maxStock < 8
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}
              >
                {maxStock === 0 ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" /> Out of Stock
                  </>
                ) : maxStock < 8 ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Only {maxStock} Left
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> In Stock ({maxStock})
                  </>
                )}
              </span>
            )}
          </div>

          <p className="text-stone-600 font-light leading-relaxed mb-8 text-sm sm:text-base">
            {product.description}
          </p>

          {/* Variant Selector */}
          {product.variants?.length > 0 && (
            <div className="mb-7">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] mb-3">
                <span className="font-bold text-stone-700">Select Size / Edition</span>
                {activeVariant?.sku && (
                  <span className="text-stone-400 font-mono">SKU: {activeVariant.sku}</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.variants.map((v) => {
                  const selected = activeVariant?.id === v.id;
                  const soldOut = v.available_stock === 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQuantity(1);
                      }}
                      disabled={soldOut}
                      className={`py-3 px-3 text-left border transition-all ${
                        selected
                          ? 'border-[#141414] bg-[#141414] text-white'
                          : 'border-stone-300 bg-white text-[#141414] hover:border-[#141414]'
                      } ${soldOut ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                    >
                      <p className="text-xs font-semibold">{v.size || 'Standard'}</p>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          selected ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        {formatKsh(v.price)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & CTA */}
          <div className="flex gap-3 mb-8">
            <div className="flex items-center border border-stone-300 bg-white w-32 shrink-0">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3.5 py-3.5 text-stone-500 hover:text-[#141414] transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="flex-1 text-center font-medium text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(Math.max(1, maxStock), q + 1))}
                className="px-3.5 py-3.5 text-stone-500 hover:text-[#141414] transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <motion.button
              onClick={handleAddToBag}
              disabled={maxStock === 0}
              whileTap={{ scale: maxStock === 0 ? 1 : 0.98 }}
              className={`flex-1 font-semibold uppercase tracking-[0.22em] text-xs py-4 transition-colors ${
                maxStock === 0
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-[#141414] text-white hover:bg-[#C86D85]'
              }`}
            >
              {maxStock === 0
                ? 'Currently Sold Out'
                : `Add to Bag — ${formatKsh(displayPrice * quantity)}`}
            </motion.button>
          </div>

          {/* Service Assurances */}
          <div className="grid grid-cols-2 gap-4 py-5 border-y border-stone-200 mb-6 text-[11px] text-stone-600">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-[#C86D85] shrink-0" />
              <span>Free delivery over Ksh 25,000</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#C86D85] shrink-0" />
              <span>Certified authentic atelier batch</span>
            </div>
          </div>

          {/* Accordions */}
          <div className="divide-y divide-stone-200">
            {[
              {
                id: 'notes',
                title: product.category === 'Fine Jewellery' ? 'Craftsmanship & Materials' : 'Olfactory Profile',
                content:
                  parsedNotes.length > 0 ? (
                    <div className="space-y-2.5 pt-3">
                      {parsedNotes.map((row) => (
                        <div key={row.label} className="flex justify-between gap-4 text-xs">
                          <span className="uppercase tracking-[0.16em] text-stone-400 font-semibold shrink-0">
                            {row.label}
                          </span>
                          <span className="text-stone-700 text-right">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-500 text-xs pt-3 leading-relaxed">
                      {product.scent_family
                        ? `Olfactory family: ${product.scent_family}. Formulated for enduring sillage.`
                        : 'Hand-inspected luxury finish designed for timeless wear.'}
                    </p>
                  ),
              },
              {
                id: 'shipping',
                title: 'Delivery & Returns',
                content: (
                  <p className="text-stone-500 text-xs pt-3 leading-relaxed">
                    Same-day doorstep courier within Nairobi CBD and environs, Pickup Mtaani agents from Ksh 200, or G4S insured nationwide delivery. Complimentary shipping on orders above Ksh 25,000. Unopened returns accepted within 14 days.
                  </p>
                ),
              },
            ].map((section) => (
              <div key={section.id} className="py-4">
                <button
                  onClick={() =>
                    setOpenAccordion(openAccordion === section.id ? null : section.id)
                  }
                  className="flex justify-between items-center w-full text-xs font-bold uppercase tracking-[0.2em] text-[#141414]"
                >
                  <span>{section.title}</span>
                  {openAccordion === section.id ? (
                    <ChevronUp className="w-4 h-4 text-[#C86D85]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  )}
                </button>
                <AnimatePresence>
                  {openAccordion === section.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {section.content}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RELATED PIECES */}
      {relatedProducts.length > 0 && (
        <section className="py-16 lg:py-20 px-6 lg:px-12 bg-white border-t border-stone-200/80">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.24em] text-[#C86D85] font-semibold">
                  Complete the Ritual
                </span>
                <h2 className="text-3xl font-serif text-[#141414] mt-1">You May Also Like</h2>
              </div>
              <Link
                to="/shop"
                className="text-[11px] uppercase tracking-[0.2em] text-stone-500 hover:text-[#141414] border-b border-stone-300 pb-1"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <Link key={rel.id} to={`/product/${rel.id}`} className="group block">
                  <div className="aspect-[4/5] bg-stone-100 overflow-hidden mb-3">
                    <img
                      src={rel.media?.[0]?.image_url || FALLBACK_IMAGE}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#C86D85] font-semibold">
                    {rel.category}
                  </p>
                  <h3 className="font-serif text-lg text-[#141414] group-hover:text-[#C86D85] transition-colors truncate">
                    {rel.title}
                  </h3>
                  <p className="text-xs text-stone-500">{formatKsh(rel.base_price)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}