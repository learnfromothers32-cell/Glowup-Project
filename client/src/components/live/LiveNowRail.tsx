import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getActiveLiveSessions, type LiveSession } from '../../api/live';
import LiveBadge from './LiveBadge';
import { motion } from 'framer-motion';
import { getSocketUrl } from '../../services/socket';
import { io, Socket } from 'socket.io-client';

export default function LiveNowRail() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

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
    socketRef.current = socket;

    socket.on('live:session-started', () => {
      if (mounted) fetchSessions();
    });

    socket.on('live:session-ended', () => {
      if (mounted) fetchSessions();
    });

    return () => {
      mounted = false;
      socket.off('live:session-started');
      socket.off('live:session-ended');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  if (loading || sessions.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Live Now</h3>
      </div>

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
              className="relative w-[72px] h-[72px] rounded-full"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 p-[2.5px] shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow duration-300">
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
              </div>
              <span className="absolute inset-0 rounded-full animate-pulse ring-2 ring-red-500/30" />
            </motion.div>

            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-semibold text-text-primary truncate max-w-[72px] text-center">
                {session.stylistId?.name?.split(' ')[0] || 'Stylist'}
              </span>
              <LiveBadge size="sm" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
