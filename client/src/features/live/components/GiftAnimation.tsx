import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GiftAnim {
  id: string;
  userName: string;
  giftName: string;
  giftIcon: string;
  animation: "small" | "medium" | "large";
  color: string;
}

interface Props {
  gifts: GiftAnim[];
  onComplete: (id: string) => void;
}

function SmallGift({ gift, onDone }: { gift: GiftAnim; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: "-50%", scale: 0.5 }}
      animate={{ opacity: 1, y: -20, x: "-50%", scale: 1 }}
      exit={{ opacity: 0, y: -80, scale: 0.8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onAnimationComplete={onDone}
      className="fixed bottom-32 left-1/2 z-[302] pointer-events-none"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md" style={{ background: "rgba(0,0,0,0.6)" }}>
        <motion.span
          className="text-2xl"
          animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {gift.giftIcon}
        </motion.span>
        <span className="text-white text-sm font-medium">{gift.userName}</span>
        <span className="text-white/60 text-xs">sent</span>
        <span className="text-white text-sm font-bold">{gift.giftName}</span>
      </div>
    </motion.div>
  );
}

function MediumGift({ gift, onDone }: { gift: GiftAnim; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={onDone}
      className="fixed inset-0 z-[302] flex items-center justify-center pointer-events-none"
    >
      <motion.div
        className="flex flex-col items-center gap-3"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${gift.color}44 0%, transparent 70%)`,
              filter: "blur(20px)",
            }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.span
            className="text-6xl relative"
            animate={{ rotate: [0, -15, 15, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {gift.giftIcon}
          </motion.span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md" style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <span className="text-white text-sm font-medium">{gift.userName}</span>
          <span className="text-white/60 text-xs">sent</span>
          <span className="text-white text-sm font-bold">{gift.giftName}</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function LargeGift({ gift, onDone }: { gift: GiftAnim; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={onDone}
      className="fixed inset-0 z-[302] flex items-center justify-center pointer-events-none"
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${gift.color}33 0%, ${gift.color}11 40%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="flex flex-col items-center gap-4 relative"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
      >
        <motion.span
          className="text-8xl"
          animate={{ y: [0, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {gift.giftIcon}
        </motion.span>
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-white text-lg font-bold">{gift.userName}</span>
          </div>
          <motion.div
            className="flex items-center gap-2 px-6 py-2 rounded-full"
            style={{ background: gift.color, boxShadow: `0 0 30px ${gift.color}66` }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <span className="text-2xl">{gift.giftIcon}</span>
            <span className="text-white font-bold text-lg">{gift.giftName}</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function GiftAnimation({ gifts, onComplete }: Props) {
  const [visible, setVisible] = useState<GiftAnim[]>([]);

  useEffect(() => {
    if (gifts.length === 0) return;
    const newGifts = gifts.filter((g) => !visible.find((v) => v.id === g.id));
    if (newGifts.length > 0) {
      setVisible((prev) => [...prev, ...newGifts].slice(-5));
      newGifts.forEach((gift) => {
        const duration = gift.animation === "large" ? 3000 : gift.animation === "medium" ? 2000 : 1500;
        setTimeout(() => {
          onComplete(gift.id);
        }, duration);
      });
    }
  }, [gifts]);

  useEffect(() => {
    setVisible((prev) => prev.filter((g) => gifts.find((ng) => ng.id === g.id)));
  }, [gifts]);

  return (
    <AnimatePresence>
      {visible.map((gift) => (
        gift.animation === "large" ? (
          <LargeGift key={gift.id} gift={gift} onDone={() => onComplete(gift.id)} />
        ) : gift.animation === "medium" ? (
          <MediumGift key={gift.id} gift={gift} onDone={() => onComplete(gift.id)} />
        ) : (
          <SmallGift key={gift.id} gift={gift} onDone={() => onComplete(gift.id)} />
        )
      ))}
    </AnimatePresence>
  );
}
