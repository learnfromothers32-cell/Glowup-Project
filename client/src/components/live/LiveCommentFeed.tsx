import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Comment } from '../../hooks/useLiveSession';

interface LiveCommentFeedProps {
  comments: Comment[];
  isBroadcaster?: boolean;
}

const TRUNCATE_LENGTH = 120;

export default function LiveCommentFeed({ comments, isBroadcaster = false }: LiveCommentFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newCommentCount, setNewCommentCount] = useState(0);
  const prevCommentCountRef = useRef(comments.length);

  useEffect(() => {
    const diff = comments.length - prevCommentCountRef.current;
    prevCommentCountRef.current = comments.length;

    if (diff > 0 && !isAtBottom) {
      setNewCommentCount((c) => c + diff);
    }
  }, [comments.length, isAtBottom]);

  useEffect(() => {
    if (isAtBottom && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setNewCommentCount(0);
    }
  }, [comments, isAtBottom]);

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

  const visible = comments.slice(-30);

  if (visible.length === 0 && !isBroadcaster) return null;

  return (
    <div className="relative flex flex-col h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-none px-3 py-2"
      >
        {isBroadcaster && visible.length === 0 && (
          <div className="flex-1 flex items-end pb-2">
            <p className="text-xs text-white/30 italic">Comments from viewers will appear here</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {visible.map((item) => {
            if (item.type === 'system') {
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-center py-0.5"
                >
                  <span className="text-[11px] text-white/40 bg-white/5 backdrop-blur-sm rounded-full px-3 py-0.5">
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={scrollToBottom}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-3 py-1 text-xs text-white font-medium hover:bg-white/25 transition-colors"
          >
            <ChevronDown size={14} />
            {newCommentCount} new {newCommentCount === 1 ? 'comment' : 'comments'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommentBubble({ comment }: { comment: Comment }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = comment.text.length > TRUNCATE_LENGTH;
  const displayText = needsTruncation && !expanded
    ? comment.text.slice(0, TRUNCATE_LENGTH) + '...'
    : comment.text;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex items-start gap-2 max-w-[80%]"
    >
      {comment.userAvatar ? (
        <img
          src={comment.userAvatar}
          alt=""
          className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-white/10"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5">
          {comment.userName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="bg-black/40 backdrop-blur-sm rounded-2xl rounded-tl-sm px-3 py-1.5 max-w-full">
        <span className="text-[10px] font-semibold text-pink-400 block leading-tight">
          {comment.userName}
        </span>
        <p className="text-[13px] text-white/90 leading-snug whitespace-pre-wrap break-words">
          {displayText}
        </p>
        {needsTruncation && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] text-white/40 hover:text-white/60 mt-0.5 transition-colors"
          >
            {expanded ? 'Show less' : 'See more'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
