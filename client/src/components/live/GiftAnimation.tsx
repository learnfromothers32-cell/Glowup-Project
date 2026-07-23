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

const GIFT_DISPLAY_MS = 2500;

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
    <div className="absolute inset-0 flex items-center justify-center z-[35] pointer-events-none">
      <AnimatePresence mode="wait">
        {gifts.map((g) => (
          <motion.div
            key={g.id}
            initial={
              prefersReducedMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: [1, 1, 0], scale: 1 }
                : {
                    opacity: [0, 1, 1, 1, 0],
                    scale: [0, 1.2, 1, 1, 0.9],
                  }
            }
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.3 }
                : {
                    duration: 2.5,
                    times: [0, 0.12, 0.18, 0.78, 1],
                    ease: 'easeOut',
                  }
            }
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[48px] drop-shadow-lg leading-none">{g.emoji}</span>
            <span className="text-[14px] text-white font-semibold drop-shadow-md">
              {g.senderName} sent a{' '}
              <span style={{ color: '#FE2C55' }} className="font-bold">{g.label}</span>!
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
