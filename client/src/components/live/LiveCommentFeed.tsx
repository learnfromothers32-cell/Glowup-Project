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

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-1.5 max-h-48 overflow-y-auto scrollbar-none px-3"
    >
      <AnimatePresence initial={false}>
        {comments.slice(-20).map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, x: -20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-2"
          >
            {comment.userAvatar ? (
              <img
                src={comment.userAvatar}
                alt=""
                className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/20"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                {comment.userName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-3 py-1.5 max-w-[75%]">
              <span className="text-[11px] font-semibold text-white/70">
                {comment.userName}
              </span>
              <p className="text-sm text-white leading-snug">{comment.text}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
