import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import heroBg from '../assets/hero-bg.jpg';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Animation Variants for Framer Motion
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf8f8] text-gray-900 font-sans">
      
      <Navbar />

      {/* HERO SECTION */}
      {/* MOBILE FIX: Centered text on mobile, left-aligned on desktop, adjusted padding */}
      <section className="relative h-[80vh] lg:h-[90vh] w-full flex items-center justify-center lg:justify-start px-6 lg:px-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Pink Silk Background" 
            className="w-full h-full object-cover opacity-80"
          />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 bg-white/80 lg:bg-white/70 backdrop-blur-md p-8 lg:p-12 rounded-lg w-full max-w-xl shadow-xl border border-white/40 text-center lg:text-left"
        >
          <span className="text-pink-500 text-xs font-bold tracking-widest uppercase mb-4 block">New Arrival</span>
          <h1 className="text-4xl lg:text-5xl font-serif leading-tight mb-4">THE SCENT OF <br className="hidden lg:block"/>SOPHISTICATION</h1>
          <p className="text-gray-600 mb-8 font-light text-sm lg:text-base">
            Introducing 'Rose Mundi' — Our signature fragrance for the modern muse.
          </p>
          <Link to="/shop">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-pink-500 text-white px-8 py-3 rounded-sm uppercase tracking-wide text-sm hover:bg-pink-600 transition-colors w-full sm:w-auto"
            >
              Shop The Fragrance
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* COLLECTION SPOTLIGHT */}
      <section className="py-16 lg:py-24 px-6 lg:px-12 bg-white">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl font-serif mb-2">The Collection Spotlight</h2>
          <div className="h-px w-24 bg-pink-300 mx-auto"></div>
        </div>

        {/* MOBILE FIX: grid-cols-1 for phones, md:grid-cols-3 for tablets/laptops */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto"
        >
          {[
            { title: "Artisanal Perfume", img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop" },
            { title: "Fine Jewellery", img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop" },
            { title: "Limited Edition", img: "https://images.unsplash.com/photo-1590156546946-ce55a12a6a5d?q=80&w=800&auto=format&fit=crop" }
          ].map((item, index) => (
            <motion.div key={index} variants={fadeUp} className="group relative h-[300px] lg:h-[400px] overflow-hidden rounded-md cursor-pointer">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 lg:p-8">
                <h3 className="text-white text-lg lg:text-xl font-serif tracking-wide">{item.title}</h3>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CRAFTING MOMENTS (Split Section) */}
      {/* MOBILE FIX: flex-col for stacking on phones, text-center adjustment */}
      <section className="py-16 lg:py-24 px-6 lg:px-12 bg-[#faf8f8] flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full lg:w-1/2"
        >
          <img 
            src="https://images.unsplash.com/photo-1616091216791-a5360b5ce757?q=80&w=800&auto=format&fit=crop" 
            alt="Model with perfume" 
            className="w-full h-auto rounded-md shadow-2xl"
          />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full lg:w-1/2 lg:pr-12 text-center lg:text-left"
        >
          <h2 className="text-3xl lg:text-4xl font-serif mb-6 leading-snug">Crafting Moments of <br className="hidden lg:block"/><span className="italic text-pink-400">Pure Radiance.</span></h2>
          <p className="text-gray-600 mb-6 font-light leading-relaxed text-sm lg:text-base">
            At The Pink Edit, we believe luxury isn't just about possession; it's about the emotional connection to a scent, a memory, the shimmer of a jewel against the skin.
          </p>
          <blockquote className="border-l-4 border-pink-300 pl-4 py-2 my-8 text-gray-800 italic font-serif text-base lg:text-lg text-left">
            "True luxury is found in the quiet moments of elegance."
          </blockquote>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="border-2 border-pink-500 text-pink-500 px-8 py-3 rounded-sm uppercase tracking-wide text-sm hover:bg-pink-50 transition-colors w-full sm:w-auto"
          >
            Our Philosophy
          </motion.button>
        </motion.div>
      </section>

      {/* THE CURATED EDIT (Products) */}
      <section className="py-16 lg:py-24 px-6 lg:px-12 bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 mb-10 lg:mb-12 max-w-7xl mx-auto">
          <h2 className="text-3xl font-serif text-center sm:text-left">The Curated Edit</h2>
          <Link to="/shop" className="text-xs lg:text-sm uppercase tracking-widest border-b border-gray-900 pb-1 hover:text-pink-500 hover:border-pink-500 transition-colors">
            Shop All Products
          </Link>
        </div>

        {/* MOBILE FIX: grid-cols-1 to 2 to 4 */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
        >
          {[
            { name: "L'Ombre Extrait", price: "Ksh 24,000", img: "https://images.unsplash.com/photo-1523293115678-efa8003fdf53?q=80&w=500&auto=format&fit=crop" },
            { name: "Celestial Band", price: "Ksh 89,000", img: "https://images.unsplash.com/photo-1605100804763-247f67b2548e?q=80&w=500&auto=format&fit=crop" },
            { name: "Velvet Rose Mist", price: "Ksh 9,500", img: "https://images.unsplash.com/photo-1595425964071-1a3b1a8f9411?q=80&w=500&auto=format&fit=crop" },
            { name: "Pearl Drop Earrings", price: "Ksh 42,000", img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=500&auto=format&fit=crop" }
          ].map((product, idx) => (
            <motion.div key={idx} variants={fadeUp} className="group cursor-pointer">
              <Link to="/shop">
                <div className="bg-gray-100 h-72 lg:h-80 mb-4 overflow-hidden rounded-sm relative">
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex justify-between items-center px-1">
                  <h4 className="font-serif text-lg">{product.name}</h4>
                  <p className="text-gray-500 text-sm">{product.price}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Footer />

    </div>
  );
}