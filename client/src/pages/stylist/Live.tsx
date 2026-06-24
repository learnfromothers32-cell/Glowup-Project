import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "../../utils/logger";
import { useLiveStream } from "../../hooks/useLiveStream";
import LiveCreatorPanel from "../../features/live/components/LiveCreatorPanel";
import ModerationPanel from "../../features/live/components/ModerationPanel";
import { ScheduleSessionForm } from "../../features/live/components/ScheduleSessionForm";
import { useLiveStore } from "../../features/live/store/liveStore";
import { scheduleLive } from "../../api/live";
import { CalendarPlus, Sparkles, Camera, Play, Eye, EyeOff } from "lucide-react";

export default function StylistLive() {
  const {
    isLive, viewerCount, totalLikes, totalGifts, totalCoins, chatMessages, giftNotifications, loading,
    socket, stylistId, goLive, endLive, sendChat,
  } = useLiveStream();

  const streamRef = useRef<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [recentGift, setRecentGift] = useState<typeof giftNotifications[0] | null>(null);
  const [webrtcConnected, setWebrtcConnected] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [streamCategory, setStreamCategory] = useState("hairstyling");

  const [activeViewers, setActiveViewers] = useState<Set<string>>(new Set());
  const [goLiveError, setGoLiveError] = useState("");

  const { mutedUsers, addMutedUser, removeMutedUser, blockedUsers, addBlockedUser, removeBlockedUser } = useLiveStore();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isLive) {
      timer = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isLive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (giftNotifications.length === 0) return;
    const latest = giftNotifications[giftNotifications.length - 1];
    setRecentGift(latest);
    const timer = setTimeout(() => setRecentGift(null), 4000);
    return () => clearTimeout(timer);
  }, [giftNotifications]);

  // WebRTC publisher
  useEffect(() => {
    if (!isLive || !socket || !stylistId) return;

    const pcs = new Map<string, RTCPeerConnection>();
    const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    const getStream = async () => {
      while (!streamRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return streamRef.current;
    };

    const handleUserJoined = async (data: { userId: string; userRole: string; socketId: string }) => {
      if (data.userRole === 'stylist') return;
      if (pcs.has(data.socketId)) return;

      setActiveViewers(prev => new Set(prev).add(data.userId));

      const stream = await getStream();
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcs.set(data.socketId, pc);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('live:webrtc-ice-candidate', {
            stylistId, candidate: event.candidate.toJSON(), targetSocketId: data.socketId,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected') {
          setWebrtcConnected(true);
        }
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          pc.close();
          pcs.delete(data.socketId);
          setActiveViewers(prev => { const n = new Set(prev); n.delete(data.userId); return n; });
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('live:webrtc-offer', {
          stylistId, offer: pc.localDescription, targetSocketId: data.socketId,
        });
      } catch (err) {
        logger.error('[WebRTC] createOffer error:', err);
        pc.close();
        pcs.delete(data.socketId);
      }
    };

    const handleUserLeft = (data: { socketId: string }) => {
      const pc = pcs.get(data.socketId);
      if (pc) {
        pc.close();
        pcs.delete(data.socketId);
      }
    };

    const handleAnswer = (data: { answer: RTCSessionDescriptionInit; senderSocketId: string }) => {
      const pc = pcs.get(data.senderSocketId);
      if (pc && !pc.currentRemoteDescription) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(console.error);
      }
    };

    const handleIceCandidate = (data: { candidate: RTCIceCandidateInit; senderSocketId: string }) => {
      const pc = pcs.get(data.senderSocketId);
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(console.error);
      }
    };

    socket.on('live:user-joined', handleUserJoined);
    socket.on('live:user-left', handleUserLeft);
    socket.on('live:webrtc-answer', handleAnswer);
    socket.on('live:webrtc-ice-candidate', handleIceCandidate);

    return () => {
      socket.off('live:user-joined', handleUserJoined);
      socket.off('live:user-left', handleUserLeft);
      socket.off('live:webrtc-answer', handleAnswer);
      socket.off('live:webrtc-ice-candidate', handleIceCandidate);
      pcs.forEach(pc => pc.close());
      pcs.clear();
      setWebrtcConnected(false);
    };
  }, [isLive, socket, stylistId]);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      streamRef.current = stream;
      setLocalStream(stream);
      setCameraDenied(false);
      return true;
    } catch {
      setCameraDenied(true);
      return false;
    }
  }, []);

  const handleGoLive = async (title: string) => {
    setGoLiveError("");
    const camOk = await startCamera();
    if (!camOk) {
      setGoLiveError("Camera access is required to go live.");
      return;
    }
    const ok = await goLive(title);
    if (!ok) {
      setGoLiveError("Failed to start the stream. Check your connection and try again.");
    }
  };

  const handleEndLive = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setLocalStream(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setDuration(0);
    setWebrtcConnected(false);
    setShowPreview(false);
    await endLive();
  };

  const handleScheduleSubmit = async (data: { title: string; description: string; category: string; scheduledAt: string; durationMinutes: number }) => {
    try {
      await scheduleLive(data);
      setShowSchedule(false);
    } catch (err) {
      logger.error("[Schedule] Failed:", err);
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => (t.enabled = isMuted));
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => (t.enabled = isVideoOff));
    }
    setIsVideoOff(!isVideoOff);
  };

  const handleModerationMute = (userId: string) => {
    if (mutedUsers.includes(userId)) removeMutedUser(userId);
    else addMutedUser(userId);
  };

  const handleModerationBlock = (userId: string) => {
    if (blockedUsers.includes(userId)) removeBlockedUser(userId);
    else addBlockedUser(userId);
  };

  const moderatedUsers = chatMessages
    .filter((m) => m.userRole !== "stylist")
    .reduce<Map<string, { id: string; name: string; messageCount: number }>>((acc, m) => {
      if (!acc.has(m.userId)) {
        acc.set(m.userId, { id: m.userId, name: m.userName, messageCount: 0 });
      }
      acc.get(m.userId)!.messageCount++;
      return acc;
    }, new Map());

  const moderationUsers = Array.from(moderatedUsers.values()).map((u) => ({
    ...u,
    isMuted: mutedUsers.includes(u.id),
    isBlocked: blockedUsers.includes(u.id),
    isModerator: false,
  }));

  const canGoLive = streamTitle.trim().length > 0 && !loading;

  return (
    <div className="flex-1 bg-black flex flex-col overflow-hidden">
      {!isLive ? (
        <>
          {/* Pre-live header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-surface-dark-secondary border-b border-gray-800">
            <div>
              <h2 className="text-white font-bold text-lg">Live Studio</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Broadcast to your audience</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSchedule(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stylist-500 text-white hover:bg-stylist-600 rounded-xl text-sm font-semibold transition-colors"
              >
                <CalendarPlus size={15} />
                Schedule
              </button>
            </div>
          </div>

          {/* Pre-live content */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto">
            {/* Camera preview / placeholder */}
            <div className="relative lg:w-[65%] xl:w-[70%] bg-neutral-900 flex items-center justify-center min-h-[240px] sm:min-h-[320px] lg:min-h-0">
              {localStream && showPreview ? (
                <>
                  <video ref={(el) => { if (el) el.srcObject = localStream; }} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Preview
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center">
                    <Camera size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-400">Camera preview</p>
                    <p className="text-xs text-gray-600 mt-0.5">Click "Check camera" to test your setup</p>
                  </div>
                </div>
              )}
            </div>

            {/* Setup form */}
            <div className="lg:flex-1 bg-surface-dark-secondary lg:border-l border-gray-800 p-4 sm:p-5 lg:p-6 flex flex-col gap-3 overflow-y-auto">
              {cameraDenied && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-800/30">
                  <p className="text-xs text-red-400">Camera access blocked. Grant permission in your browser settings and try again.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Stream title *</label>
                <input
                  value={streamTitle}
                  onChange={e => setStreamTitle(e.target.value)}
                  placeholder="e.g., Braid Tutorial & Tips"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 bg-neutral-800 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-stylist-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={streamDescription}
                  onChange={e => setStreamDescription(e.target.value)}
                  placeholder="What will you cover?"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-neutral-800 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-stylist-500/50 resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                <select
                  value={streamCategory}
                  onChange={e => setStreamCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-800 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-stylist-500/50 appearance-none cursor-pointer transition-all"
                >
                  {["Hairstyling", "Makeup", "Skincare", "Nail Art", "Braids & Weaves", "Barbering", "Waxing & Threading", "Beauty Tips"].map(c => (
                    <option key={c} value={c.toLowerCase().replace(/\s+/g, "-")} className="bg-neutral-900">{c}</option>
                  ))}
                </select>
              </div>

              {goLiveError && (
                <p className="text-xs text-red-400 text-center">{goLiveError}</p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    if (showPreview) {
                      if (streamRef.current) {
                        streamRef.current.getTracks().forEach(t => t.stop());
                        streamRef.current = null;
                      }
                      setLocalStream(null);
                      setShowPreview(false);
                    } else {
                      startCamera().then(ok => { if (ok) setShowPreview(true); });
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-neutral-800 text-gray-300 hover:bg-neutral-700 hover:text-white transition-all flex-1"
                >
                  {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
                  {showPreview ? "Hide preview" : "Check camera"}
                </button>
                <button
                  onClick={() => handleGoLive(streamTitle.trim())}
                  disabled={!canGoLive}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-stylist-500 to-pink-500 hover:from-stylist-600 hover:to-pink-600 active:scale-[0.97] transition-all disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed flex-1"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting...
                    </span>
                  ) : (
                    <>
                      <Play size={15} />
                      Go Live
                    </>
                  )}
                </button>
              </div>
              {!canGoLive && !loading && (
                <p className="text-[11px] text-amber-400/70 text-center">Add a stream title to go live</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <LiveCreatorPanel
          isLive={isLive} loading={loading} viewerCount={viewerCount}
          totalLikes={totalLikes} totalGifts={totalGifts} totalCoins={totalCoins}
          chatMessages={chatMessages}
          onGoLive={handleGoLive} onEndLive={handleEndLive} onSendChat={sendChat}
          onToggleMic={toggleMic} onToggleVideo={toggleVideo}
          onSwitchCamera={() => {}} onToggleBeauty={() => {}} onShare={() => {}} onInviteGuest={() => {}}
          onModeration={() => setShowModeration(true)}
          isMuted={isMuted} isVideoOff={isVideoOff} duration={duration}
          cameraDenied={cameraDenied} onRetryCamera={startCamera} stream={localStream}
          streamTitle={streamTitle} streamDescription={streamDescription} streamCategory={streamCategory}
          onTitleChange={setStreamTitle} onDescriptionChange={setStreamDescription} onCategoryChange={setStreamCategory}
          goLiveError={goLiveError}
        />
      )}

      {/* Gift toast */}
      <AnimatePresence>
        {recentGift && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md shadow-lg" style={{ background: "rgba(0,0,0,0.85)" }}>
              <Sparkles size={14} className="text-yellow-400" />
              <span className="text-white text-sm font-medium">{recentGift.giftIcon}</span>
              <span className="text-white text-sm">{recentGift.userName}</span>
              <span className="text-white/50 text-xs">sent</span>
              <span className="text-white text-sm font-bold">{recentGift.giftName}</span>
              <span className="text-yellow-400 text-xs font-bold">+{recentGift.coinAmount}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ModerationPanel
        isOpen={showModeration} onClose={() => setShowModeration(false)}
        users={moderationUsers}
        onMuteUser={handleModerationMute} onBlockUser={handleModerationBlock}
      />

      {showSchedule && (
        <ScheduleSessionForm
          onClose={() => setShowSchedule(false)}
          onSubmit={handleScheduleSubmit}
        />
      )}
    </div>
  );
}
