import React, { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Heart,
  Plus,
  Sparkles,
  Truck,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import heroBg from '../assets/hero-bg.jpg';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CartContext } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { apiFetch, FALLBACK_IMAGE, formatKsh } from '../lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

export default function LandingPage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, openCart, wishlistIds, toggleWishlist } = useContext(CartContext);
  const { showToast } = useToast();

  useEffect(() => {
    apiFetch('/api/products')
      .then(({ ok, data }) => {
        if (ok && Array.isArray(data)) {
          setFeaturedProducts(data.slice(0, 4));
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariant =
      product.variants?.find((v) => v.available_stock > 0) || product.variants?.[0];
    const price = defaultVariant ? defaultVariant.price : product.base_price;
    const image = product.media?.[0]?.image_url || FALLBACK_IMAGE;

    addToCart({
      id: product.id,
      variantId: defaultVariant?.id,
      sku: defaultVariant?.sku,
      name: product.title,
      title: product.title,
      category: product.category,
      size: defaultVariant?.size || 'Standard',
      price,
      qty: 1,
      img: image,
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

  const spotlightCollections = [
    {
      title: 'Artisanal Perfumes',
      subtitle: 'Extrait de Parfum & Botanical Mists',
      category: 'Perfumes',
      img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=900&auto=format&fit=crop',
    },
    {
      title: 'Fine Jewellery',
      subtitle: '18k Vermeil & Freshwater Pearls',
      category: 'Fine Jewellery',
      img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=900&auto=format&fit=crop',
    },
    {
      title: 'Home Sanctuary',
      subtitle: 'Hand-Poured Soy & Beeswax Vessels',
      category: 'Home Fragrance',
      img: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?q=80&w=900&auto=format&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-[#141414] flex flex-col">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative min-h-[82vh] lg:min-h-[88vh] w-full flex items-center px-6 lg:px-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            src={heroBg}
            alt="The Pink Edit Silk Backdrop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/65 via-[#141414]/35 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl text-white"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-[10px] uppercase tracking-[0.26em] mb-6">
              <Sparkles className="w-3 h-3 text-[#E8B4BC]" />
              <span>Autumn / Winter Nairobi Release</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-normal leading-[1.03] tracking-tight mb-6">
              The Scent of <br />
              <span className="italic text-[#F3CFD6]">Quiet Luxury.</span>
            </h1>

            <p className="text-white/85 font-light text-sm sm:text-base leading-relaxed mb-10 max-w-md">
              Small-batch extraits, 18k gold fine jewellery, and sculptural home vessels curated for modern East African elegance.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2.5 bg-white text-[#141414] px-8 py-4 text-xs font-semibold uppercase tracking-[0.22em] hover:bg-[#E8B4BC] transition-colors"
              >
                Explore the Edit <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/shop?category=Perfumes"
                className="inline-flex items-center justify-center gap-2 bg-transparent border border-white/60 text-white px-8 py-4 text-xs font-semibold uppercase tracking-[0.22em] hover:bg-white/10 backdrop-blur-sm transition-colors"
              >
                Signature Fragrances
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* EDITORIAL MARQUEE STRIP */}
      <div className="bg-[#141414] text-[#FAF8F6]/80 py-3.5 border-y border-stone-800 overflow-hidden select-none">
        <div className="animate-marquee flex items-center gap-12 text-[10px] uppercase tracking-[0.28em]">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-12 shrink-0">
              <span>Artisanal Extraits</span>
              <span className="text-[#C86D85]">✦</span>
              <span>M-Pesa Express Checkout</span>
              <span className="text-[#C86D85]">✦</span>
              <span>Ethically Sourced Moissanite &amp; 18k Gold</span>
              <span className="text-[#C86D85]">✦</span>
              <span>Same-Day Nairobi Courier</span>
              <span className="text-[#C86D85]">✦</span>
              <span>Complimentary Luxury Gift Wrapping</span>
              <span className="text-[#C86D85]">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* THE CURATED EDIT (LIVE FROM DATABASE) */}
      <section className="py-20 lg:py-28 px-6 lg:px-12 bg-[#FAF8F6]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
            <div>
              <span className="text-[10px] uppercase tracking-[0.26em] text-[#C86D85] font-semibold block mb-2">
                Handpicked Essentials
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#141414]">
                The Curated Edit
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-[#141414] border-b border-[#141414] pb-1.5 hover:text-[#C86D85] hover:border-[#C86D85] transition-colors"
            >
              View Full Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-stone-200/80 mb-4" />
                  <div className="h-3 w-20 bg-stone-200 mb-2" />
                  <div className="h-5 w-40 bg-stone-200 mb-2" />
                  <div className="h-4 w-24 bg-stone-200" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
            >
              {featuredProducts.map((product) => {
                const mainImg = product.media?.[0]?.image_url || FALLBACK_IMAGE;
                const isSaved = wishlistIds.includes(product.id);
                return (
                  <motion.div key={product.id} variants={fadeUp}>
                    <Link to={`/product/${product.id}`} className="group block">
                      <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden mb-4">
                        {product.tags && (
                          <span className="absolute top-3.5 left-3.5 z-10 bg-white/95 backdrop-blur-sm px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#141414]">
                            {product.tags}
                          </span>
                        )}

                        <button
                          onClick={(e) => handleHeart(e, product)}
                          aria-label="Save to wishlist"
                          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#141414] hover:text-[#C86D85] transition-colors shadow-sm"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
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
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />

                        {/* Quick Add Overlay */}
                        <div className="absolute inset-x-3 bottom-3 z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={(e) => handleQuickAdd(e, product)}
                            className="w-full bg-[#141414]/95 hover:bg-[#C86D85] text-white py-3 text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 transition-colors backdrop-blur-sm"
                          >
                            <Plus className="w-3.5 h-3.5" /> Quick Add
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#C86D85] font-semibold">
                        {product.category}
                      </p>
                      <div className="flex justify-between items-baseline gap-2 mt-1">
                        <h3 className="font-serif text-xl text-[#141414] group-hover:text-[#C86D85] transition-colors truncate">
                          {product.title}
                        </h3>
                        <p className="text-sm font-medium text-stone-600 shrink-0">
                          {formatKsh(product.base_price)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* COLLECTION SPOTLIGHT */}
      <section className="py-20 lg:py-28 px-6 lg:px-12 bg-white border-y border-stone-200/70">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[10px] uppercase tracking-[0.26em] text-[#C86D85] font-semibold block mb-2">
              Shop By Department
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#141414]">
              Three Worlds of Craft
            </h2>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {spotlightCollections.map((item) => (
              <motion.div key={item.title} variants={fadeUp}>
                <Link
                  to={`/shop?category=${encodeURIComponent(item.category)}`}
                  className="group relative block h-[380px] lg:h-[460px] overflow-hidden bg-stone-100"
                >
                  <img
                    src={item.img}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/80 via-[#141414]/20 to-transparent flex flex-col justify-end p-8">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#F3CFD6] mb-1.5">
                      {item.subtitle}
                    </p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-white text-2xl lg:text-3xl font-serif">
                        {item.title}
                      </h3>
                      <span className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#141414] transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ATELIER STORY SECTION */}
      <section
        id="atelier"
        className="py-20 lg:py-28 px-6 lg:px-12 bg-[#FAF8F6] scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 relative"
          >
            <div className="aspect-[4/5] overflow-hidden bg-stone-200">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=900&auto=format&fit=crop"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
                alt="The Pink Edit Atelier Editorial"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block absolute -bottom-6 -right-6 bg-white p-6 border border-stone-200 shadow-lg max-w-xs">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#C86D85] font-semibold mb-1">
                Est. Nairobi 2026
              </p>
              <p className="font-serif text-lg text-[#141414] italic">
                &ldquo;True luxury lives in the quiet ritual of getting ready.&rdquo;
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 lg:pl-6"
          >
            <span className="text-[10px] uppercase tracking-[0.26em] text-[#C86D85] font-semibold block mb-3">
              The Maison Philosophy
            </span>
            <h2 className="text-4xl lg:text-5xl font-serif leading-[1.1] mb-6 text-[#141414]">
              Crafting Moments of <br />
              <span className="italic text-[#C86D85]">Pure Radiance.</span>
            </h2>
            <p className="text-stone-600 font-light leading-relaxed mb-5 text-sm sm:text-base">
              Born in Nairobi, The Pink Edit bridges fine Grasse perfumery with contemporary East African sensibility. Every bottle is compounded at extrait concentration for lasting presence from Westlands mornings to late coastal evenings.
            </p>
            <p className="text-stone-600 font-light leading-relaxed mb-10 text-sm sm:text-base">
              Paired with waterproof 18k gold vermeil pieces and hand-poured botanical wax candles, each order arrives ribbon-wrapped and ready to gift.
            </p>

            <div className="grid grid-cols-3 gap-6 border-y border-stone-200 py-6 mb-10">
              <div>
                <p className="font-serif text-3xl text-[#141414]">24%</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500 mt-1">
                  Extrait Oil
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl text-[#141414]">18k</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500 mt-1">
                  Gold Vermeil
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl text-[#141414]">24h</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500 mt-1">
                  Nairobi Dispatch
                </p>
              </div>
            </div>

            <Link
              to="/shop"
              className="inline-flex items-center gap-2.5 bg-[#141414] text-white px-8 py-4 text-xs font-semibold uppercase tracking-[0.22em] hover:bg-[#C86D85] transition-colors"
            >
              Discover the Collection <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* TRUST PILLARS */}
      <section className="py-14 px-6 lg:px-12 bg-white border-t border-stone-200/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Smartphone,
              title: 'Seamless M-Pesa Express',
              desc: 'Instant STK Push checkout or Pay on Delivery across Nairobi and countrywide.',
            },
            {
              icon: Truck,
              title: 'Tracked Express Courier',
              desc: 'Pickup Mtaani, same-day Nairobi doorstep riders, and insured G4S nationwide delivery.',
            },
            {
              icon: ShieldCheck,
              title: 'Authenticity Guaranteed',
              desc: 'Every fragrance batch and jewellery piece is individually inspected before dispatch.',
            },
          ].map((pillar) => (
            <div key={pillar.title} className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-[#F7ECEF] text-[#C86D85] flex items-center justify-center shrink-0">
                <pillar.icon className="w-5 h-5 stroke-[1.6]" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-[#141414] mb-1">{pillar.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}