import { motion, useReducedMotion } from 'framer-motion';

interface FloatingHeartProps {
  id: number;
  x: number;
}

export default function FloatingHeart({ id, x }: FloatingHeartProps) {
  const prefersReducedMotion = useReducedMotion();
  const randomX = x + (-8 + Math.random() * 16);
  const randomRotate = -20 + Math.random() * 40;
  const randomScale = 0.8 + Math.random() * 0.6;
  const duration = 1.8 + Math.random() * 0.8;

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
      className="absolute bottom-[140px] sm:bottom-[160px] pointer-events-none z-50"
      style={{ left: `${randomX}%` }}
    >
      <span className="text-3xl drop-shadow-[0_2px_8px_rgba(239,68,68,0.4)]">❤️</span>
    </motion.div>
  );
}
