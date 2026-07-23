import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Comment } from '../../hooks/useLiveSession';

interface FloatingCommentsProps {
  comments: Comment[];
  maxVisible?: number;
}

interface FloatingItem {
  id: string;
  userName: string;
  text: string;
}

const VISIBLE_DURATION_MS = 5500;

export default function FloatingComments({ comments, maxVisible = 6 }: FloatingCommentsProps) {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    for (const c of comments) {
      if (c.type !== 'comment') continue;
      if (seenIdsRef.current.has(c.id)) continue;
      seenIdsRef.current.add(c.id);

      const item: FloatingItem = { id: c.id, userName: c.userName, text: c.text };

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

  return (
    <div
      className="absolute bottom-[90px] sm:bottom-[100px] left-3 right-[60px] sm:right-[68px] z-[25] pointer-events-none flex flex-col-reverse gap-1.5"
      aria-live="polite"
      aria-label="Live comments"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, x: -16, scale: 0.95 }
            }
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: -16, scale: 0.95 }
            }
            transition={{ duration: prefersReducedMotion ? 0.05 : 0.25, ease: 'easeOut' }}
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
