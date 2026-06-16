import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTrendingTransformations,
  trackTrendingEvent,
  toggleEngagement,
  type TrendingTransformation,
} from "../../../api/trending";
import { useAuth } from "../../../context/authUtils";
import { API_SERVER_URL } from "../../../api/axios";
import {
  Heart,
  ChevronRight,
  ChevronLeft,
  Eye,
  Flame,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function imgUrl(url: string): string {
  return url?.startsWith("http") ? url : `${API_SERVER_URL}${url}`;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function TrendingSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
            <div className="w-36 h-4 rounded-full bg-gray-100 animate-pulse" />
          </div>
          <div className="w-16 h-4 rounded-full bg-gray-100 animate-pulse" />
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-40">
            <div className="aspect-[3/4] rounded-xl bg-gray-100 animate-pulse" />
            <div className="mt-2.5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-100 animate-pulse" />
              <div className="w-20 h-3 rounded-full bg-gray-100 animate-pulse" />
            </div>
            <div className="mt-1.5 w-16 h-2.5 rounded-full bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendingCard({
  item,
  index,
  onClick,
}: {
  item: TrendingTransformation;
  index: number;
  onClick: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(() => {
    const stored = localStorage.getItem("trending_likes");
    if (stored) {
      const set = new Set<string>(JSON.parse(stored));
      return set.has(item.id);
    }
    return false;
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLiked = !liked;
    setLiked(nextLiked);
    const stored = localStorage.getItem("trending_likes");
    const set = stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    if (nextLiked) {
      set.add(item.id);
      Promise.all([
        trackTrendingEvent(item.id, "like"),
        isAuthenticated ? toggleEngagement(item.id, "like", true) : Promise.resolve(),
      ]).catch(() => undefined);
    } else {
      set.delete(item.id);
      Promise.all([
        trackTrendingEvent(item.id, "unlike"),
        isAuthenticated ? toggleEngagement(item.id, "like", false) : Promise.resolve(),
      ]).catch(() => undefined);
    }
    localStorage.setItem("trending_likes", JSON.stringify(Array.from(set)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      onClick={onClick}
      className="flex-shrink-0 w-[160px] cursor-pointer group"
    >
      <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-gray-100">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
        )}

        {item.mediaType === 'video' ? (
          <video
            src={imgUrl(item.after)}
            className="w-full h-full object-cover"
            controls
            loop
            playsInline
            onCanPlay={() => setImageLoaded(true)}
          />
        ) : (
          <img
            src={imgUrl(item.after)}
            alt={`${item.stylistName}'s work`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`
              w-full h-full object-cover transition-all duration-500
              ${imageLoaded ? "opacity-100" : "opacity-0"}
              group-hover:scale-105
            `}
          />
        )}

        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {index < 3 && (
          <div className="absolute top-2.5 left-2.5">
            <div
              className={`
                w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg
                ${index === 0 ? "bg-amber-400 text-amber-900" : ""}
                ${index === 1 ? "bg-gray-300 text-gray-700" : ""}
                ${index === 2 ? "bg-amber-600 text-amber-50" : ""}
              `}
            >
              #{index + 1}
            </div>
          </div>
        )}

        <button
          onClick={handleLike}
          className={`
            absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center
            transition-all duration-200 backdrop-blur-sm
            ${
              liked
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-black/30 text-white hover:bg-black/50"
            }
          `}
        >
          <Heart
            size={13}
            fill={liked ? "currentColor" : "none"}
            className={
              liked ? "scale-110" : "group-hover:scale-110 transition-transform"
            }
          />
        </button>

        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-medium text-white/90">
              <Heart size={9} fill="currentColor" className="text-red-400" />
              {formatCount(item.likes)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/70">
              <Eye size={9} />
              {formatCount(item.views)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/70">
              <Share2 size={9} />
              {formatCount(item.shares)}
            </span>
          </div>

          {item.serviceName && (
            <span className="px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-sm text-[9px] font-medium text-white">
              {item.serviceName}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        {item.stylistImage ? (
          <img
            src={imgUrl(item.stylistImage)}
            alt={item.stylistName}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-gray-200"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-[8px] font-bold text-gray-500">
              {item.stylistName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
            {item.stylistName}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TrendingPreview() {
  const navigate = useNavigate();
  const [items, setItems] = useState<TrendingTransformation[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getTrendingTransformations(10)
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const checkArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 8;
    setShowLeftArrow(el.scrollLeft > threshold);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - threshold);
  };

  useEffect(() => {
    if (loading) return;
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(checkArrows, 100);
    el.addEventListener("scroll", checkArrows, { passive: true });
    window.addEventListener("resize", checkArrows);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkArrows);
      window.removeEventListener("resize", checkArrows);
    };
  }, [loading, items]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const handleCardClick = (item: TrendingTransformation) => {
    trackTrendingEvent(item.id, "view").catch(() => undefined);
    navigate("/app/trending", { state: { highlightId: item.id } });
  };

  const handleSeeAll = () => {
    navigate("/app/trending");
  };

  if (loading) return <TrendingSkeleton />;
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <Flame size={16} className="text-orange-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
              Trending Transformations
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Most loved looks this week
            </p>
          </div>
        </div>

        <button
          onClick={handleSeeAll}
          className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
        >
          See all
          <ChevronRight size={12} />
        </button>
      </div>

      <div className="relative group/scroll">
        <AnimatePresence>
          {showLeftArrow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 top-0 bottom-0 z-10 flex items-center"
            >
              <div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-white to-transparent pointer-events-none" />
              <button
                onClick={() => scroll("left")}
                className="relative ml-2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100"
              >
                <ChevronLeft size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRightArrow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 z-10 flex items-center"
            >
              <div className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-white to-transparent pointer-events-none" />
              <button
                onClick={() => scroll("right")}
                className="relative mr-2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100"
              >
                <ChevronRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={scrollRef}
          className="flex gap-3 px-4 pb-4 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item, i) => (
            <TrendingCard
              key={item.id}
              item={item}
              index={i}
              onClick={() => handleCardClick(item)}
            />
          ))}
          <div className="w-1 shrink-0" />
        </div>
      </div>
    </div>
  );
}
