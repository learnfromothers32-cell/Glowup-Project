import { motion } from 'framer-motion';

interface FloatingHeartProps {
  id: number;
  x: number;
}

export default function FloatingHeart({ id, x }: FloatingHeartProps) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ opacity: 0, y: -200, scale: 1.2 }}
      transition={{ duration: 2, ease: 'easeOut' }}
      className="absolute bottom-24 pointer-events-none z-50"
      style={{ left: `${x}%` }}
    >
      <span className="text-3xl drop-shadow-lg">❤️</span>
    </motion.div>
  );
}
