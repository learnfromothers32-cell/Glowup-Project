import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
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
    <div className="flex gap-4 overflow-x-auto scrollbar-none -mx-1 px-1 pb-2 snap-x snap-mandatory">
      {sessions.map((session, i) => (
        <Link
          key={session._id}
          to={`/app/live/${session._id}`}
          className="shrink-0 flex flex-col items-center gap-1.5 snap-start group"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 p-[2.5px] shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow duration-300"
          >
            <div className="w-full h-full rounded-full bg-gray-900 p-[1.5px] overflow-hidden">
              {session.stylistId?.image ? (
                <img
                  src={session.stylistId.image}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {session.stylistId?.name?.[0] || '?'}
                  </span>
                </div>
              )}
            </div>
            <span className="absolute inset-0 rounded-full animate-pulse ring-2 ring-red-500/30" />
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 z-10">
              <LiveBadge size="sm" />
            </div>
          </motion.div>

          <div className="flex flex-col items-center gap-0.5 max-w-[80px]">
            <p className="text-[11px] font-semibold text-text-primary truncate leading-tight group-hover:text-red-500 transition-colors">
              {session.stylistId?.name}
            </p>
            <div className="flex items-center gap-1">
              <Eye size={9} className="text-red-400" />
              <span className="text-[9px] text-text-muted font-medium tabular-nums">
                {session.viewerCount > 999
                  ? `${(session.viewerCount / 1000).toFixed(1)}k`
                  : session.viewerCount}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
