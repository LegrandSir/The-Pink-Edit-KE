import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  Plus,
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Trash2,
  Loader2,
  X,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch, FALLBACK_IMAGE, formatKsh } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = {
  title: '',
  category: 'Perfumes',
  collection: 'Signature Collection',
  base_price: '',
  status: 'Active',
  tags: '',
  scent_family: 'Floral',
  scent_notes: '',
  description: '',
  image_url: '',
  variants: [
    { sku: '', size: '100ml', metal_type: '', price_adjustment: 0, available_stock: 25 },
  ],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { ok, status, data } = await apiFetch('/api/admin/products', { auth: 'admin' });
      if (status === 401 || status === 403) {
        localStorage.removeItem('adminToken');
        navigate('/admin', { replace: true });
        return;
      }
      if (ok && Array.isArray(data)) {
        setProducts(data);
      }
    } catch {
      showToast('Failed to load product catalog', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesQuery =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.variants?.some((v) => v.sku?.toLowerCase().includes(q));
      return matchesCat && matchesStatus && matchesQuery;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setFormState({
      title: product.title || '',
      category: product.category || 'Perfumes',
      collection: product.collection || '',
      base_price: product.base_price ?? '',
      status: product.status || 'Active',
      tags: product.tags || '',
      scent_family: product.scent_family || '',
      scent_notes: product.scent_notes || '',
      description: product.description || '',
      image_url: product.media?.[0]?.image_url || '',
      variants:
        product.variants?.length > 0
          ? product.variants.map((v) => ({
              id: v.id,
              sku: v.sku || '',
              size: v.size || '',
              metal_type: v.metal_type || '',
              price_adjustment: v.price_adjustment ?? 0,
              available_stock: v.available_stock ?? 0,
            }))
          : [{ sku: '', size: 'Standard', metal_type: '', price_adjustment: 0, available_stock: 10 }],
    });
    setIsModalOpen(true);
  };

  const updateVariantRow = (idx, field, value) => {
    setFormState((prev) => {
      const next = [...prev.variants];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, variants: next };
    });
  };

  const addVariantRow = () => {
    setFormState((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { sku: '', size: '', metal_type: '', price_adjustment: 0, available_stock: 10 },
      ],
    }));
  };

  const removeVariantRow = (idx) => {
    setFormState((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      title: formState.title,
      category: formState.category,
      collection: formState.collection,
      base_price: parseFloat(formState.base_price),
      status: formState.status,
      tags: formState.tags,
      scent_family: formState.category === 'Fine Jewellery' ? null : formState.scent_family || null,
      scent_notes: formState.scent_notes,
      description: formState.description,
      image_url: formState.image_url,
      variants: formState.variants
        .filter((v) => v.sku.trim())
        .map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          sku: v.sku.trim(),
          size: v.size || 'Standard',
          metal_type: v.metal_type || null,
          price_adjustment: parseFloat(v.price_adjustment || 0),
          available_stock: parseInt(v.available_stock || 0, 10),
        })),
    };

    try {
      const endpoint = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      const { ok, data } = await apiFetch(endpoint, {
        method,
        auth: 'admin',
        body: JSON.stringify(payload),
      });

      if (ok) {
        showToast(editingId ? 'Product updated in catalog' : 'New product published');
        setIsModalOpen(false);
        fetchProducts();
      } else {
        showToast(data.error || 'Could not save product', 'error');
      }
    } catch {
      showToast('Network error saving product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (product) => {
    if (!window.confirm(`Archive "${product.title}"? It will be hidden from the storefront.`)) {
      return;
    }
    try {
      const { ok, data } = await apiFetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        auth: 'admin',
      });
      if (ok) {
        showToast(`Archived ${product.title}`, 'info');
        fetchProducts();
      } else {
        showToast(data.error || 'Archive failed', 'error');
      }
    } catch {
      showToast('Network error archiving product', 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Base Price (KES)', 'Status', 'Total Stock', 'SKUs'];
    const rows = filteredProducts.map((p) => {
      const stock = (p.variants || []).reduce((s, v) => s + v.available_stock, 0);
      const skus = (p.variants || []).map((v) => v.sku).join(' | ');
      return [p.id, `"${p.title}"`, p.category, p.base_price, p.status, stock, `"${skus}"`].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `the-pink-edit-products-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported product catalog CSV');
  };

  const totalProducts = products.length;
  const activeListings = products.filter((p) => p.status === 'Active').length;
  const lowStockCount = products.filter((p) =>
    p.variants?.some((v) => v.available_stock < 8)
  ).length;
  const totalUnits = products.reduce(
    (sum, p) => sum + (p.variants?.reduce((s, v) => s + v.available_stock, 0) || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-[#C86D85]">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-7">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#141414]">Products &amp; Inventory</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Create, edit, price, and track stock across every SKU and size variant.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-none justify-center items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] hover:border-[#141414] transition-colors flex"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={openCreateModal}
            className="flex-1 md:flex-none justify-center items-center gap-2 bg-[#141414] hover:bg-[#C86D85] text-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors flex whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>
      </div>

      {/* STAT STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Catalog Products', value: totalProducts, icon: Package },
          { label: 'Active Listings', value: activeListings, icon: CheckCircle2 },
          { label: 'Low Stock Products', value: lowStockCount, icon: AlertTriangle, warn: lowStockCount > 0 },
          { label: 'Units Available', value: totalUnits, icon: Package },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 border border-stone-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
                {stat.label}
              </p>
              <p className="text-2xl font-serif text-[#141414] mt-1">{stat.value}</p>
            </div>
            <div className={`p-2.5 ${stat.warn ? 'bg-amber-50 text-amber-700' : 'bg-[#FAF8F6] text-[#C86D85]'}`}>
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* FILTER BAR & TABLE */}
      <div className="bg-white border border-stone-200">
        <div className="p-4 border-b border-stone-200 bg-[#FAF8F6] flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, category, or SKU..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 text-xs focus:border-[#141414] outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-stone-200 text-xs outline-none focus:border-[#141414]"
            >
              <option value="All">All Departments</option>
              <option value="Perfumes">Perfumes</option>
              <option value="Fine Jewellery">Fine Jewellery</option>
              <option value="Home Fragrance">Home Fragrance</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-stone-200 text-xs outline-none focus:border-[#141414]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-stone-200 text-[10px] uppercase tracking-[0.2em] text-stone-400 bg-white">
                <th className="p-4 font-bold">Product</th>
                <th className="p-4 font-bold">Base Price</th>
                <th className="p-4 font-bold">Variants / SKUs</th>
                <th className="p-4 font-bold">Inventory</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-stone-400 italic">
                    No products match your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const totalStock =
                    product.variants?.reduce((sum, v) => sum + v.available_stock, 0) || 0;
                  const hasLowVariant = product.variants?.some((v) => v.available_stock < 8);
                  const mainImage = product.media?.[0]?.image_url || FALLBACK_IMAGE;

                  return (
                    <tr key={product.id} className="hover:bg-[#FAF8F6]/70 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-14 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                            <img
                              src={mainImage}
                              onError={(e) => {
                                e.currentTarget.src = FALLBACK_IMAGE;
                              }}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-serif text-base text-[#141414] leading-tight">
                              {product.title}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.16em] text-[#C86D85] font-semibold mt-0.5">
                              {product.category}
                              {product.tags ? ` · ${product.tags}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-[#141414] whitespace-nowrap">
                        {formatKsh(product.base_price)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {(product.variants || []).map((v) => (
                            <span
                              key={v.id}
                              className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[10px] font-mono"
                            >
                              {v.size}: {v.available_stock}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {totalStock === 0 ? (
                          <span className="text-rose-600 font-semibold">Out of Stock</span>
                        ) : hasLowVariant ? (
                          <span className="text-amber-700 font-semibold">
                            {totalStock} total (Low SKU)
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">
                            {totalStock} available
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] font-bold ${
                            product.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end items-center gap-2">
                          <Link
                            to={`/product/${product.id}`}
                            target="_blank"
                            title="Preview on Storefront"
                            className="p-2 text-stone-400 hover:text-[#141414] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openEditModal(product)}
                            title="Edit Product"
                            className="p-2 text-stone-500 hover:text-[#C86D85] transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleArchive(product)}
                            title="Archive Product"
                            className="p-2 text-stone-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-2xl border border-stone-200 shadow-2xl my-8 max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-5 border-b border-stone-200 flex justify-between items-center bg-[#FAF8F6]">
                <div>
                  <h2 className="font-serif text-2xl text-[#141414]">
                    {editingId ? 'Edit Product' : 'Create New Product'}
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    Changes sync live to your storefront and Neon Postgres.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-stone-400 hover:text-[#141414]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.title}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      placeholder="e.g. Amber Velvet Extrait"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Department *
                    </label>
                    <select
                      value={formState.category}
                      onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                    >
                      <option value="Perfumes">Perfumes</option>
                      <option value="Fine Jewellery">Fine Jewellery</option>
                      <option value="Home Fragrance">Home Fragrance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Base Price (Ksh) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formState.base_price}
                      onChange={(e) => setFormState({ ...formState, base_price: e.target.value })}
                      placeholder="24000"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Status
                    </label>
                    <select
                      value={formState.status}
                      onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                    >
                      <option value="Active">Active (Live on Shop)</option>
                      <option value="Draft">Draft (Hidden)</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Badge Tag (Optional)
                    </label>
                    <input
                      type="text"
                      value={formState.tags}
                      onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
                      placeholder="Best Seller, New Arrival, Limited Edition"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                    />
                  </div>

                  {formState.category !== 'Fine Jewellery' && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                        Scent Family
                      </label>
                      <select
                        value={formState.scent_family}
                        onChange={(e) => setFormState({ ...formState, scent_family: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                      >
                        <option value="Floral">Floral</option>
                        <option value="Woody">Woody</option>
                        <option value="Citrus">Citrus</option>
                        <option value="Oriental">Oriental</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      value={formState.collection}
                      onChange={(e) => setFormState({ ...formState, collection: e.target.value })}
                      placeholder="Signature Collection"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-sm focus:border-[#141414] outline-none"
                    />
                  </div>
                </div>

                {/* Image URL + Live Preview */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                    Primary Image URL
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="url"
                      value={formState.image_url}
                      onChange={(e) => setFormState({ ...formState, image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs focus:border-[#141414] outline-none"
                    />
                    <div className="w-12 h-12 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                      <img
                        src={formState.image_url || FALLBACK_IMAGE}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows="2"
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    placeholder="Editorial description shown on the product page..."
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs focus:border-[#141414] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1.5">
                    Olfactory Notes / Material Specs (pipe separated)
                  </label>
                  <input
                    type="text"
                    value={formState.scent_notes}
                    onChange={(e) => setFormState({ ...formState, scent_notes: e.target.value })}
                    placeholder="Top: Bergamot | Heart: Damask Rose | Base: Smoked Oud"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F6] border border-stone-200 text-xs focus:border-[#141414] outline-none"
                  />
                </div>

                {/* Variants & Stock Builder */}
                <div className="border-t border-stone-200 pt-5">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#141414] font-bold">
                      Variants &amp; Inventory SKUs
                    </label>
                    <button
                      type="button"
                      onClick={addVariantRow}
                      className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#C86D85] hover:text-[#141414] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Variant
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formState.variants.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F6] p-2.5 border border-stone-200"
                      >
                        <input
                          type="text"
                          required
                          placeholder="SKU (e.g. AV-100ML)"
                          value={v.sku}
                          onChange={(e) => updateVariantRow(idx, 'sku', e.target.value)}
                          className="col-span-4 px-2.5 py-1.5 bg-white border border-stone-200 text-xs font-mono outline-none focus:border-[#141414]"
                        />
                        <input
                          type="text"
                          placeholder="Size (100ml)"
                          value={v.size}
                          onChange={(e) => updateVariantRow(idx, 'size', e.target.value)}
                          className="col-span-3 px-2.5 py-1.5 bg-white border border-stone-200 text-xs outline-none focus:border-[#141414]"
                        />
                        <input
                          type="number"
                          placeholder="+/- Price"
                          title="Price adjustment relative to Base Price (Ksh)"
                          value={v.price_adjustment}
                          onChange={(e) => updateVariantRow(idx, 'price_adjustment', e.target.value)}
                          className="col-span-2 px-2 py-1.5 bg-white border border-stone-200 text-xs outline-none focus:border-[#141414]"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Stock"
                          title="Available stock"
                          value={v.available_stock}
                          onChange={(e) => updateVariantRow(idx, 'available_stock', e.target.value)}
                          className="col-span-2 px-2 py-1.5 bg-white border border-stone-200 text-xs outline-none focus:border-[#141414]"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          disabled={formState.variants.length <= 1}
                          className="col-span-1 flex justify-center text-stone-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-[#141414]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#141414] hover:bg-[#C86D85] text-white text-xs font-semibold uppercase tracking-[0.2em] flex items-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingId ? 'Save Changes' : 'Publish Product'}
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