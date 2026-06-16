import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, AlertCircle, ShoppingCart, DollarSign, CreditCard, X, Search, Printer } from 'lucide-react';
import { getMyPosTransactions, createPosTransaction, voidPosTransaction } from '../../api/pos';
import { getMyProducts } from '../../api/products';

export default function POS() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [clientName, setClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cart, setCart] = useState<{ productId: string; name: string; quantity: number; unitPrice: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [t, p] = await Promise.all([getMyPosTransactions(), getMyProducts()]);
      setTransactions(t);
      setProducts(p.filter((pr: any) => pr.isActive));
    } catch { setError('Failed to load'); } finally { setLoading(false); }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.productId === product._id);
      if (existing) {
        return prev.map(c => c.productId === product._id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { productId: product._id, name: product.name, quantity: 1, unitPrice: product.price }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(c => c.productId === productId ? { ...c, quantity } : c));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleCheckout = async () => {
    if (!clientName.trim()) { setError('Client name required'); return; }
    if (cart.length === 0) { setError('Add at least one item'); return; }
    setSaving(true);
    try {
      const items = cart.map(c => ({ type: 'product', itemId: c.productId, name: c.name, quantity: c.quantity, unitPrice: c.unitPrice }));
      await createPosTransaction({ clientName: clientName.trim(), items, paymentMethod, notes: '' });
      setCart([]);
      setClientName('');
      setShowNew(false);
      loadData();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to complete'); } finally { setSaving(false); }
  };

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Point of Sale</h1>
          <p className="text-[#7A7168] text-sm mt-1">Process in-person sales and walk-in payments</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#333] transition-colors text-sm">
          <Plus className="w-4 h-4" /> New Sale
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#7A7168]" /></div>
      ) : showNew ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] p-4 h-full">
              <h2 className="font-medium text-[#1A1A1A] mb-3">Products</h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#E8E0D8] rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredProducts.length === 0 && <p className="col-span-full text-center text-gray-400 py-8 text-sm">No products available</p>}
                {filteredProducts.map((p: any) => (
                  <button key={p._id} onClick={() => addToCart(p)}
                    className="p-3 border border-[#E8E0D8] rounded-lg text-left hover:bg-[#FAF8F4] transition-colors">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">GH₵{p.price}</p>
                    <p className="text-xs text-gray-400">Stock: {p.stock}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] p-4 sticky top-4">
              <h2 className="font-medium text-[#1A1A1A] mb-3">Cart</h2>
              <input type="text" placeholder="Client name *" value={clientName} onChange={e => setClientName(e.target.value)}
                className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm mb-3" />
              <div className="space-y-2 min-h-[100px]">
                {cart.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Cart is empty</p>}
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between p-2 bg-[#FAF8F4] rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="text-xs w-5 h-5 bg-white border rounded">-</button>
                        <span className="text-xs w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="text-xs w-5 h-5 bg-white border rounded">+</button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">GH₵{(item.quantity * item.unitPrice).toFixed(0)}</p>
                      <button onClick={() => removeFromCart(item.productId)} className="text-xs text-red-500">&times;</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E8E0D8] mt-3 pt-3">
                <div className="flex justify-between text-sm font-bold mb-3">
                  <span>Total</span>
                  <span>GH₵{subtotal.toFixed(0)}</span>
                </div>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm mb-3">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
                <button onClick={handleCheckout} disabled={saving || cart.length === 0 || !clientName.trim()}
                  className="w-full bg-[#1A1A1A] text-white py-2.5 rounded-lg text-sm hover:bg-[#333] disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Charge GH₵${subtotal.toFixed(0)}`}
                </button>
                <button onClick={() => setShowNew(false)} className="w-full text-xs text-gray-500 py-2 hover:text-gray-700">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><ShoppingCart className="w-12 h-12 mx-auto mb-3" /><p>No sales yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF8F4]">
                  <tr><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Receipt</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Client</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Items</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Total</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Payment</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Date</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Status</th></tr>
                </thead>
                <tbody>
                  {transactions.map((t: any) => (
                    <tr key={t._id} className="border-t border-[#E8E0D8]">
                      <td className="p-3 font-mono text-xs whitespace-nowrap">{t.receiptNumber}</td>
                      <td className="p-3 whitespace-nowrap">{t.clientName}</td>
                      <td className="p-3 whitespace-nowrap">{t.items?.length || 0}</td>
                      <td className="p-3 font-medium whitespace-nowrap">GH₵{t.total.toFixed(0)}</td>
                      <td className="p-3 capitalize whitespace-nowrap">{t.paymentMethod?.replace('_', ' ')}</td>
                      <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
