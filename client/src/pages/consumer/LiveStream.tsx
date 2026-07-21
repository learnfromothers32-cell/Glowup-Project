import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Heart, Send, Eye, Calendar, Loader2, WifiOff,
  Share2, MessageCircle, X,
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
    sendReaction,
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
      sendReaction();
    } catch {
      sendReaction();
    }
  }, [sessionId, user, userLiked, setLikeCount, broadcastLikeUpdate, sendReaction]);

  const handleDoubleTap = (e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      performLike();
    }
    lastTapRef.current = now;
  };

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

  if (loading) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="h-dvh bg-black flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-lg font-medium">{error || 'Stream not found'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-white/60 hover:text-white">Go back</button>
      </div>
    );
  }

  const charCount = commentText.length;
  const isOverLimit = charCount > MAX_COMMENT_LENGTH;
  const canType = cooldownRemaining <= 0;

  return (
    <div className="h-dvh w-full bg-black relative overflow-hidden select-none">
      {/* ── Video ── */}
      <div
        ref={videoContainerRef}
        className="absolute inset-0 bg-gray-900"
        onClick={handleDoubleTap}
        onTouchEnd={handleDoubleTap}
      />

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
              className="px-10 py-3.5 rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-shadow active:scale-95"
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

            <button onClick={handleBack} className="text-sm text-white/40 hover:text-white/70 transition-colors">Go back</button>
          </motion.div>
        </div>
      )}

      {/* ── Top gradient ── */}
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />

      {/* ── Top-left: Back + Stylist info ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between p-4 pt-5">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/50 transition-all">
            <X size={20} />
          </button>

          {joined && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full pr-4 pl-1 py-1"
            >
              {session.stylistId?.image ? (
                <img src={session.stylistId.image} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/20">
                  {session.stylistId?.name?.[0]}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white leading-tight">{session.stylistId?.name}</span>
                <span className="text-[10px] text-white/50 leading-tight">Host</span>
              </div>
            </motion.div>
          )}
        </div>

        {joined && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5"
          >
            <LiveBadge size="sm" />
            <div className="flex items-center gap-1">
              <Eye size={12} className="text-white/70" />
              <span className="text-xs text-white font-semibold tabular-nums">{viewerCount}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Connection status ── */}
      {joined && connectionState !== 'connected' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 bg-yellow-500/90 text-black text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
            <WifiOff size={12} />
            Reconnecting...
          </motion.div>
        </div>
      )}

      {/* ── Floating hearts ── */}
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
          className="absolute right-3 bottom-40 z-20 flex flex-col items-center gap-5"
        >
          {/* Stylist profile */}
          <Link to={`/app/stylist/${session.stylistId?._id}`} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 p-[2px] shadow-lg">
              <div className="w-full h-full rounded-full bg-gray-900 p-[1.5px] overflow-hidden">
                {session.stylistId?.image ? (
                  <img src={session.stylistId.image} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{session.stylistId?.name?.[0]}</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[9px] text-white/70 font-medium">Profile</span>
          </Link>

          {/* Like */}
          <button onClick={() => performLike()} className="flex flex-col items-center gap-1 group">
            <motion.div
              animate={userLiked ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center group-hover:bg-black/50 transition-all"
            >
              <Heart size={24} className={userLiked ? 'text-red-500 fill-red-500' : 'text-white'} />
            </motion.div>
            <span className="text-[10px] text-white font-semibold tabular-nums">{likeCount}</span>
          </button>

          {/* Comment toggle */}
          <button onClick={() => setShowComments((v) => !v)} className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center group-hover:bg-black/50 transition-all">
              <MessageCircle size={22} className={showComments ? 'text-white fill-white/20' : 'text-white'} />
            </div>
            <span className="text-[10px] text-white font-semibold">{comments.length}</span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center group-hover:bg-black/50 transition-all">
              <Share2 size={22} className="text-white" />
            </div>
            <span className="text-[10px] text-white font-semibold">Share</span>
          </button>

          {/* Book */}
          <Link to={`/app/stylist/${session.stylistId?._id}`} className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all">
              <Calendar size={20} className="text-white" />
            </div>
            <span className="text-[10px] text-white font-semibold">Book</span>
          </Link>
        </motion.div>
      )}

      {/* ── Comment feed + input ── */}
      {joined && showComments && (
        <div
          ref={commentContainerRef}
          className="absolute bottom-16 inset-x-0 z-20 flex flex-col"
          style={{ height: 'min(45vh, 360px)' }}
        >
          <LiveCommentFeed comments={comments} />
        </div>
      )}

      {/* ── Comment input bar ── */}
      {joined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-0 inset-x-0 z-20 p-3 pb-4"
        >
          <div className="flex items-center gap-2">
            {/* User avatar */}
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}

            <div className={`flex-1 flex items-center rounded-full px-4 py-2.5 border transition-colors ${
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
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none disabled:opacity-50"
              />

              {/* Character count — only show when typing */}
              {charCount > 0 && (
                <span className={`text-[10px] tabular-nums mr-2 shrink-0 ${
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
                  className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shrink-0 hover:bg-red-600 transition-colors active:scale-90"
                >
                  <Send size={12} className="text-white ml-0.5" />
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
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm text-black text-xs font-semibold px-4 py-2 rounded-full shadow-lg"
          >
            Link copied!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
