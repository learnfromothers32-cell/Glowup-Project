import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Play, BadgeCheck } from "lucide-react";
import type { LiveSession } from "../types/live.types";

interface Props {
  session: LiveSession;
  onJoin: (session: LiveSession) => void;
}

export function LiveSessionCard({ session, onJoin }: Props) {
  const navigate = useNavigate();
  const viewerLabel =
    session.viewerCount >= 1000
      ? `${(session.viewerCount / 1000).toFixed(1)}k`
      : session.viewerCount;

  return (
    <motion.button
      onClick={() => onJoin(session)}
      className="group relative w-full text-left bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
        {session.thumbnail && (
          <img
            src={session.thumbnail}
            alt={session.title}
            className="w-full h-full object-cover"
          />
        )}

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-[11px] font-semibold rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/60 text-white text-[11px] font-medium rounded-full backdrop-blur-sm">
            <Users size={12} />
            {viewerLabel}
          </span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play size={20} className="text-gray-900 ml-0.5" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/app/stylist/${session.host.id}`); }}
            className="relative shrink-0 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-300 hover:opacity-80 transition-opacity">
              {session.host.name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#1a1a2e] rounded-full" />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {session.title}
            </h3>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/app/stylist/${session.host.id}`); }}
              className="flex items-center gap-1 mt-0.5 cursor-pointer"
            >
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate hover:underline">
                {session.host.name}
              </span>
              {session.host.isVerified && (
                <BadgeCheck size={12} className="text-blue-500 shrink-0" />
              )}
            </button>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 capitalize mt-0.5 block">
              {session.category}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
