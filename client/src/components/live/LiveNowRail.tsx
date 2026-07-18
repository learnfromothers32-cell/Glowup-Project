import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Eye } from 'lucide-react';
import { getActiveLiveSessions, type LiveSession } from '../../api/live';
import LiveBadge from './LiveBadge';
import { motion } from 'framer-motion';
import { getSocketUrl } from '../../services/socket';
import { io } from 'socket.io-client';

export default function LiveNowRail() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSessions = async () => {
      try {
        const { sessions: data } = await getActiveLiveSessions();
        if (mounted) setSessions(data);
      } catch (e) {
        console.warn('Failed to fetch live sessions:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSessions();

    const socket = io(getSocketUrl('live') || undefined, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('live:session-started', () => {
      fetchSessions();
    });

    socket.on('live:session-ended', () => {
      fetchSessions();
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  if (loading || sessions.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Radio size={16} className="text-red-500" />
          <h2 className="text-h4 font-display text-text-primary">Live Now</h2>
        </div>
        <span className="text-xs font-medium text-text-muted bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
          {sessions.length} active
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-1 px-1 pb-2">
        {sessions.map((session) => (
          <Link
            key={session._id}
            to={`/app/live/${session._id}`}
            className="shrink-0 w-40 group"
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden rounded-2xl bg-gray-900 aspect-[9/16]"
            >
              {session.thumbnail || session.stylistId?.image ? (
                <img
                  src={session.thumbnail || session.stylistId?.image}
                  alt=""
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                  <span className="text-3xl font-black text-white/30">
                    {session.stylistId?.name?.[0] || '?'}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              <div className="absolute top-2 left-2">
                <LiveBadge size="sm" />
              </div>

              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-xs font-bold text-white truncate">
                  {session.title}
                </p>
                <p className="text-[10px] text-white/60 truncate">
                  {session.stylistId?.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Eye size={10} className="text-white/50" />
                  <span className="text-[10px] text-white/50 font-medium">
                    {session.viewerCount}
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
