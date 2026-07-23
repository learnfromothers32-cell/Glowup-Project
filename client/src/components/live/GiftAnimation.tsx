import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface GiftData {
  id: number;
  emoji: string;
  label: string;
  senderName: string;
}

interface GiftAnimationProps {
  gifts: GiftData[];
}

const GIFT_DISPLAY_MS = 3000;

export function useGiftQueue() {
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const addGift = (emoji: string, label: string, senderName: string) => {
    const id = ++idRef.current;
    const gift: GiftData = { id, emoji, label, senderName };
    setGifts((prev) => [...prev.slice(-2), gift]);

    const timer = setTimeout(() => {
      timersRef.current.delete(id);
      setGifts((prev) => prev.filter((g) => g.id !== id));
    }, GIFT_DISPLAY_MS);
    timersRef.current.set(id, timer);
  };

  useEffect(() => {
    return () => {
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();
    };
  }, []);

  return { gifts, addGift };
}

export default function GiftAnimation({ gifts }: GiftAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence>
        {gifts.map((g) => (
          <motion.div
            key={g.id}
            initial={
              prefersReducedMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.3, y: 30 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: [1, 1, 0], scale: 1, y: 0 }
                : { opacity: [0, 1, 1, 0], scale: [0.3, 1.2, 1, 0.9], y: [30, -10, -20, -30] }
            }
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              duration: prefersReducedMotion ? 0.3 : 2.5,
              ease: 'easeOut',
            }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-5xl drop-shadow-lg">{g.emoji}</span>
            <span className="text-[11px] text-white/90 font-semibold bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-0.5">
              {g.senderName} sent {g.label}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
