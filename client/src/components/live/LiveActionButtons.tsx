import { motion } from 'framer-motion';
import { Heart, Share2, Gift, MoreHorizontal } from 'lucide-react';

interface LiveActionButtonsProps {
  onLike: () => void;
  onShare: () => void;
  onGift: () => void;
  onMore?: () => void;
  isLiked?: boolean;
  likeCount?: number;
  showGift?: boolean;
  showMore?: boolean;
  className?: string;
}

export default function LiveActionButtons({
  onLike,
  onShare,
  onGift,
  onMore,
  isLiked = false,
  likeCount = 0,
  showGift = true,
  showMore = true,
  className = '',
}: LiveActionButtonsProps) {
  return (
    <div className={`flex flex-col items-center gap-5 ${className}`}>
      {/* Like Button */}
      <button
        onClick={onLike}
        className="flex flex-col items-center gap-1"
        aria-label={isLiked ? 'Unlike' : 'Like'}
      >
        <motion.div
          animate={isLiked ? { scale: [1, 1.3, 0.9, 1.1, 1] } : {}}
          transition={{ duration: 0.4 }}
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          <Heart
            size={32}
            className={isLiked ? 'text-red-500 fill-red-500' : 'text-white'}
          />
        </motion.div>
        <span className="text-[11px] text-white font-bold tabular-nums">{likeCount}</span>
      </button>

      {/* Share Button */}
      <button
        onClick={onShare}
        className="flex flex-col items-center gap-1"
        aria-label="Share stream"
      >
        <div
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          <Share2 size={28} className="text-white" />
        </div>
        <span className="text-[11px] text-white font-bold">Share</span>
      </button>

      {/* Gift Button */}
      {showGift && (
        <button
          onClick={onGift}
          className="flex flex-col items-center gap-1"
          aria-label="Send a gift"
        >
          <div
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          >
            <Gift size={32} className="text-white" />
          </div>
          <span className="text-[11px] text-white font-bold">Gift</span>
        </button>
      )}

      {/* More Options Button */}
      {showMore && onMore && (
        <button
          onClick={onMore}
          className="flex flex-col items-center gap-1"
          aria-label="More options"
        >
          <div
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          >
            <MoreHorizontal size={28} className="text-white" />
          </div>
          <span className="text-[11px] text-white font-bold">More</span>
        </button>
      )}
    </div>
  );
}
