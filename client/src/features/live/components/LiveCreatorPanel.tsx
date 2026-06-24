import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Users, Heart, Gift, Mic, MicOff,
  Camera, CameraOff, SwitchCamera, Shield, Sparkles, X, Star,
} from "lucide-react";

interface Props {
  isLive: boolean;
  viewerCount: number;
  totalLikes: number;
  totalGifts: number;
  totalCoins: number;
  chatMessages: any[];
  onSendChat: (msg: string) => void;
  onGoLive: (title: string) => void;
  onEndLive: () => void;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onToggleBeauty: () => void;
  onShare: () => void;
  onInviteGuest: () => void;
  onModeration?: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
  duration: number;
  stream?: MediaStream | null;
  streamTitle: string;
  streamDescription: string;
  streamCategory: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  loading: boolean;
  cameraDenied: boolean;
  onRetryCamera: () => void;
  goLiveError?: string;
}

function FloatingHearts({ hearts }: { hearts: Array<{ id: string; x: number }> }) {
  return (
    <AnimatePresence>
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 1, scale: 0.3, y: 0, x: `${h.x}%` }}
          animate={{ opacity: 0, scale: 1.4, y: -280 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "ease-out" }}
          className="absolute bottom-16 z-30 pointer-events-none"
          style={{ left: `${h.x}%` }}
        >
          <span className="text-3xl">❤️</span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export default function LiveCreatorPanel(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState("");
  const [hearts, setHearts] = useState<Array<{ id: string; x: number }>>([]);

  useEffect(() => {
    if (videoRef.current && props.stream) {
      videoRef.current.srcObject = props.stream;
    }
  }, [props.stream, props.isLive]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [props.chatMessages]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    props.onSendChat(chatInput.trim());
    setChatInput("");
  };

  const spawnHeart = useCallback(() => {
    const id = `h-${Date.now()}-${Math.random()}`;
    const x = 15 + Math.random() * 70;
    setHearts((prev) => [...prev, { id, x }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2200);
  }, []);

  const visibleMessages = props.chatMessages.slice(-6);

  const hostInitial = "S";

  /* ════════════════════ PRE-LIVE ════════════════════ */
  if (!props.isLive) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col overflow-hidden">
        {/* Full screen camera preview */}
        <div className="flex-1 relative min-h-0">
          {props.stream ? (
            <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-950">
              <div className="w-24 h-24 rounded-full bg-neutral-900 flex items-center justify-center ring-1 ring-white/10">
                <Camera size={40} className="text-neutral-600" />
              </div>
              <p className="text-xs text-neutral-500 font-medium">Tap "Check camera" to preview</p>
            </div>
          )}

          {/* Gradient top */}
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />

          {/* Creator icon top-left */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4" style={{ paddingTop: "calc(12px + env(safe-area-inset-top))" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center ring-2 ring-white/30">
                <span className="text-white font-bold text-sm">{hostInitial}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-bold leading-tight">You</span>
                <span className="text-white/50 text-[10px] leading-tight">Go Live</span>
              </div>
            </div>
          </div>

          {/* Camera denied overlay */}
          {props.cameraDenied && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 z-20">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <CameraOff size={28} className="text-red-400" />
              </div>
              <p className="text-sm text-white/70">Camera access blocked</p>
              <button
                onClick={props.onRetryCamera}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-white/15 hover:bg-white/25 active:scale-95 transition-all"
              >
                Enable Camera
              </button>
            </div>
          )}
        </div>

        {/* Bottom setup panel - TikTok style */}
        <div className="shrink-0 bg-neutral-900 px-4 pt-4 pb-8 space-y-3 border-t border-white/[0.06]" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
          <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-0.5 ring-1 ring-white/10 focus-within:ring-red-500/50 transition-all">
            <span className="text-white/30 text-sm">🔴</span>
            <input
              value={props.streamTitle}
              onChange={e => props.onTitleChange(e.target.value)}
              placeholder="What's your stream about?"
              maxLength={100}
              className="flex-1 bg-transparent py-3 text-sm text-white placeholder-neutral-500 outline-none"
            />
            {props.streamTitle.length > 0 && (
              <span className="text-[10px] text-neutral-500 font-mono">{props.streamTitle.length}/100</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!props.stream && !props.cameraDenied && (
              <button
                onClick={props.onRetryCamera}
                className="shrink-0 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
              >
                <Camera size={20} className="text-white/60" />
              </button>
            )}
            <button
              onClick={() => props.onGoLive(props.streamTitle.trim())}
              disabled={!props.streamTitle.trim() || props.loading}
              className="flex-1 h-12 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 shadow-lg shadow-red-500/25"
            >
              {props.loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                  Starting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={16} />
                  Go Live
                </span>
              )}
            </button>
          </div>

          {props.goLiveError && (
            <p className="text-xs text-red-400/80 text-center">{props.goLiveError}</p>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════ LIVE ════════════════════ */
  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {/* Full-screen video */}
      {props.stream ? (
        <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm bg-neutral-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center">
              <CameraOff size={22} className="text-neutral-600" />
            </div>
            <span>Camera off</span>
          </div>
        </div>
      )}

      {/* Floating hearts */}
      <FloatingHearts hearts={hearts} />

      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-black/75 to-transparent pointer-events-none z-10" />

      {/* ═══ TOP BAR ═══ */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3" style={{ paddingTop: "calc(8px + env(safe-area-inset-top))" }}>
        <div className="flex items-center justify-between">
          {/* Left: Creator avatar + name */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center ring-2 ring-white/40 shadow-lg shrink-0">
              <span className="text-white font-bold text-sm">{hostInitial}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-white text-[13px] font-bold drop-shadow-lg leading-tight">You</span>
                <span className="text-[10px] text-white/50">· LIVE</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={10} className="text-white/60" />
                <span className="text-[11px] text-white/70 font-medium drop-shadow-lg">{props.viewerCount} watching</span>
              </div>
            </div>
          </div>

          {/* Right: Duration + Flip */}
          <div className="flex items-center gap-1.5">
            <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
              <span className="text-[11px] text-white/80 font-semibold font-mono tracking-wider">
                {String(Math.floor(props.duration / 60)).padStart(2, "0")}:{String(props.duration % 60).padStart(2, "0")}
              </span>
            </div>
            <button
              onClick={props.onSwitchCamera}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 active:scale-90 transition-all border border-white/10"
            >
              <SwitchCamera size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT SIDE ACTIONS ═══ */}
      <div className="absolute right-2.5 z-20 flex flex-col items-center gap-4" style={{ top: "50%", transform: "translateY(-50%)" }}>
        {/* Gifts */}
        <button
          onClick={spawnHeart}
          className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/[0.06]">
            <Gift size={19} className="text-pink-400" />
          </div>
          <span className="text-[9px] text-white/70 font-medium drop-shadow-lg">{props.totalGifts}</span>
        </button>

        {/* Likes */}
        <button
          onClick={spawnHeart}
          className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/[0.06]">
            <Heart
              size={19}
              className="text-red-400"
              fill={props.totalLikes > 0 ? "#f43f5e" : "none"}
            />
          </div>
          <span className="text-[9px] text-white/70 font-medium drop-shadow-lg">{props.totalLikes}</span>
        </button>

        {/* Moderation */}
        {props.onModeration && (
          <button
            onClick={props.onModeration}
            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
          >
            <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/[0.06]">
              <Shield size={19} className="text-emerald-400" />
            </div>
            <span className="text-[9px] text-white/70 font-medium drop-shadow-lg">Mod</span>
          </button>
        )}
      </div>

      {/* ═══ FLOATING COMMENTS ═══ */}
      <div className="absolute left-3 right-[72px] z-20 pointer-events-none" style={{ bottom: 88 }}>
        <AnimatePresence initial={false}>
          {visibleMessages.map((msg: any) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 18, x: -10 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", damping: 22, stiffness: 320 }}
              className="mb-1.5"
            >
              <div className="inline-flex items-start gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md" style={{ background: "rgba(0,0,0,0.55)", maxWidth: "92%" }}>
                <span
                  className="shrink-0 font-bold text-[12px] leading-5 drop-shadow-md"
                  style={{ color: msg.userRole === "stylist" ? "#FE2C55" : "#94a3b8" }}
                >
                  {msg.userName}
                </span>
                <span className="text-white text-[13px] leading-5 break-words min-w-0 drop-shadow-md">
                  {msg.message}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* ═══ BOTTOM CONTROLS ═══ */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-3 pt-8 bg-gradient-to-t from-black/85 to-transparent"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2">
          {/* Mic toggle */}
          <button
            onClick={props.onToggleMic}
            className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${props.isMuted ? "bg-red-500/30 text-red-400" : "bg-white/15 text-white hover:bg-white/25"}`}
          >
            {props.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Chat input */}
          <div className="flex-1 flex items-center bg-white/[0.12] rounded-full px-4 py-2.5 ring-1 ring-white/[0.08] focus-within:ring-white/25 transition-all backdrop-blur-sm">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-[13px] text-white placeholder-white/35 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!chatInput.trim()}
              className="shrink-0 p-1.5 disabled:opacity-25 transition-opacity ml-1 active:scale-90"
            >
              <Send size={16} className="text-pink-400" />
            </button>
          </div>

          {/* End live */}
          <button
            onClick={props.onEndLive}
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-90 transition-all shadow-lg shadow-red-500/25"
            title="End live"
          >
            <X size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
