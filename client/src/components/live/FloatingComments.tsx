import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Comment } from '../../hooks/useLiveSession';

interface FloatingCommentsProps {
  comments: Comment[];
  maxVisible?: number;
  shiftUp?: boolean;
}

interface FloatingItem {
  id: string;
  userName: string;
  text: string;
  delayIndex: number;
}

const FADE_OUT_START_MS = 4500;
const VISIBLE_DURATION_MS = 5500;
const STAGGER_MS = 50;

export default function FloatingComments({ comments, maxVisible = 6, shiftUp = false }: FloatingCommentsProps) {
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

      const item: FloatingItem = { id: c.id, userName: c.userName, text: c.text, delayIndex };

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

  const bottomOffset = shiftUp ? 'max(env(safe-area-inset-bottom, 20px), 250px)' : 'max(env(safe-area-inset-bottom, 20px), 120px)';

  return (
    <div
      className="left-3 right-[60px] sm:right-[68px] z-[25] pointer-events-none flex flex-col-reverse gap-1.5"
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
              duration: prefersReducedMotion ? 0.05 : 0.25,
              ease: 'easeOut',
              delay: prefersReducedMotion ? 0 : item.delayIndex * STAGGER_MS / 1000,
            }}
            className="w-fit max-w-[75vw]"
          >
            <div
              className="rounded-full px-3 py-1.5 backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            >
              <span className="text-[13px] font-bold text-white">{item.userName}</span>
              <span className="text-[13px] text-white ml-1">{item.text}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
