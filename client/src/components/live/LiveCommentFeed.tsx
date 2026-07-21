import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, MessageCircle } from 'lucide-react';
import type { Comment } from '../../hooks/useLiveSession';

interface LiveCommentFeedProps {
  comments: Comment[];
  isBroadcaster?: boolean;
}

const TRUNCATE_LENGTH = 120;
const VISIBLE_COUNT = 40;

function formatTimestamp(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'now';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export default function LiveCommentFeed({ comments, isBroadcaster = false }: LiveCommentFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newCommentCount, setNewCommentCount] = useState(0);
  const prevCommentCountRef = useRef(comments.length);
  const prefersReducedMotion = useReducedMotion();
  const [, setTick] = useState(0);

  useEffect(() => {
    const diff = comments.length - prevCommentCountRef.current;
    prevCommentCountRef.current = comments.length;

    if (diff > 0 && !isAtBottom) {
      setNewCommentCount((c) => c + diff);
    }
  }, [comments.length, isAtBottom]);

  useEffect(() => {
    if (isAtBottom && containerRef.current) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
      setNewCommentCount(0);
    }
  }, [comments, isAtBottom]);

  // Tick every 30s to update relative timestamps
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setIsAtBottom(atBottom);
    if (atBottom) setNewCommentCount(0);
  }, []);

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    setNewCommentCount(0);
  };

  const visible = comments.slice(-VISIBLE_COUNT);

  if (visible.length === 0 && !isBroadcaster) return null;

  return (
    <div className="relative flex flex-col h-full" role="log" aria-live="polite" aria-label="Live comments">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 flex flex-col gap-[3px] overflow-y-auto scrollbar-none px-3 py-2"
      >
        {isBroadcaster && visible.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 pb-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <MessageCircle size={18} className="text-white/15" />
            </div>
            <p className="text-[11px] text-white/25 text-center leading-relaxed">
              Comments from viewers<br />will appear here
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {visible.map((item) => {
            if (item.type === 'system') {
              return (
                <motion.div
                  key={item.id}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: prefersReducedMotion ? 0.05 : 0.2, ease: 'easeOut' }}
                  className="flex justify-center py-1"
                  role="status"
                  aria-label={item.text}
                >
                  <span className="text-[11px] text-white/35 bg-white/[0.06] backdrop-blur-sm rounded-full px-3 py-0.5 font-medium">
                    {item.text}
                  </span>
                </motion.div>
              );
            }

            return (
              <CommentBubble key={item.id} comment={item} />
            );
          })}
        </AnimatePresence>
      </div>

      {/* New comments indicator */}
      <AnimatePresence>
        {!isAtBottom && newCommentCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToBottom}
            aria-label={`Scroll to ${newCommentCount} new comments`}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-3.5 py-1.5 text-[11px] text-white font-semibold hover:bg-white/25 transition-colors shadow-lg"
          >
            <ChevronDown size={14} />
            {newCommentCount} new {newCommentCount === 1 ? 'comment' : 'comments'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

const CommentBubble = memo(function CommentBubble({ comment }: { comment: Comment }) {
  const [expanded, setExpanded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const needsTruncation = comment.text.length > TRUNCATE_LENGTH;
  const displayText = needsTruncation && !expanded
    ? comment.text.slice(0, TRUNCATE_LENGTH) + '…'
    : comment.text;

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -12, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: prefersReducedMotion ? 0.05 : 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-start gap-2 max-w-[82%]"
    >
      {comment.userAvatar ? (
        <img
          src={comment.userAvatar}
          alt=""
          className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-white/10"
          loading="lazy"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
          {comment.userName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="bg-black/40 backdrop-blur-sm rounded-2xl rounded-tl-md px-3 py-2 max-w-full min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[11px] font-bold text-pink-400 leading-none truncate">
            {comment.userName}
          </span>
          <span className="text-[9px] text-white/20 leading-none shrink-0 tabular-nums">
            {formatTimestamp(comment.timestamp)}
          </span>
        </div>
        <p className="text-[13px] text-white/90 leading-[1.35] whitespace-pre-wrap break-words">
          {displayText}
        </p>
        {needsTruncation && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Show less' : 'See more of this comment'}
            className="text-[10px] text-white/35 hover:text-white/60 mt-1 transition-colors font-medium"
          >
            {expanded ? 'Show less' : 'See more'}
          </button>
        )}
      </div>
    </motion.div>
  );
});
