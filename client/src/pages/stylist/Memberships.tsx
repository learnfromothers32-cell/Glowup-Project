import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, AlertCircle, Crown, Users, Clock, DollarSign, Trash2, Edit3, X } from 'lucide-react';
import { getMyTiers, createTier, updateTier, deleteTier, getMySubscribers } from '../../api/memberships';

export default function Memberships() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({ name: '', description: '', price: 0, billingCycle: 'monthly', benefits: [], discountPercent: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'tiers' | 'subscribers'>('tiers');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tierData, subData] = await Promise.all([getMyTiers(), getMySubscribers()]);
      setTiers(tierData);
      setSubscribers(subData);
    } catch { setError('Failed to load'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!editForm.name || editForm.price <= 0) { setError('Name and price required'); return; }
    setSaving(true);
    try {
      if (editing) await updateTier(editing, editForm);
      else await createTier(editForm);
      setShowAdd(false); setEditing(null); loadData();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Memberships</h1>
          <p className="text-[#7A7168] text-sm mt-1">Recurreing subscription plans for loyal clients</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditing(null); setEditForm({ name: '', description: '', price: 0, billingCycle: 'monthly', benefits: [], discountPercent: 0 }); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#333] transition-colors text-sm">
          <Plus className="w-4 h-4" /> New Tier
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-[#FAF8F4] rounded-lg p-1 w-fit">
        <button onClick={() => setTab('tiers')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'tiers' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
          <Crown className="w-3 h-3 inline mr-1" /> Membership Tiers
        </button>
        <button onClick={() => setTab('subscribers')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'subscribers' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
          <Users className="w-3 h-3 inline mr-1" /> Subscribers
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#7A7168]" /></div>
      ) : tab === 'tiers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tiers.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Crown className="w-12 h-12 mx-auto mb-3" />
              <p>No membership tiers created yet</p>
            </div>
          ) : tiers.map(tier => (
            <div key={tier._id} className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-[#1A1A1A]">{tier.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{tier.description}</p>
                </div>
                {tier.isActive ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Active</span> :
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Inactive</span>}
              </div>
              <div className="mt-3">
                <span className="text-xl font-bold">GH₵{tier.price}</span>
                <span className="text-sm text-gray-500">/{tier.billingCycle}</span>
              </div>
              {tier.discountPercent > 0 && (
                <p className="text-xs text-green-600 mt-1">{tier.discountPercent}% discount on all services</p>
              )}
              {tier.benefits?.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {tier.benefits.map((b: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                      <span className="text-green-500">&#10003;</span> {b}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditing(tier._id); setEditForm(tier); setShowAdd(true); }}
                  className="flex-1 text-xs bg-[#FAF8F4] py-1.5 rounded hover:bg-[#F0ECE6]"><Edit3 className="w-3 h-3 inline mr-1" /> Edit</button>
                <button onClick={() => { if (confirm('Delete this tier?')) deleteTier(tier._id).then(loadData); }}
                  className="px-3 text-xs bg-red-50 text-red-600 py-1.5 rounded hover:bg-red-100"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] overflow-hidden">
          {subscribers.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Users className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">No subscribers yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF8F4]">
                  <tr><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Client</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Plan</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Billing</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Next Payment</th><th className="text-left p-3 text-gray-500 font-medium whitespace-nowrap">Status</th></tr>
                </thead>
                <tbody>
                  {subscribers.map((s: any) => (
                    <tr key={s._id} className="border-t border-[#E8E0D8]">
                      <td className="p-3 whitespace-nowrap">{s.clientId?.name || 'Unknown'}</td>
                      <td className="p-3 whitespace-nowrap">{s.tierId?.name || 'Unknown'}</td>
                      <td className="p-3 whitespace-nowrap">GH₵{s.tierId?.price}/{s.tierId?.billingCycle}</td>
                      <td className="p-3 whitespace-nowrap">{s.nextBillingDate ? new Date(s.nextBillingDate).toLocaleDateString() : '-'}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'active' ? 'bg-green-100 text-green-700' : s.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.status}</span>
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
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">{editing ? 'Edit Tier' : 'New Membership Tier'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Tier Name *</label>
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
                  <label className="text-xs text-gray-500">Billing Cycle</label>
                  <select value={editForm.billingCycle} onChange={e => setEditForm({ ...editForm, billingCycle: e.target.value })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Discount %</label>
                  <input type="number" value={editForm.discountPercent} onChange={e => setEditForm({ ...editForm, discountPercent: Number(e.target.value) })}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Benefits (one per line)</label>
                <textarea value={editForm.benefits.join('\n')} onChange={e => setEditForm({ ...editForm, benefits: e.target.value.split('\n').filter(Boolean) })}
                  className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Free consultation&#10;10% off products&#10;Priority booking" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAdd(false); setEditing(null); }}
                className="flex-1 px-4 py-2 border border-[#E8E0D8] rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm hover:bg-[#333] disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editing ? 'Save Changes' : 'Create Tier')}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
