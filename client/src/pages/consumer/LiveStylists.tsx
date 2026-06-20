import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getStylists } from "../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { Users, Eye, Radio, MapPin, Star, Heart, Play, ChevronLeft, X } from "lucide-react";

const ROSE = "#FE2C55";

function formatViewers(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function LiveAvatarCard({ stylist, onWatch }: { stylist: Stylist; onWatch: () => void }) {
  const nav = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onWatch}
      className="relative aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer flex-shrink-0 w-[180px] sm:w-[200px] snap-start"
    >
      <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, #1a1a2e, #16213e)` }} />
      <div className="absolute inset-0 opacity-30" style={{
        background: `radial-gradient(circle at 30% 40%, ${ROSE}44 0%, transparent 60%)`
      }} />

      {stylist.image && (
        <img src={stylist.image} alt={stylist.name}
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      <div className="absolute top-3 left-3">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
          style={{ background: ROSE }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white/80"
        style={{ background: "rgba(0,0,0,0.5)" }}>
        <Eye size={10} />
        {formatViewers(stylist.viewerCount || Math.floor(Math.random() * 50))}
      </div>

      <div className="absolute bottom-0 inset-x-0 p-3 text-left">
        <div className="flex items-center gap-2 mb-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); nav(`/app/stylist/${stylist.id}`); }}
            className="w-7 h-7 rounded-full overflow-hidden ring-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" style={{ ringColor: ROSE }}
          >
            {stylist.image ? (
              <img src={stylist.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: ROSE }}>
                {getInitials(stylist.name)}
              </div>
            )}
          </button>
          <div className="min-w-0">
            <button
              onClick={(e) => { e.stopPropagation(); nav(`/app/stylist/${stylist.id}`); }}
              className="text-white text-xs font-bold truncate hover:underline cursor-pointer text-left"
            >
              {stylist.name}
            </button>
            <p className="text-white/50 text-[9px] truncate">{stylist.category || "Stylist"}</p>
          </div>
        </div>
        {stylist.liveTitle && (
          <p className="text-white/70 text-[10px] line-clamp-1 leading-tight">{stylist.liveTitle}</p>
        )}
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ background: `${ROSE}99` }}>
          <Play size={20} className="text-white ml-0.5" fill="white" />
        </div>
      </div>
    </motion.button>
  );
}

export default function LiveStylists() {
  const navigate = useNavigate();
  const [liveStylists, setLiveStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLiveStylists = useCallback(() => {
    return getStylists({ isLive: true })
      .then(setLiveStylists)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchLiveStylists().finally(() => setLoading(false));
  }, [fetchLiveStylists]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchLiveStylists, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveStylists]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-[#FE2C55] animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: "#8E9FB2" }}>Loading live stylists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F4F7FC" }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio size={22} style={{ color: ROSE }} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#0A1424" }}>Live Now</h1>
              <p className="text-xs" style={{ color: "#8E9FB2" }}>
                {liveStylists.length > 0
                  ? `${liveStylists.length} stylist${liveStylists.length > 1 ? 's' : ''} streaming live`
                  : "No one is live right now"}
              </p>
            </div>
          </div>
          <button onClick={() => navigate("/app/live")} className="p-2 rounded-full hover:bg-white/50 transition-colors">
            <X size={18} style={{ color: "#5A6E8A" }} />
          </button>
        </div>

        {liveStylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF2F8" }}>
              <Radio size={34} style={{ color: "#8E9FB2" }} />
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: "#0A1424" }}>No live streams right now</h3>
            <p className="text-sm mb-6" style={{ color: "#8E9FB2" }}>
              Stylists go live throughout the day — check back soon
            </p>
            <button
              onClick={() => navigate("/app")}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
              style={{ background: ROSE, color: "white" }}
            >
              Browse Stylists
            </button>
          </div>
        ) : (
          <>
            {/* Featured - largest card */}
            <div className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {liveStylists.slice(0, 4).map((stylist, i) => (
                  <motion.div
                    key={stylist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="relative aspect-[4/3] sm:aspect-[4/5] rounded-2xl overflow-hidden group cursor-pointer"
                    onClick={() => navigate(`/app/live/${stylist.id}`)}
                  >
                    <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, #1a1a2e, #16213e)` }} />
                    {stylist.image && (
                      <img src={stylist.image} alt={stylist.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ background: ROSE }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-white/80"
                        style={{ background: "rgba(0,0,0,0.5)" }}>
                        <Eye size={10} /> {formatViewers(stylist.viewerCount || Math.floor(Math.random() * 87 + 5))}
                      </span>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/stylist/${stylist.id}`); }}
                        className="text-white text-sm font-bold hover:underline text-left cursor-pointer"
                      >
                        {stylist.name}
                      </button>
                      <div className="flex items-center gap-1 text-white/50 text-[10px]">
                        <MapPin size={8} />
                        {typeof stylist.location === "object" ? stylist.location.area || "" : stylist.location || ""}
                      </div>
                      {stylist.liveTitle && (
                        <p className="text-white/60 text-[11px] mt-1 line-clamp-1">{stylist.liveTitle}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Horizontal scroll - more live stylists */}
            {liveStylists.length > 4 && (
              <div>
                <h2 className="text-sm font-bold mb-3" style={{ color: "#0A1424" }}>More Live Streams</h2>
                <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
                  {liveStylists.slice(4).map((stylist) => (
                    <LiveAvatarCard
                      key={stylist.id}
                      stylist={stylist}
                      onWatch={() => navigate(`/app/live/${stylist.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
