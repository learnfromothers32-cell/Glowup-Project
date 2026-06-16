import { motion } from "framer-motion";
import { Clock, Trash2 } from "lucide-react";
import { cn } from "../../utils/cn";
import FavoriteButton from "./FavoriteButton";
import type { HairstyleResult } from "../../api/hairstyles";

interface SavedLooksGalleryProps {
  results: HairstyleResult[];
  onSelect: (result: HairstyleResult) => void;
  onToggleFavorite: (resultId: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  className?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function SavedLooksGallery({
  results,
  onSelect,
  onToggleFavorite,
  onDelete,
  loading,
  className,
}: SavedLooksGalleryProps) {
  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Clock size={24} className="text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No saved looks yet</p>
        <p className="text-xs text-gray-300 mt-1">Generated hairstyles will appear here</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {results.map((result) => {
        const hairstyle = typeof result.hairstyleId === "object" ? result.hairstyleId : null;

        return (
          <motion.div
            key={result._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect(result)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(result); }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left cursor-pointer"
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {result.generatedImage ? (
                <img
                  src={result.generatedImage}
                  alt={hairstyle?.name || "Hairstyle"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Clock size={16} className="text-gray-300" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {hairstyle?.name || "Hairstyle"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {hairstyle && (
                  <span className="text-[10px] text-gray-400 capitalize">{hairstyle.category}</span>
                )}
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[10px] text-gray-400">{formatDate(result.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <FavoriteButton
                favorite={result.favorite}
                onToggle={() => onToggleFavorite(result._id)}
              />
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(result._id); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                aria-label="Delete result"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
