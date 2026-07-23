import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Comment } from '../../hooks/useLiveSession';

interface LiveCommentFeedProps {
  comments: Comment[];
  maxVisible?: number;
  shiftUp?: boolean;
  className?: string;
}

interface FloatingItem {
  id: string;
  userName: string;
  text: string;
  userAvatar?: string;
  delayIndex: number;
}

const VISIBLE_DURATION_MS = 5000;
const STAGGER_MS = 50;

export default function LiveCommentFeed({ 
  comments, 
  maxVisible = 6, 
  shiftUp = false,
  className = '' 
}: LiveCommentFeedProps) {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const staggerRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    for (const c of comments) {
      if (c.type !== 'comment') continue;
      if (seenIdsRef.current.has(c.id)) continue;
      seenIdsRef.current.add(c.id);

      const delayIndex = staggerRef.current;
      staggerRef.current += 1;
      setTimeout(() => { staggerRef.current = Math.max(0, staggerRef.current - 1); }, 200);

      const item: FloatingItem = { 
        id: c.id, 
        userName: c.userName, 
        text: c.text, 
        userAvatar: c.userAvatar,
        delayIndex 
      };

      setItems((prev) => {
        const next = [...prev, item];
        return next.length > maxVisible ? next.slice(next.length - maxVisible) : next;
      });

      const timer = setTimeout(() => {
        timersRef.current.delete(c.id);
        setItems((prev) => prev.filter((it) => it.id !== c.id));
      }, VISIBLE_DURATION_MS);
      timersRef.current.set(c.id, timer);
    }
  }, [comments, maxVisible]);

  useEffect(() => {
    return () => {
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();
    };
  }, []);

  const bottomOffset = shiftUp ? 'max(env(safe-area-inset-bottom, 20px), 280px)' : 'max(env(safe-area-inset-bottom, 20px), 140px)';

  return (
    <div
      className={`left-3 right-[70px] z-[25] pointer-events-none flex flex-col-reverse gap-2 ${className}`}
      style={{ bottom: bottomOffset, position: 'absolute' }}
      aria-live="polite"
      aria-label="Live comments"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            layout
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, x: -20, scale: 0.95 }
            }
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: -20, scale: 0.95 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.05 : 0.3,
              ease: 'easeOut',
              delay: prefersReducedMotion ? 0 : item.delayIndex * STAGGER_MS / 1000,
            }}
            className="w-fit max-w-[75vw]"
          >
            <div className="flex items-center gap-2">
              {item.userAvatar && (
                <img 
                  src={item.userAvatar} 
                  alt="" 
                  className="w-6 h-6 rounded-full object-cover border border-white/20"
                />
              )}
              {!item.userAvatar && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center border border-white/20">
                  <span className="text-[8px] font-bold text-white">{item.userName[0]}</span>
                </div>
              )}
              <div className="rounded-full px-3 py-1.5 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
                <span className="text-[13px] font-bold text-white">{item.userName}</span>
                <span className="text-[13px] text-white ml-1">{item.text}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
