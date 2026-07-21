import { motion, useReducedMotion } from 'framer-motion';

interface FloatingHeartProps {
  id: number;
  x: number;
}

export default function FloatingHeart({ id, x: _x }: FloatingHeartProps) {
  const prefersReducedMotion = useReducedMotion();
  const randomX = 75 + Math.random() * 18;
  const randomRotate = -15 + Math.random() * 30;
  const randomScale = 0.8 + Math.random() * 0.6;
  const duration = 1.8 + Math.random() * 0.8;

  return (
    <motion.div
      key={id}
      initial={{ opacity: 1, y: 0, scale: 0.4, rotate: 0 }}
      animate={
        prefersReducedMotion
          ? { opacity: [1, 0], y: 0, scale: 1, rotate: 0 }
          : {
              opacity: [1, 1, 0],
              y: -280,
              scale: randomScale,
              rotate: randomRotate,
              x: [0, 10, -8, 12, -5],
            }
      }
      transition={{ duration: prefersReducedMotion ? 0.4 : duration, ease: 'easeOut' }}
      className="absolute bottom-28 pointer-events-none z-50"
      style={{ left: `${randomX}%` }}
    >
      <span className="text-2xl drop-shadow-lg">❤️</span>
    </motion.div>
  );
}
