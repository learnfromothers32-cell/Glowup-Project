import { motion, useReducedMotion } from 'framer-motion';

interface FloatingEmojiProps {
  id: number;
  emoji: string;
  x: number;
}

export default function FloatingEmoji({ id, emoji, x }: FloatingEmojiProps) {
  const prefersReducedMotion = useReducedMotion();
  const randomX = x + (-8 + Math.random() * 16);
  const randomRotate = -20 + Math.random() * 40;
  const randomScale = 0.9 + Math.random() * 0.5;
  const duration = 2 + Math.random() * 1;

  return (
    <motion.div
      key={id}
      initial={{ opacity: 1, y: 0, scale: 0.3, rotate: 0 }}
      animate={
        prefersReducedMotion
          ? { opacity: [1, 0], y: 0, scale: 1, rotate: 0 }
          : {
              opacity: [1, 1, 0],
              y: -300,
              scale: randomScale,
              rotate: randomRotate,
              x: [0, 12, -10, 14, -6],
            }
      }
      transition={{ duration: prefersReducedMotion ? 0.4 : duration, ease: 'easeOut' }}
      className="absolute bottom-32 pointer-events-none z-50"
      style={{ left: `${randomX}%` }}
    >
      <span className="text-3xl drop-shadow-lg">{emoji}</span>
    </motion.div>
  );
}
