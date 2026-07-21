import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Radio,
  Loader2, X, Eye, Clock, Heart, MessageCircle,
} from 'lucide-react';
import { useLiveSession } from '../../hooks/useLiveSession';
import { useToast } from '../../components/ui/Toast';
import * as liveApi from '../../api/live';
import { Track, RoomEvent } from 'livekit-client';
import FloatingHeart from '../../components/live/FloatingHeart';
import LiveCommentFeed from '../../components/live/LiveCommentFeed';

const CATEGORIES = [
  'Braids', 'Nails', 'Barber', 'Colorist', 'Stylist',
  'Makeup', 'Locs', 'Twists', 'Natural Hair', 'Extensions',
];

export default function LiveStudio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<'setup' | 'preview' | 'live'>('setup');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [showComments, setShowComments] = useState(true);

  const {
    room,
    viewerCount,
    setViewerCount,
    hearts,
    likeCount,
    comments,
    connect,
    disconnect,
    toggleCamera,
    toggleMicrophone,
  } = useLiveSession({ sessionId: sessionId || '', isBroadcaster: true });

  useEffect(() => {
    if (!room || !videoContainerRef.current) return;

    const attachTrack = () => {
      const container = videoContainerRef.current;
      if (!container) return;
      container.innerHTML = '';

      const publication = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (publication?.track) {
        const el = publication.track.attach();
        el.className = 'w-full h-full object-cover';
        container.appendChild(el);
      }
    };

    room.on(RoomEvent.TrackSubscribed, attachTrack);
    room.on(RoomEvent.LocalTrackPublished, attachTrack);
    attachTrack();

    return () => {
      room.off(RoomEvent.TrackSubscribed, attachTrack);
      room.off(RoomEvent.LocalTrackPublished, attachTrack);
    };
  }, [room]);

  useEffect(() => {
    if (!room) return;

    const handleParticipant = () => {
      setViewerCount(room.remoteParticipants.size);
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipant);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipant);
    setViewerCount(room.remoteParticipants.size);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipant);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipant);
    };
  }, [room]);

  useEffect(() => {
    if (step !== 'live') return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleGoLive = async () => {
    if (!title.trim() || !category) {
      toast('error', 'Please fill in title and category');
      return;
    }
    setIsStarting(true);
    try {
      const { session, token, wsUrl } = await liveApi.createLiveSession({
        title: title.trim(),
        category,
      });
      setSessionId(session._id);
      await connect(wsUrl, token);
      await liveApi.startLiveSession(session._id);
      setStep('live');
      toast('success', 'You are now live!');
    } catch (err: any) {
      console.error('Failed to go live:', err);
      toast('error', err?.response?.data?.message || 'Failed to go live');
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndStream = async () => {
    if (!sessionId) return;
    setIsEnding(true);
    try {
      await liveApi.endLiveSession(sessionId);
      disconnect();
      setStep('setup');
      setElapsed(0);
      setViewerCount(0);
      toast('info', 'Stream ended', `Peak viewers: ${viewerCount} | Likes: ${likeCount} | Duration: ${formatTime(elapsed)}`);
    } catch {
      toast('error', 'Failed to end stream');
    } finally {
      setIsEnding(false);
    }
  };

  const handleToggleMic = async () => {
    await toggleMicrophone();
    setMicEnabled((prev) => !prev);
  };

  const handleToggleCam = async () => {
    await toggleCamera();
    setCamEnabled((prev) => !prev);
  };

  return (
    <div className="h-dvh w-full bg-black relative overflow-hidden select-none">
      {/* ── Video (full-screen background) ── */}
      <div ref={videoContainerRef} className="absolute inset-0 bg-gray-900" />

      {/* ── Floating hearts ── */}
      <AnimatePresence>
        {hearts.map((h) => (
          <FloatingHeart key={h.id} id={h.id} x={h.x} />
        ))}
      </AnimatePresence>

      {/* ── SETUP SCREEN ── */}
      {step === 'setup' && (
        <div className="absolute inset-0 z-30 flex flex-col">
          {/* Top gradient */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Top bar */}
          <div className="relative flex items-center justify-between p-4 pt-5 z-10">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/50 transition-all"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5">
              <Video size={14} className="text-white/70" />
              <span className="text-xs font-medium text-white/80">Camera Preview</span>
            </div>
            <div className="w-10" />
          </div>

          {/* Centered setup card */}
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full max-w-sm bg-black/50 backdrop-blur-xl rounded-3xl p-6 space-y-5 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <Radio size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Go Live</h2>
                  <p className="text-xs text-white/50">Set up your stream</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block uppercase tracking-wider">Stream Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What are you streaming today?"
                  maxLength={100}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/60 focus:bg-white/15 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/60 mb-2 block uppercase tracking-wider">Category</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`text-[11px] py-2 px-2 rounded-xl font-semibold transition-all ${
                        category === c
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/20'
                          : 'bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/70'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGoLive}
                disabled={isStarting || !title.trim() || !category}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all active:scale-[0.98]"
              >
                {isStarting ? (
                  <><Loader2 size={16} className="animate-spin" /> Starting...</>
                ) : (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                    </span>
                    Go Live
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {/* Bottom preview info */}
          <div className="relative p-4 pb-6 z-10">
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handleToggleCam}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${camEnabled ? 'bg-white/15 backdrop-blur-md text-white' : 'bg-red-500/80 text-white'}`}
              >
                {camEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button
                onClick={handleToggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${micEnabled ? 'bg-white/15 backdrop-blur-md text-white' : 'bg-red-500/80 text-white'}`}
              >
                {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE SCREEN ── */}
      {step === 'live' && (
        <>
          {/* Top gradient */}
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />

          {/* Top-left: Back + LIVE badge */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between p-4 pt-5">
            <div className="flex items-center gap-3">
              <button
                onClick={handleEndStream}
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/50 transition-all"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-2 bg-red-500/90 backdrop-blur-md rounded-full pl-1.5 pr-3 py-1.5 shadow-lg shadow-red-500/30">
                <span className="relative flex h-2.5 w-2.5 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Live</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5">
                <Clock size={12} className="text-white/70" />
                <span className="text-xs text-white font-semibold tabular-nums font-mono">{formatTime(elapsed)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5">
                <Heart size={12} className="text-red-400 fill-red-400" />
                <span className="text-xs text-white font-semibold tabular-nums">{likeCount}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5">
                <Eye size={12} className="text-white/70" />
                <span className="text-xs text-white font-semibold tabular-nums">{viewerCount}</span>
              </div>
            </div>
          </div>

          {/* Bottom gradient */}
          <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-black/70 to-transparent z-10 pointer-events-none" />

          {/* ── Broadcaster comment feed (bottom-left) ── */}
          {showComments && (
            <div
              className="absolute bottom-20 left-0 z-20 pointer-events-auto"
              style={{ width: 'min(75vw, 300px)', height: 'min(30vh, 220px)' }}
            >
              <LiveCommentFeed comments={comments} isBroadcaster />
            </div>
          )}

          {/* Comment toggle (bottom-left, above controls) */}
          <button
            onClick={() => setShowComments((v) => !v)}
            className="absolute bottom-20 left-4 z-30 flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 hover:bg-black/50 transition-all"
          >
            <MessageCircle size={14} className={showComments ? 'text-white fill-white/20' : 'text-white/60'} />
            <span className="text-[10px] text-white/70 font-semibold">{comments.length}</span>
          </button>

          {/* Bottom controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-0 inset-x-0 z-20 p-4 pb-6"
          >
            <div className="flex items-center justify-center gap-5">
              {/* Camera toggle */}
              <button
                onClick={handleToggleCam}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${
                  camEnabled ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-red-500/80 text-white'
                }`}
              >
                {camEnabled ? <Video size={22} /> : <VideoOff size={22} />}
              </button>

              {/* Mic toggle */}
              <button
                onClick={handleToggleMic}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${
                  micEnabled ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-red-500/80 text-white'
                }`}
              >
                {micEnabled ? <Mic size={22} /> : <MicOff size={22} />}
              </button>

              {/* End stream (larger, centered emphasis) */}
              <button
                onClick={handleEndStream}
                disabled={isEnding}
                className="w-16 h-16 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center shadow-xl shadow-red-600/40 transition-all active:scale-95"
              >
                {isEnding ? <Loader2 size={24} className="animate-spin" /> : <PhoneOff size={24} />}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
