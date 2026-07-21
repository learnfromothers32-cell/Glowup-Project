import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Heart, Send, Eye, Calendar, Loader2, WifiOff, Wifi,
  Share2, MessageCircle, X, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/authUtils';
import { useLiveSession } from '../../hooks/useLiveSession';
import { RoomEvent } from 'livekit-client';
import { useToast } from '../../components/ui/Toast';
import LiveBadge from '../../components/live/LiveBadge';
import LiveCommentFeed from '../../components/live/LiveCommentFeed';
import FloatingHeart from '../../components/live/FloatingHeart';
import * as liveApi from '../../api/live';
import type { LiveSession } from '../../api/live';

interface TapHeart {
  id: number;
  x: number;
  y: number;
}

export default function LiveStream() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentContainerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const likeCooldownRef = useRef(false);
  const tapHeartIdRef = useRef(0);

  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userLiked, setUserLiked] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showShareToast, setShowShareToast] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [commentFailed, setCommentFailed] = useState(false);
  const [tapHearts, setTapHearts] = useState<TapHeart[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keyboard-aware padding for mobile
  useEffect(() => {
    const vp = window.visualViewport;
    if (!vp) return;
    const onResize = () => {
      const height = window.innerHeight;
      const diff = height - vp.height - vp.offsetTop;
      setKeyboardHeight(Math.max(0, diff));
    };
    vp.addEventListener('resize', onResize);
    vp.addEventListener('scroll', onResize);
    return () => {
      vp.removeEventListener('resize', onResize);
      vp.removeEventListener('scroll', onResize);
    };
  }, []);

  const handleStreamEnded = useCallback(() => {
    toast('info', 'Stream has ended');
    navigate('/app');
  }, [toast, navigate]);

  const {
    room,
    connectionState,
    viewerCount,
    setViewerCount,
    comments,
    hearts,
    likeCount,
    setLikeCount,
    connect,
    disconnect,
    sendComment,
    broadcastLikeUpdate,
    canSendComment: _canSendComment,
    getCooldownRemaining,
    COMMENT_COOLDOWN_MS,
    MAX_COMMENT_LENGTH,
  } = useLiveSession({
    sessionId: sessionId || '',
    onStreamEnded: handleStreamEnded,
    initialLikeCount: 0,
  });

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      const remaining = getCooldownRemaining();
      setCooldownRemaining(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [cooldownRemaining, getCooldownRemaining]);

  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;
    liveApi
      .getLiveSession(sessionId)
      .then(({ session: s }) => {
        if (mounted) {
          setSession(s);
          setLikeCount(s.likeCount || 0);
        }
      })
      .catch(() => {
        if (mounted) setError('Stream not found');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [sessionId, setLikeCount]);

  useEffect(() => {
    if (!room || !videoContainerRef.current || !joined) return;
    const container = videoContainerRef.current;

    const attachTracks = () => {
      container.innerHTML = '';
      const participants = Array.from(room.remoteParticipants.values());
      for (const p of participants) {
        const pub = p.getTrackPublication('camera');
        if (pub?.track) {
          const el = pub.track.attach();
          el.className = 'w-full h-full object-cover';
          container.appendChild(el);
        }
      }
    };

    room.on(RoomEvent.TrackSubscribed, attachTracks);
    room.on(RoomEvent.ParticipantConnected, () => {
      setViewerCount(room.remoteParticipants.size);
      attachTracks();
    });
    room.on(RoomEvent.ParticipantDisconnected, () => {
      setViewerCount(Math.max(0, room.remoteParticipants.size));
      attachTracks();
    });

    attachTracks();
    return () => {
      room.off(RoomEvent.TrackSubscribed, attachTracks);
      room.off(RoomEvent.ParticipantConnected, attachTracks);
      room.off(RoomEvent.ParticipantDisconnected, attachTracks);
    };
  }, [room, joined]);

  const handleJoin = async () => {
    if (!sessionId || !user) return;
    setJoining(true);
    try {
      const { token, wsUrl, session: s } = await liveApi.joinLiveSession(sessionId);
      setSession(s);
      setLikeCount(s.likeCount || 0);
      await connect(wsUrl, token);
      setJoined(true);
      setViewerCount(s.viewerCount || 1);
    } catch (err: any) {
      toast('error', err?.response?.data?.message || 'Could not join stream');
    } finally {
      setJoining(false);
    }
  };

  const performLike = useCallback(async () => {
    if (!sessionId || !user || userLiked || likeCooldownRef.current) return;
    likeCooldownRef.current = true;
    setTimeout(() => { likeCooldownRef.current = false; }, 300);

    try {
      const { likeCount: newCount } = await liveApi.likeLiveSession(sessionId);
      setLikeCount(newCount);
      setUserLiked(true);
      broadcastLikeUpdate(newCount);
    } catch {
      likeCooldownRef.current = false;
    }
  }, [sessionId, user, userLiked, setLikeCount, broadcastLikeUpdate]);

  const spawnTapHeart = useCallback((clientX: number, clientY: number) => {
    const id = ++tapHeartIdRef.current;
    const rect = videoContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPct = ((clientX - rect.left) / rect.width) * 100;
    const yPx = clientY - rect.top;
    setTapHearts((prev) => [...prev.slice(-8), { id, x: xPct, y: yPx }]);
    setTimeout(() => setTapHearts((prev) => prev.filter((h) => h.id !== id)), 1400);
  }, []);

  const handleDoubleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    const clientX = 'touches' in e ? e.changedTouches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.changedTouches[0]?.clientY ?? 0 : e.clientY;

    if (now - lastTapRef.current < 300) {
      performLike();
      spawnTapHeart(clientX, clientY);
    }
    lastTapRef.current = now;
  }, [performLike, spawnTapHeart]);

  const handleSendComment = () => {
    if (!commentText.trim() || !user) return;

    setCommentFailed(false);
    const sent = sendComment(commentText.trim(), user.id, user.name, user.avatar);
    if (sent) {
      setCommentText('');
      setCooldownRemaining(getCooldownRemaining() || Math.ceil(COMMENT_COOLDOWN_MS / 1000));
    } else {
      setCommentFailed(true);
      setTimeout(() => setCommentFailed(false), 1500);
    }
  };

  const handleBack = () => {
    disconnect();
    navigate(-1);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    liveApi
      .getLiveSession(sessionId || '')
      .then(({ session: s }) => {
        setSession(s);
        setLikeCount(s.likeCount || 0);
      })
      .catch(() => setError('Stream not found'))
      .finally(() => setLoading(false));
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: session?.title || 'Live Stream', url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="h-dvh w-full bg-black relative overflow-hidden select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="absolute inset-0 bg-gray-900 animate-pulse" />
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-5 left-4 z-20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
          <div className="h-9 w-32 rounded-full bg-white/10 animate-pulse" />
        </div>
        <div className="absolute top-5 right-4 z-20">
          <div className="h-8 w-20 rounded-full bg-white/10 animate-pulse" />
        </div>
        <div className="absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-3 bottom-36 z-20 flex flex-col items-center gap-4">
          {[44, 44, 44, 44].map((s, i) => (
            <div key={i} className="rounded-full bg-white/10 animate-pulse" style={{ width: s, height: s }} />
          ))}
        </div>
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
          <Loader2 size={28} className="animate-spin text-white/60" />
          <p className="text-xs text-white/40 mt-3 font-medium">Loading stream...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !session) {
    return (
      <div className="h-dvh w-full bg-black flex flex-col items-center justify-center gap-5 text-white px-6" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <WifiOff size={28} className="text-white/40" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">{error || 'Stream not found'}</p>
          <p className="text-sm text-white/40 mt-1">This stream may have ended or doesn't exist.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRetry}
            className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium flex items-center gap-2 hover:bg-white/20 transition-all active:scale-95"
            aria-label="Retry loading stream"
          >
            <RefreshCw size={14} />
            Retry
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-full bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white transition-all active:scale-95"
            aria-label="Go back"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const charCount = commentText.length;
  const isOverLimit = charCount > MAX_COMMENT_LENGTH;
  const canType = cooldownRemaining <= 0;

  return (
    <div className="h-dvh w-full bg-black relative overflow-hidden select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* ── Video ── */}
      <div
        ref={videoContainerRef}
        className="absolute inset-0 bg-gray-900"
        onClick={handleDoubleTap}
        onTouchEnd={handleDoubleTap}
      />

      {/* ── Double-tap floating hearts (at tap position) ── */}
      <AnimatePresence>
        {tapHearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, scale: 0.3 }}
            animate={{ opacity: [1, 1, 0], scale: 1.2, y: -160 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute pointer-events-none z-50"
            style={{ left: `${h.x}%`, top: h.y }}
          >
            <span className="text-3xl drop-shadow-lg">❤️</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Pre-join overlay ── */}
      {!joined && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center gap-5 px-6"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 p-[3px] shadow-2xl shadow-red-500/30">
                <div className="w-full h-full rounded-full bg-gray-900 p-[2px] overflow-hidden">
                  {session.stylistId?.image ? (
                    <img src={session.stylistId.image} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{session.stylistId?.name?.[0] || '?'}</span>
                    </div>
                  )}
                </div>
              </div>
              <LiveBadge size="sm" className="absolute -bottom-1 left-1/2 -translate-x-1/2" />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{session.title}</h2>
              <p className="text-sm text-white/60 mt-1">{session.stylistId?.name}</p>
              {session.category && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/10 text-xs text-white/70 font-medium">{session.category}</span>
              )}
            </div>

            <button
              onClick={handleJoin}
              disabled={joining}
              aria-label={joining ? 'Joining stream' : 'Join live stream'}
              className="px-10 py-3.5 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all active:scale-95"
            >
              {joining ? (
                <><Loader2 size={16} className="animate-spin" /> Joining...</>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                  Join Live
                </>
              )}
            </button>

            <button onClick={handleBack} className="text-sm text-white/40 hover:text-white/70 transition-colors active:scale-95" aria-label="Go back">Go back</button>
          </motion.div>
        </div>
      )}

      {/* ── Top gradient ── */}
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />

      {/* ── Top-left: Back + Stylist info ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between p-3 sm:p-4 pt-4 sm:pt-5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={handleBack} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/50 transition-all active:scale-90 shrink-0" aria-label="Close stream">
            <X size={18} />
          </button>

          {joined && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-md rounded-full pr-3 sm:pr-4 pl-1 py-1 min-w-0 max-w-[45vw]"
            >
              {session.stylistId?.image ? (
                <img src={session.stylistId.image} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-white/20 shrink-0" />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/20 shrink-0">
                  {session.stylistId?.name?.[0]}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] sm:text-xs font-semibold text-white leading-tight truncate">{session.stylistId?.name}</span>
                <span className="text-[9px] sm:text-[10px] text-white/50 leading-tight">Host</span>
              </div>
            </motion.div>
          )}
        </div>

        {joined && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-md rounded-full px-2.5 sm:px-3 py-1.5 shrink-0"
          >
            <LiveBadge size="sm" />
            <div className="flex items-center gap-1">
              <Eye size={11} className="text-white/70" />
              <span className="text-[11px] sm:text-xs text-white font-semibold tabular-nums">{viewerCount}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Connection status ── */}
      <AnimatePresence>
        {joined && connectionState !== 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="flex items-center gap-2 bg-yellow-500/90 text-black text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
              {connectionState === 'reconnecting' ? (
                <><WifiOff size={12} /> Reconnecting...</>
              ) : (
                <><Wifi size={12} /> Connecting...</>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating hearts (reaction broadcast) ── */}
      <AnimatePresence>
        {hearts.map((h) => (
          <FloatingHeart key={h.id} id={h.id} x={h.x} />
        ))}
      </AnimatePresence>

      {/* ── Bottom gradient ── */}
      <div className="absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 pointer-events-none" />

      {/* ── Right-side action buttons ── */}
      {joined && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute right-2 sm:right-3 bottom-24 sm:bottom-36 z-20 flex flex-col items-center gap-3 sm:gap-4"
        >
          {/* Stylist profile */}
          <Link to={`/app/stylist/${session.stylistId?._id}`} className="flex flex-col items-center gap-0.5" aria-label={`View ${session.stylistId?.name}'s profile`}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 p-[2px] shadow-lg">
              <div className="w-full h-full rounded-full bg-gray-900 p-[1.5px] overflow-hidden">
                {session.stylistId?.image ? (
                  <img src={session.stylistId.image} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{session.stylistId?.name?.[0]}</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[8px] sm:text-[9px] text-white/70 font-medium">Profile</span>
          </Link>

          {/* Like */}
          <button onClick={() => performLike()} disabled={userLiked} className="flex flex-col items-center gap-0.5 group" aria-label={userLiked ? 'Already liked' : 'Like stream'}>
            <motion.div
              animate={userLiked ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-90 ${
                userLiked ? 'bg-red-500/20' : 'bg-black/30 group-hover:bg-black/50'
              }`}
            >
              <Heart size={20} className={userLiked ? 'text-red-500 fill-red-500' : 'text-white'} />
            </motion.div>
            <span className="text-[9px] sm:text-[10px] text-white font-semibold tabular-nums">{likeCount}</span>
          </button>

          {/* Comment toggle */}
          <button onClick={() => setShowComments((v) => !v)} className="flex flex-col items-center gap-0.5 group" aria-label={showComments ? 'Hide comments' : 'Show comments'}>
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-90 ${
              showComments ? 'bg-white/20' : 'bg-black/30 group-hover:bg-black/50'
            }`}>
              <MessageCircle size={18} className={showComments ? 'text-white fill-white/20' : 'text-white'} />
            </div>
            <span className="text-[9px] sm:text-[10px] text-white font-semibold">{comments.length}</span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex flex-col items-center gap-0.5 group" aria-label="Share stream">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center group-hover:bg-black/50 transition-all active:scale-90">
              <Share2 size={18} className="text-white" />
            </div>
            <span className="text-[9px] sm:text-[10px] text-white font-semibold">Share</span>
          </button>

          {/* Book */}
          <Link to={`/app/stylist/${session.stylistId?._id}`} className="flex flex-col items-center gap-0.5 group" aria-label="Book appointment">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all active:scale-90">
              <Calendar size={16} className="text-white" />
            </div>
            <span className="text-[9px] sm:text-[10px] text-white font-semibold">Book</span>
          </Link>
        </motion.div>
      )}

      {/* ── Comment feed (hidden when comments toggled off) ── */}
      {joined && showComments && (
        <div
          ref={commentContainerRef}
          className="absolute bottom-14 sm:bottom-16 inset-x-0 z-20 flex flex-col"
          style={{ height: 'min(38vh, 320px)' }}
        >
          <LiveCommentFeed comments={comments} />
        </div>
      )}

      {/* ── Comment input bar (hidden when comments toggled off) ── */}
      {joined && showComments && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-0 inset-x-0 z-20 p-2.5 sm:p-3 pb-3 sm:pb-4"
          style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 8 : undefined }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* User avatar */}
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 ring-1 ring-white/20" />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shrink-0">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}

            <div className={`flex-1 flex items-center rounded-full px-3 sm:px-4 py-2 sm:py-2.5 border transition-colors ${
              commentFailed
                ? 'bg-red-500/20 border-red-500/40'
                : isOverLimit
                  ? 'bg-white/10 border-red-400/40'
                  : 'bg-white/10 border-white/10'
            }`}>
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                placeholder={
                  cooldownRemaining > 0
                    ? `Wait ${cooldownRemaining}s...`
                    : commentFailed
                      ? 'Failed to send'
                      : 'Say something...'
                }
                disabled={!canType && cooldownRemaining > 0}
                maxLength={MAX_COMMENT_LENGTH + 20}
                aria-label="Type a comment"
                className="flex-1 bg-transparent text-white text-xs sm:text-sm placeholder:text-white/30 focus:outline-none disabled:opacity-50"
              />

              {/* Character count */}
              {charCount > 0 && (
                <span className={`text-[9px] sm:text-[10px] tabular-nums mr-1.5 sm:mr-2 shrink-0 ${
                  isOverLimit ? 'text-red-400' : charCount > MAX_COMMENT_LENGTH * 0.8 ? 'text-yellow-400' : 'text-white/30'
                }`}>
                  {charCount}/{MAX_COMMENT_LENGTH}
                </span>
              )}

              {/* Send button */}
              {commentText.trim() && !isOverLimit && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={handleSendComment}
                  aria-label="Send comment"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-500 flex items-center justify-center shrink-0 hover:bg-red-600 transition-colors active:scale-90"
                >
                  <Send size={11} className="text-white ml-0.5" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Share toast ── */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm text-black text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg"
          >
            Link copied!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
