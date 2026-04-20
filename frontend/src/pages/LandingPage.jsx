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
      <section className="relative h-[80vh] w-full flex items-center justify-start px-20 overflow-hidden">
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
          className="relative z-10 bg-white/70 backdrop-blur-md p-12 rounded-lg max-w-xl shadow-xl border border-white/40"
        >
          <span className="text-pink-500 text-xs font-bold tracking-widest uppercase mb-4 block">New Arrival</span>
          <h1 className="text-5xl font-serif leading-tight mb-4">THE SCENT OF <br/>SOPHISTICATION</h1>
          <p className="text-gray-600 mb-8 font-light">
            Introducing 'Rose Mundi' — Our signature fragrance for the modern muse.
          </p>
          <Link to="/product">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-pink-500 text-white px-8 py-3 rounded-sm uppercase tracking-wide text-sm hover:bg-pink-600 transition-colors"
            >
              Shop The Fragrance
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* COLLECTION SPOTLIGHT */}
      <section className="py-24 px-12 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif mb-2">The Collection Spotlight</h2>
          <div className="h-px w-24 bg-pink-300 mx-auto"></div>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {[
            { title: "Artisanal Perfume", img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop" },
            { title: "Fine Jewellery", img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop" },
            { title: "Limited Edition", img: "https://images.unsplash.com/photo-1590156546946-ce55a12a6a5d?q=80&w=800&auto=format&fit=crop" }
          ].map((item, index) => (
            <motion.div key={index} variants={fadeUp} className="group relative h-[400px] overflow-hidden rounded-md cursor-pointer">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <h3 className="text-white text-xl font-serif tracking-wide">{item.title}</h3>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CRAFTING MOMENTS (Split Section) */}
      <section className="py-24 px-12 bg-[#faf8f8] flex items-center justify-center gap-16 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-1/2"
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
          className="w-1/2 pr-12"
        >
          <h2 className="text-4xl font-serif mb-6 leading-snug">Crafting Moments of <br/><span className="italic text-pink-400">Pure Radiance.</span></h2>
          <p className="text-gray-600 mb-6 font-light leading-relaxed">
            At The Pink Edit, we believe luxury isn't just about possession; it's about the emotional connection to a scent, a memory, the shimmer of a jewel against the skin.
          </p>
          <blockquote className="border-l-4 border-pink-300 pl-4 py-2 my-8 text-gray-800 italic font-serif text-lg">
            "True luxury is found in the quiet moments of elegance."
          </blockquote>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="border-2 border-pink-500 text-pink-500 px-8 py-3 rounded-sm uppercase tracking-wide text-sm hover:bg-pink-50 transition-colors"
          >
            Our Philosophy
          </motion.button>
        </motion.div>
      </section>

      {/* THE CURATED EDIT (Products) */}
      <section className="py-24 px-12 bg-white">
        <div className="flex justify-between items-end mb-12 max-w-7xl mx-auto">
          <h2 className="text-3xl font-serif">The Curated Edit</h2>
          <Link to="/shop" className="text-sm uppercase tracking-widest border-b border-gray-900 pb-1 hover:text-pink-500 hover:border-pink-500 transition-colors">
            Shop All Products
          </Link>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-4 gap-6 max-w-7xl mx-auto"
        >
          {[
            { name: "L'Ombre Extrait", price: "$240", img: "https://images.unsplash.com/photo-1523293115678-efa8003fdf53?q=80&w=500&auto=format&fit=crop" },
            { name: "Celestial Band", price: "$890", img: "https://images.unsplash.com/photo-1605100804763-247f67b2548e?q=80&w=500&auto=format&fit=crop" },
            { name: "Velvet Rose Mist", price: "$95", img: "https://images.unsplash.com/photo-1595425964071-1a3b1a8f9411?q=80&w=500&auto=format&fit=crop" },
            { name: "Pearl Drop Earrings", price: "$420", img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=500&auto=format&fit=crop" }
          ].map((product, idx) => (
            <motion.div key={idx} variants={fadeUp} className="group cursor-pointer">
              <Link to="/product">
                <div className="bg-gray-100 h-80 mb-4 overflow-hidden rounded-sm relative">
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex justify-between items-center">
                  <h4 className="font-serif text-lg">{product.name}</h4>
                  <p className="text-gray-500">{product.price}</p>
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