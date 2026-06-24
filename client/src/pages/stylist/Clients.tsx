import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Loader2, MessageSquare, DollarSign, Calendar, X, Users } from 'lucide-react';
import { logger } from '../../utils/logger';
import { getMyClients, getClientDetail, updateClient } from '../../api/clients';
import { createConversation } from '../../api/conversations';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

interface ClientUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  location?: string;
}

interface StylistClient {
  _id: string;
  userId: ClientUser;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string | null;
  favorite: boolean;
  tags: string[];
  notes: string;
}

export default function Clients() {
  const [clients, setClients] = useState<StylistClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('visits');
  const [selected, setSelected] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, [search, sort]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getMyClients({ search: search || undefined, sort });
      setClients(data);
    } catch {
      logger.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (client: StylistClient) => {
    setSelected(client);
    setDetailLoading(true);
    try {
      const data = await getClientDetail(client._id);
      setDetailData(data);
      setEditNotes(data.client.notes || '');
      setEditTags((data.client.tags || []).join(', '));
    } catch {
      logger.error('Failed to load client detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    await updateClient(selected._id, {
      notes: editNotes,
      tags: editTags.split(',').map((t: string) => t.trim()).filter(Boolean)
    });
    loadClients();
  };

  const handleMessage = async (clientId: string) => {
    try {
      const conv = await createConversation({ clientId });
      navigate('/stylist/messages');
    } catch {
      logger.error('Failed to create conversation');
    }
  };

  const toggleFavorite = async (client: StylistClient) => {
    await updateClient(client._id, { favorite: !client.favorite });
    loadClients();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-2 sm:px-0">
      <div className="flex flex-col xs:flex-row xs:items-end justify-between gap-2 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">My Clients</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">View and manage your client relationships</p>
        </div>
      </div>

      <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-text-dark-muted" />
          <input type="text" placeholder="Search clients..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field text-sm w-full pl-9" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="input-field text-sm w-full xs:w-auto min-w-0 xs:min-w-[140px]">
          <option value="visits">Most Visits</option>
          <option value="recent">Most Recent</option>
          <option value="spent">Highest Spent</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full skeleton-pulse shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-4 w-28 skeleton-pulse" />
                  <Skeleton className="h-3 w-36 skeleton-pulse" />
                </div>
              </div>
              <Skeleton className="h-4 w-48 skeleton-pulse" />
              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/40">
                <Skeleton className="h-9 flex-1 rounded-xl skeleton-pulse" />
                <Skeleton className="h-9 w-9 rounded-xl skeleton-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-50 dark:bg-surface-dark-tertiary flex items-center justify-center mb-4">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-text-muted" />
          </div>
          <p className="text-sm sm:text-base font-semibold text-text-primary mb-1">No clients yet</p>
          <p className="text-xs sm:text-sm text-text-muted max-w-xs">Clients will appear here after their first booking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {clients.map(client => (
            <Card key={client._id} hover padding="md" className="relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-stylist-500 to-stylist-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                    {client.userId?.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-body-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">{client.userId?.name}</h3>
                    <p className="text-caption text-text-muted dark:text-text-dark-muted truncate">{client.userId?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(client)}
                  className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                    client.favorite
                      ? 'text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                      : 'text-text-muted hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                  }`}
                  aria-label={client.favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className="w-4 h-4" fill={client.favorite ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="mt-2.5 sm:mt-3 flex items-center gap-2 sm:gap-3 text-caption text-text-muted dark:text-text-dark-secondary flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 shrink-0" /> {client.totalVisits} visit{client.totalVisits !== 1 ? 's' : ''}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 shrink-0" /> GH₵{client.totalSpent.toFixed(0)}</span>
                {client.lastVisit && (
                  <span className="text-text-muted dark:text-text-dark-muted">Last {new Date(client.lastVisit).toLocaleDateString()}</span>
                )}
              </div>
              {client.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {client.tags.map((tag, i) => (
                    <span key={i} className="text-caption bg-gray-50 dark:bg-surface-dark-tertiary text-text-secondary px-2 py-0.5 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/40">
                <Button variant="secondary" size="sm" onClick={() => openDetail(client)} className="flex-1 h-9 text-xs sm:text-sm">
                  View Profile
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleMessage(client.userId?._id)} aria-label="Send message" className="h-9 w-9 sm:w-auto">
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && detailData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-lg lg:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto bg-white dark:bg-surface-dark-secondary rounded-t-2xl sm:rounded-2xl shadow-modal animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="flex items-center justify-center h-48 sm:h-64">
                <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-text-muted" />
              </div>
            ) : (
              <>
                <div className="sticky top-0 z-10 bg-white dark:bg-surface-dark-secondary border-b border-gray-100 dark:border-gray-700/40 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-stylist-500 to-pink-500 flex items-center justify-center text-white text-base sm:text-lg font-bold shadow-sm shrink-0">
                        {detailData.client?.userId?.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm sm:text-lg font-bold text-text-primary dark:text-text-dark-primary truncate">{detailData.client?.userId?.name}</h2>
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">{detailData.client?.userId?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleMessage(detailData.client?.userId?._id)}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                        aria-label="Send message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <button
                        onClick={() => setSelected(null)}
                        className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors"
                        aria-label="Close"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  {(detailData.client?.userId?.phone || detailData.client?.userId?.location) && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-caption text-text-muted dark:text-text-dark-muted">
                      {detailData.client?.userId?.phone && <span>📞 {detailData.client?.userId?.phone}</span>}
                      {detailData.client?.userId?.location && <span>📍 {detailData.client?.userId?.location}</span>}
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-gradient-to-br from-stylist-500/5 to-stylist-500/10 dark:from-stylist-500/10 dark:to-stylist-500/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-stylist-500/10">
                      <p className="text-base sm:text-xl lg:text-2xl font-bold text-stylist-600 dark:text-stylist-400">{detailData.client?.totalVisits || 0}</p>
                      <p className="text-[10px] sm:text-caption text-text-muted dark:text-text-dark-secondary mt-0.5 font-medium">Total Visits</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 dark:from-emerald-500/10 dark:to-emerald-500/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-emerald-500/10">
                      <p className="text-base sm:text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400">GH₵{(detailData.client?.totalSpent || 0).toFixed(0)}</p>
                      <p className="text-[10px] sm:text-caption text-text-muted dark:text-text-dark-secondary mt-0.5 font-medium">Total Spent</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 dark:from-amber-500/10 dark:to-amber-500/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-amber-500/10">
                      <p className="text-base sm:text-xl lg:text-2xl font-bold text-amber-600 dark:text-amber-400">{detailData.bookings?.length || 0}</p>
                      <p className="text-[10px] sm:text-caption text-text-muted dark:text-text-dark-secondary mt-0.5 font-medium">Bookings</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-1.5">Notes</label>
                      <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                        className="input-field text-sm min-h-[72px] sm:min-h-[80px] resize-none w-full bg-white dark:bg-surface-dark-secondary" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-1.5">Tags</label>
                      <input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="e.g. bridal, repeat, vip"
                        className="input-field text-sm w-full bg-white dark:bg-surface-dark-secondary" />
                      <p className="text-caption text-text-muted dark:text-text-dark-muted mt-1">Separate tags with commas</p>
                    </div>
                    <Button onClick={handleSaveNotes} className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold">
                      Save Changes
                    </Button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm sm:text-base font-bold text-text-primary dark:text-text-dark-primary">Booking History</h3>
                      <span className="text-caption text-text-muted dark:text-text-dark-muted">{detailData.bookings?.length || 0} booking{(detailData.bookings?.length || 0) !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-2">
                      {detailData.bookings?.length > 0 ? (
                        detailData.bookings.map((b: any) => (
                          <div key={b._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl sm:rounded-2xl gap-2 hover:bg-gray-100 dark:hover:bg-surface-dark-secondary transition-colors">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0 bg-stylist-400" />
                                <p className="text-xs sm:text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">{b.serviceId?.name || 'Service'}</p>
                              </div>
                              <p className="text-caption text-text-muted dark:text-text-dark-muted mt-0.5 ml-4">
                                {new Date(b.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <span className={`text-caption px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                              b.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : b.status === 'cancelled'
                                ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 sm:py-10">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-5 h-5 text-text-muted" />
                          </div>
                          <p className="text-xs sm:text-sm text-text-muted dark:text-text-dark-muted">No booking history yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
