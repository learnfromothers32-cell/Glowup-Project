import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FloatingReaction } from "../types/live.types";

const REACTION_ICONS: Record<string, string> = {
  heart: "❤️",
  like: "👍",
  fire: "🔥",
  laugh: "😂",
  wow: "😮",
};

const REACTION_COLORS: Record<string, string> = {
  heart: "#FF2C55",
  like: "#1877F2",
  fire: "#FF8C00",
  laugh: "#F7B731",
  wow: "#A855F7",
};

interface Props {
  reactions: FloatingReaction[];
  onAdd?: (reaction: FloatingReaction) => void;
}

function ReactionItem({ reaction, onComplete }: { reaction: FloatingReaction; onComplete: (id: string) => void }) {
  const color = REACTION_COLORS[reaction.type] || "#FF2C55";
  const size = 24 + Math.random() * 16;

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: reaction.x, scale: 0.5, rotate: 0 }}
      animate={{ opacity: 0, y: -250 - Math.random() * 100, scale: 1.2, rotate: Math.random() * 30 - 15 }}
      exit={{ opacity: 0, scale: 0.3 }}
      transition={{ duration: 1.2 + Math.random() * 0.8, ease: "easeOut" }}
      onAnimationComplete={() => onComplete(reaction.id)}
      className="absolute bottom-0 pointer-events-none"
      style={{ left: reaction.x, fontSize: size }}
    >
      <span style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
        {reaction.icon || REACTION_ICONS[reaction.type] || "❤️"}
      </span>
    </motion.div>
  );
}

export function FloatingReactions({ reactions, onAdd }: Props) {
  const [active, setActive] = useState<FloatingReaction[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reactions.length === 0) return;
    const newOnes = reactions.filter(
      (r) => !active.find((a) => a.id === r.id)
    );
    if (newOnes.length > 0) {
      setActive((prev) => [...prev, ...newOnes].slice(-30));
    }
  }, [reactions]);

  const handleComplete = useCallback((id: string) => {
    setActive((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleTap = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !onAdd) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const reaction: FloatingReaction = {
        id: `local-${Date.now()}-${Math.random()}`,
        type: "heart",
        icon: "❤️",
        x: Math.min(Math.max(x, 5), 90),
        createdAt: Date.now(),
      };
      onAdd(reaction);
    },
    [onAdd]
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-10"
    >
      <AnimatePresence>
        {active.map((r) => (
          <ReactionItem key={r.id} reaction={r} onComplete={handleComplete} />
        ))}
      </AnimatePresence>
    </div>
  );
}
