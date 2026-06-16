import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, AlertCircle, Package, DollarSign, Clock, Users, Trash2, Edit3, X } from 'lucide-react';
import { getMyPackages, createPackage, updatePackage, deletePackage, getPackagePurchases } from '../../api/packages';

export default function Packages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editForm, setEditForm] = useState<any>({ name: '', description: '', price: 0, totalSessions: 1, expiryDays: 90, popular: false, services: [] });
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'packages' | 'purchases'>('packages');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pkgData, purchData] = await Promise.all([getMyPackages(), getPackagePurchases()]);
      setPackages(pkgData);
      setPurchases(purchData);
    } catch { setError('Failed to load data'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!editForm.name || editForm.price <= 0 || !editForm.totalSessions) {
      setError('Name, price, and sessions are required'); return;
    }
    setSaving(true);
    try {
      if (editing) await updatePackage(editing, editForm);
      else await createPackage(editForm);
      setShowAdd(false); setEditing(null); loadData();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Packages</h1>
          <p className="text-[#7A7168] text-sm mt-1">Create prepaid service packages for your clients</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditing(null); setEditForm({ name: '', description: '', price: 0, totalSessions: 1, expiryDays: 90, popular: false, services: [] }); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#333] transition-colors text-sm">
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-[#FAF8F4] rounded-lg p-1 w-fit">
        <button onClick={() => setTab('packages')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'packages' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
          <Package className="w-3 h-3 inline mr-1" /> Packages
        </button>
        <button onClick={() => setTab('purchases')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'purchases' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
          <Users className="w-3 h-3 inline mr-1" /> Purchases
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#7A7168]" /></div>
      ) : tab === 'packages' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3" />
              <p>No packages created yet</p>
            </div>
          ) : packages.map(pkg => (
            <div key={pkg._id} className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-[#1A1A1A]">{pkg.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{pkg.description}</p>
                </div>
                {pkg.popular && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Popular</span>}
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="font-bold text-lg">GH₵{pkg.price}</span>
                <span className="flex items-center gap-1 text-gray-500"><Clock className="w-3 h-3" /> {pkg.totalSessions} sessions</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Expires in {pkg.expiryDays} days</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditing(pkg._id); setEditForm(pkg); setShowAdd(true); }}
                  className="flex-1 text-xs bg-[#FAF8F4] py-1.5 rounded hover:bg-[#F0ECE6]"><Edit3 className="w-3 h-3 inline mr-1" /> Edit</button>
                <button onClick={() => { if (confirm('Delete this package?')) deletePackage(pkg._id).then(loadData); }}
                  className="px-3 text-xs bg-red-50 text-red-600 py-1.5 rounded hover:bg-red-100"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] overflow-hidden">
          {purchases.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Users className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">No package purchases yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF8F4]">
                  <tr><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Client</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Package</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Sessions</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Paid</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Status</th></tr>
                </thead>
                <tbody>
                  {purchases.map((p: any) => (
                    <tr key={p._id} className="border-t border-[#E8E0D8]">
                      <td className="p-3 whitespace-nowrap">{p.clientId?.name || 'Unknown'}</td>
                      <td className="p-3 whitespace-nowrap">{p.packageId?.name || 'Unknown'}</td>
                      <td className="p-3 whitespace-nowrap">{p.remainingSessions}/{p.totalSessions}</td>
                      <td className="p-3 whitespace-nowrap">GH₵{p.amountPaid}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowAdd(false); setEditing(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg m-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">{editing ? 'Edit Package' : 'New Package'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Package Name *</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355]" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Price (GH₵) *</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Total Sessions *</label>
                  <input type="number" value={editForm.totalSessions} onChange={e => setEditForm({ ...editForm, totalSessions: Number(e.target.value) })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Expiry (days)</label>
                  <input type="number" value={editForm.expiryDays} onChange={e => setEditForm({ ...editForm, expiryDays: Number(e.target.value) })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editForm.popular} onChange={e => setEditForm({ ...editForm, popular: e.target.checked })} />
                Mark as popular
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAdd(false); setEditing(null); }}
                className="flex-1 px-4 py-2 border border-[#E8E0D8] rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm hover:bg-[#333] disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editing ? 'Save Changes' : 'Create Package')}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
