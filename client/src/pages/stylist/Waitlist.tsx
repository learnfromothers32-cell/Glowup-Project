import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users, Calendar, Clock, Bell, Trash2, X, RefreshCw, Phone, Mail, Scissors, CheckCircle, User } from 'lucide-react';
import { getMyWaitlist, notifyWaitlistEntry, removeWaitlistEntry } from '../../api/waitlist';

interface WaitlistEntry {
  _id: string;
  clientId: { name: string; email: string; phone: string };
  serviceId: { name: string };
  preferredDate: string;
  preferredTime: string;
  status: string;
  notes: string;
  createdAt: string;
}

export default function Waitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [notifying, setNotifying] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyWaitlist(filter || undefined);
      setEntries(data);
    } catch { setError('Failed to load'); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries();
  }, [loadEntries]);

  const handleNotify = async (id: string) => {
    setNotifying(id);
    try {
      await notifyWaitlistEntry(id);
      loadEntries();
    } catch { setError('Failed to notify'); } finally { setNotifying(null); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this entry?')) return;
    try { await removeWaitlistEntry(id); loadEntries(); } catch { setError('Failed to remove'); }
  };

  const statusConfig: Record<string, { label: string; icon: typeof Bell; classes: string }> = {
    waiting: { label: 'Waiting', icon: Clock, classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' },
    notified: { label: 'Notified', icon: Bell, classes: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' },
    booked: { label: 'Booked', icon: CheckCircle, classes: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/20' },
    expired: { label: 'Expired', icon: X, classes: 'bg-gray-50 text-gray-500 dark:bg-gray-700/30 dark:text-gray-400 border-gray-200 dark:border-gray-600' },
    cancelled: { label: 'Cancelled', icon: X, classes: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20' },
  };

  const formatRelativeTime = (dateStr: string, now: number): string => {
    const diffMs = now - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Waitlist</h1>
          <p className="text-text-secondary dark:text-text-dark-secondary text-sm mt-1">Clients waiting for appointment availability</p>
        </div>
        <button onClick={loadEntries} className="p-2 text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary self-end"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl p-1 overflow-x-auto">
        {['', 'waiting', 'notified', 'booked', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-md capitalize transition-colors whitespace-nowrap ${filter === s ? 'bg-white dark:bg-surface-dark-secondary shadow-sm font-medium' : 'text-text-secondary dark:text-text-dark-secondary hover:text-text-primary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-text-muted dark:text-text-dark-muted" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-text-muted dark:text-text-dark-muted">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-text-secondary dark:text-text-dark-secondary">No waitlist entries</p>
          <p className="text-sm mt-1">When clients request to join your waitlist, they'll appear here</p>
        </div>
      ) : (
        <NowProvider>
          {(now) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entries.map(entry => {
                const sc = statusConfig[entry.status] || statusConfig.waiting;
                const StatusIcon = sc.icon;
                return (
                  <div key={entry._id} className="bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/40 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 text-sm font-medium shrink-0">
                          {entry.clientId?.name?.charAt(0) || <User size={16} />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-text-primary dark:text-text-dark-primary truncate">{entry.clientId?.name || 'Unknown Client'}</h3>
                          <div className="flex items-center gap-3 text-xs text-text-secondary dark:text-text-dark-secondary mt-0.5">
                            {entry.clientId?.email && (
                              <span className="flex items-center gap-1 truncate">
                                <Mail size={11} className="shrink-0" /> {entry.clientId.email}
                              </span>
                            )}
                            {entry.clientId?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={11} className="shrink-0" /> {entry.clientId.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${sc.classes}`}>
                        <StatusIcon size={11} />
                        {sc.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-secondary dark:text-text-dark-secondary bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl px-3 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <Scissors size={12} className="shrink-0 text-brand-500" />
                        {entry.serviceId?.name || 'Any service'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="shrink-0" />
                        {new Date(entry.preferredDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      {entry.preferredTime && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} className="shrink-0" />
                          {entry.preferredTime}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-text-muted dark:text-text-dark-muted mt-2">
                      Joined {formatRelativeTime(entry.createdAt, now)}
                    </p>

                    <div className="mt-3 flex gap-2">
                      {entry.status === 'waiting' && (
                        <button onClick={() => handleNotify(entry._id)} disabled={notifying === entry._id}
                          className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl transition-all bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 min-h-[32px]">
                          {notifying === entry._id ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
                          Notify Client
                        </button>
                      )}
                      {entry.status === 'notified' && (
                        <span className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 min-h-[32px]">
                          <Bell size={12} /> Notified
                        </span>
                      )}
                      {entry.status === 'booked' && (
                        <span className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 min-h-[32px]">
                          <CheckCircle size={12} /> Booked
                        </span>
                      )}
                      <button onClick={() => handleRemove(entry._id)}
                        className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors min-h-[32px] ml-auto">
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </NowProvider>
      )}
    </motion.div>
  );
}

function NowProvider({ children }: { children: (now: number) => React.ReactNode }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  return <>{children(now)}</>;
}
