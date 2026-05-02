import React, { useState, useEffect } from 'react';
import { Download, Plus, Search, Filter, MoreHorizontal, Package, AlertCircle, CheckCircle2, Edit3, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // --- New Modal State ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: 'Perfume',
    base_price: '',
    description: ''
  });

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const res = await fetch('http://127.0.0.1:5000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}` 
        },
        // FIX 1: Tell the browser NEVER to cache this specific request!
        cache: 'no-store' 
      });
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // FIX 2: Sort the array so the highest ID (newest product) is at the very top
        const sortedProducts = data.sort((a, b) => b.id - a.id);
        setProducts(sortedProducts);
      } else {
        console.error("Backend returned an error instead of products:", data);
        setProducts([]); 
      }
    } catch (err) {
      console.error("Network error fetching products:", err);
      setProducts([]); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

 // --- Handle Form Submission ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: newProduct.title,
          category: newProduct.category,
          base_price: parseFloat(newProduct.base_price),
          description: newProduct.description
        })
      });

      if (res.ok) {
        await fetchProducts();
        setIsAddModalOpen(false);
        setNewProduct({ title: '', category: 'Perfume', base_price: '', description: '' });
      } else {
        const errorData = await res.json(); 
        console.error(`Failed to add product. Status: ${res.status}`, errorData);
      }
    } catch (err) {
      console.error("Server connection error", err);
    }
    
    setIsSubmitting(false);
  };

  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.variants?.some(v => v.available_stock > 0 && v.available_stock < 10)).length;
  const activeListings = products.filter(p => p.status === 'Active').length;

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-pink-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  // Your return ( <div className="max-w-7xl mx-auto space-y-8 relative"> ... ) starts immediately below here!

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-gray-900 mb-2">Products</h1>
          <p className="text-sm text-gray-500 font-light">Manage your jewelry catalog, inventory levels, and product availability.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { title: 'Total Products', value: totalProducts, icon: Package },
          { title: 'Low Stock Items', value: lowStockItems, icon: AlertCircle },
          { title: 'Active Listings', value: activeListings, icon: CheckCircle2 },
          { title: 'Drafts', value: products.filter(p => p.status === 'Draft').length, icon: Edit3 },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-sm border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">{stat.title}</p>
              <p className="text-2xl font-serif text-gray-900">{stat.value}</p>
            </div>
            <div className="p-3 bg-pink-50 rounded-full text-pink-500">
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-sm border border-gray-100 shadow-sm">
        {/* Table Controls */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, SKU, or category..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-300"
            />
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-sm hover:bg-gray-50">
               <Filter className="w-4 h-4"/> Filters
             </button>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-500 bg-white">
                <th className="p-4 font-bold w-10"><input type="checkbox" className="accent-pink-500" /></th>
                <th className="p-4 font-bold">Image</th>
                <th className="p-4 font-bold">Product Name</th>
                <th className="p-4 font-bold">Base Price</th>
                <th className="p-4 font-bold">Total Inventory</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const totalStock = product.variants?.reduce((sum, v) => sum + v.available_stock, 0) || 0;
                const mainImage = product.media?.find(m => m.is_main_image)?.image_url || product.media?.[0]?.image_url;

                return (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4"><input type="checkbox" className="accent-pink-500" /></td>
                    <td className="p-4">
                      <div className="w-12 h-12 rounded-sm overflow-hidden border border-gray-200 bg-gray-100">
                        {mainImage && <img src={mainImage} alt={product.title} className="w-full h-full object-cover" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-serif text-gray-900 group-hover:text-pink-600 transition-colors cursor-pointer">{product.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-900">${product.base_price?.toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm">
                        {totalStock === 0 ? (
                          <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Out of Stock</span>
                        ) : totalStock < 15 ? (
                          <span className="text-yellow-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {totalStock} Low Stock</span>
                        ) : (
                          <span className="text-gray-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500"/> {totalStock} in stock</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${
                        product.status === 'Active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="text-gray-400 hover:text-gray-900"><MoreHorizontal className="w-5 h-5" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD PRODUCT MODAL --- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-sm shadow-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="font-serif text-xl text-gray-900">Create New Product</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Product Title</label>
                  <input 
                    type="text" 
                    required
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                    className="w-full px-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400" 
                    placeholder="e.g. 18k Eternal Gold Ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Category</label>
                    <select 
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full px-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400"
                    >
                      <option>Perfume</option>
                      <option>Fine Jewellery</option>
                      <option>Accessories</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Base Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={newProduct.base_price}
                      onChange={(e) => setNewProduct({...newProduct, base_price: e.target.value})}
                      className="w-full px-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400" 
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Description</label>
                  <textarea 
                    rows="3"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-4 py-2 bg-[#faf8f8] border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-pink-400 resize-none" 
                    placeholder="Brief product description..."
                  />
                </div>

                <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-2 text-sm font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 rounded-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`flex items-center justify-center min-w-[120px] px-6 py-2 bg-pink-500 text-white rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-pink-600 transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Draft'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}