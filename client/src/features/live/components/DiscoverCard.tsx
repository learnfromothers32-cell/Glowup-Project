import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LiveBadge, ViewerCount } from "./LiveBadge";
import { cn } from "@/utils/cn";
import type { LiveSession } from "@/domain/live/live.types";

interface DiscoverCardProps {
  session: LiveSession;
  className?: string;
}

function formatViewerCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function DiscoverCard({ session, className }: DiscoverCardProps) {
  const stylist =
    typeof session.stylistId === "object" ? session.stylistId : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative group rounded-2xl overflow-hidden bg-white dark:bg-surface-dark-secondary",
        "border border-gray-100 dark:border-gray-700/40",
        "shadow-soft hover:shadow-xl transition-all duration-300",
        className,
      )}
    >
      <Link to={`/app/live/${session._id}`} className="block">
        <div className="relative aspect-[9/16] sm:aspect-video bg-gray-900">
          {session.thumbnailUrl ? (
            <img
              src={session.thumbnailUrl}
              alt={session.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white/40"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
          )}

          {session.status === "live" && (
            <div className="absolute top-3 left-3">
              <LiveBadge />
            </div>
          )}

          {session.status === "live" && (
            <div className="absolute top-3 right-3">
              <ViewerCount count={session.viewerCount} />
            </div>
          )}

          {session.status === "scheduled" && session.scheduledAt && (
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-sm">
                Starts{" "}
                {new Date(session.scheduledAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {session.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
              {stylist?.image ? (
                <img
                  src={stylist.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                  {stylist?.name?.[0] || "?"}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {stylist?.name || "Stylist"}
            </span>
          </div>
          {session.category && (
            <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {session.category}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
