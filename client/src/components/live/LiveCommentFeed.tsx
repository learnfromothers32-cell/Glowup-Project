import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: number;
}

interface LiveCommentFeedProps {
  comments: Comment[];
}

export default function LiveCommentFeed({ comments }: LiveCommentFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [comments]);

  const visible = comments.slice(-25);

  if (visible.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-2 overflow-y-auto scrollbar-none px-3"
    >
      <AnimatePresence initial={false}>
        {visible.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, x: -16, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-2 max-w-[85%]"
          >
            {comment.userAvatar ? (
              <img
                src={comment.userAvatar}
                alt=""
                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/20"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {comment.userName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl rounded-tl-sm px-3 py-1.5">
              <span className="text-[10px] font-semibold text-pink-400/90">
                {comment.userName}
              </span>
              <p className="text-[13px] text-white leading-snug">{comment.text}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
