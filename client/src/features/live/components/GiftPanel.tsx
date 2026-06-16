import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins } from "lucide-react";
import { GIFT_LIST } from "../types/live.types";
import type { GiftItem } from "../types/live.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (gift: GiftItem) => void;
  balance?: number;
}

export function GiftPanel({ isOpen, onClose, onSendGift, balance = 100 }: Props) {
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);

  const handleSend = () => {
    if (!selectedGift) return;
    onSendGift(selectedGift);
    setSelectedGift(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[300]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[301] rounded-t-2xl overflow-hidden"
            style={{ background: "#1a1a2e" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Coins size={18} className="text-yellow-400" />
                <span className="text-white font-semibold text-sm">Send a Gift</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10">
                  <Coins size={14} className="text-yellow-400" />
                  <span className="text-white text-xs font-medium">{balance}</span>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                  <X size={20} className="text-white/60" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {GIFT_LIST.map((gift) => {
                  const isSelected = selectedGift?.id === gift.id;
                  return (
                    <button
                      key={gift.id}
                      onClick={() => setSelectedGift(isSelected ? null : gift)}
                      className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all active:scale-95"
                      style={{
                        background: isSelected
                          ? `linear-gradient(135deg, ${gift.color}33, ${gift.color}11)`
                          : "rgba(255,255,255,0.05)",
                        border: isSelected ? `1.5px solid ${gift.color}` : "1.5px solid transparent",
                      }}
                    >
                      <span className="text-3xl">{gift.icon}</span>
                      <span className="text-white text-xs font-medium">{gift.name}</span>
                      <div className="flex items-center gap-1">
                        <Coins size={10} className="text-yellow-400" />
                        <span className="text-yellow-400 text-[10px] font-bold">{gift.price}</span>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: gift.color }}
                        >
                          <span className="text-white text-[10px]">✓</span>
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-4 pb-6 pt-2">
              <button
                onClick={handleSend}
                disabled={!selectedGift}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-30"
                style={{
                  background: selectedGift
                    ? `linear-gradient(135deg, ${selectedGift.color}, ${selectedGift.color}cc)`
                    : "rgba(255,255,255,0.1)",
                  color: "white",
                }}
              >
                {selectedGift
                  ? `Send ${selectedGift.icon} ${selectedGift.name} (${selectedGift.price} coins)`
                  : "Select a gift"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
