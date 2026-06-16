import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Loader2, AlertCircle, Package, DollarSign, Layers, Edit3, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { getMyProducts, createProduct, updateProduct, deleteProduct, adjustProductStock } from '../../api/products';

interface ProductItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  category: string;
  isActive: boolean;
  taxable: boolean;
}

const emptyProduct = () => ({
  name: '', description: '', price: 0, costPrice: 0, sku: '',
  stock: 0, lowStockThreshold: 5, category: 'General', isActive: true, taxable: true
});

export default function Products() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(emptyProduct());
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stockUpdate, setStockUpdate] = useState<{ id: string; qty: string } | null>(null);

  useEffect(() => { loadProducts(); }, [category]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getMyProducts({ category: category || undefined, search: search || undefined });
      setProducts(data);
    } catch { setError('Failed to load products'); } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!editForm.name || editForm.price <= 0) { setError('Name and price required'); return; }
    setSaving(true);
    try {
      await createProduct(editForm);
      setShowAdd(false);
      setEditForm(emptyProduct());
      loadProducts();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to create'); } finally { setSaving(false); }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      await updateProduct(id, editForm);
      setEditing(null);
      loadProducts();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to update'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try { await deleteProduct(id); loadProducts(); } catch { setError('Failed to delete'); }
  };

  const handleStockAdjust = async (id: string) => {
    if (!stockUpdate) return;
    try {
      await adjustProductStock(id, parseInt(stockUpdate.qty) || 0, 'set');
      setStockUpdate(null);
      loadProducts();
    } catch { setError('Failed to update stock'); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Products & Inventory</h1>
          <p className="text-[#7A7168] text-sm mt-1">Manage your retail products and stock levels</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditForm(emptyProduct()); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#333] transition-colors text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355]" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355]">
          <option value="">All Categories</option>
          <option value="General">General</option>
          <option value="Hair">Hair</option>
          <option value="Skin">Skin</option>
          <option value="Nails">Nails</option>
          <option value="Products">Products</option>
        </select>
        <button onClick={loadProducts} className="p-2 text-gray-500 hover:text-[#1A1A1A]"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#7A7168]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3" />
          <p>No products yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(product => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#1A1A1A] truncate">{product.name}</h3>
                  <p className="text-xs text-gray-400">{product.category}{product.sku ? ` • SKU: ${product.sku}` : ''}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm mt-3">
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-gray-400" /> GH₵{product.price}</span>
                {product.costPrice > 0 && <span className="text-xs text-gray-400">Cost: GH₵{product.costPrice}</span>}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-3 h-3 text-gray-400" />
                  {stockUpdate?.id === product._id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" value={stockUpdate.qty} onChange={e => setStockUpdate({ ...stockUpdate, qty: e.target.value })}
                        className="w-16 border border-[#E8E0D8] rounded px-1.5 py-0.5 text-xs" autoFocus />
                      <button onClick={() => handleStockAdjust(product._id)} className="text-xs text-green-600">Set</button>
                      <button onClick={() => setStockUpdate(null)} className="text-xs text-gray-400">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setStockUpdate({ id: product._id, qty: String(product.stock) })}
                      className={`text-sm font-medium ${product.stock <= product.lowStockThreshold ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                      Stock: {product.stock}
                    </button>
                  )}
                </div>
                {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                  <span className="text-xs text-amber-600">Low stock</span>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditing(product._id); setEditForm(product); }}
                  className="flex-1 text-xs bg-[#FAF8F4] py-1.5 rounded hover:bg-[#F0ECE6] transition-colors flex items-center justify-center gap-1">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(product._id)}
                  className="px-3 text-xs bg-red-50 text-red-600 py-1.5 rounded hover:bg-red-100 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAdd || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowAdd(false); setEditing(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg m-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">{showAdd ? 'Add Product' : 'Edit Product'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Product Name *</label>
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Price (GH₵) *</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Cost Price</label>
                  <input type="number" value={editForm.costPrice} onChange={e => setEditForm({ ...editForm, costPrice: Number(e.target.value) })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Stock</label>
                  <input type="number" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Low Stock Alert</label>
                  <input type="number" value={editForm.lowStockThreshold} onChange={e => setEditForm({ ...editForm, lowStockThreshold: Number(e.target.value) })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Category</label>
                  <input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">SKU</label>
                  <input value={editForm.sku} onChange={e => setEditForm({ ...editForm, sku: e.target.value })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Description</label>
                  <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" rows={2} />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })} />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={editForm.taxable} onChange={e => setEditForm({ ...editForm, taxable: e.target.checked })} />
                    Taxable
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAdd(false); setEditing(null); }}
                className="flex-1 px-4 py-2 border border-[#E8E0D8] rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => showAdd ? handleCreate() : editing && handleUpdate(editing)} disabled={saving}
                className="flex-1 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm hover:bg-[#333] disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (showAdd ? 'Add Product' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
