import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface GiftOption {
  type: string;
  emoji: string;
  label: string;
  coins: number;
}

interface GiftPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (gift: GiftOption) => void;
}

const GIFT_OPTIONS: GiftOption[] = [
  { type: 'rose', emoji: '\uD83C\uDF39', label: 'Rose', coins: 1 },
  { type: 'star', emoji: '\u2B50', label: 'Star', coins: 5 },
  { type: 'crown', emoji: '\uD83D\uDC51', label: 'Crown', coins: 10 },
  { type: 'diamond', emoji: '\uD83D\uDC8E', label: 'Diamond', coins: 25 },
  { type: 'heart', emoji: '\u2764\uFE0F', label: 'Heart', coins: 5 },
  { type: 'fire', emoji: '\uD83D\uDD25', label: 'Fire', coins: 10 },
];

export { GIFT_OPTIONS };

export default function GiftPickerModal({ open, onClose, onSelect }: GiftPickerModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="gift-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            key="gift-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 inset-x-0 z-[61] rounded-t-3xl px-5 pt-4 pb-8"
            style={{ backgroundColor: '#1a1a1a', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Send a Gift</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center active:scale-90"
                aria-label="Close gift picker"
              >
                <X size={16} className="text-white/70" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {GIFT_OPTIONS.map((gift) => (
                <button
                  key={gift.type}
                  onClick={() => {
                    onSelect(gift);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                >
                  <span className="text-3xl">{gift.emoji}</span>
                  <span className="text-[11px] text-white font-semibold">{gift.label}</span>
                  <span className="text-[10px] text-white/40 font-medium">{gift.coins} coins</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
