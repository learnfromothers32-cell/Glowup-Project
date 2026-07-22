import { motion, useReducedMotion } from 'framer-motion';
import type { Comment } from '../../hooks/useLiveSession';

export function FloatingCommentBubble({ comment }: { comment: Comment }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20, scale: 0.85 }}
      transition={{ duration: prefersReducedMotion ? 0.05 : 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-2 max-w-[78%]"
    >
      {comment.userAvatar ? (
        <img src={comment.userAvatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 ring-[1.5px] ring-white/20" loading="lazy" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
          {comment.userName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full pl-3 pr-3.5 py-[7px] border border-white/[0.06]">
        <span className="text-[11px] font-bold text-pink-400 shrink-0">{comment.userName}</span>
        <span className="text-[13px] text-white/90 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">{comment.text}</span>
      </div>
    </motion.div>
  );
}

export function SystemCommentPill({ text }: { text: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex justify-center"
      role="status"
    >
      <span className="text-[11px] text-white/40 bg-white/[0.08] backdrop-blur-sm rounded-full px-3 py-0.5 font-medium">
        {text}
      </span>
    </motion.div>
  );
}
