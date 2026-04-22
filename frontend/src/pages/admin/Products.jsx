import React, { useState, useEffect } from 'react';
import { Download, Plus, Search, Filter, MoreHorizontal, Package, AlertCircle, CheckCircle2, Edit3, Loader2 } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch products
    fetch('http://127.0.0.1:5000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  // Calculate quick stats from the loaded data
  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.variants.some(v => v.available_stock > 0 && v.available_stock < 10)).length;
  const activeListings = products.filter(p => p.status === 'Active').length;

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-pink-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
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
          <button className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest transition-colors">
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
          { title: 'Drafts', value: 0, icon: Edit3 },
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
                // Calculate total stock across all sizes/variants
                const totalStock = product.variants.reduce((sum, v) => sum + v.available_stock, 0);
                const mainImage = product.media.find(m => m.is_main_image)?.image_url || product.media[0]?.image_url;

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
                    <td className="p-4 text-sm font-medium text-gray-900">${product.base_price.toFixed(2)}</td>
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
    </div>
  );
}