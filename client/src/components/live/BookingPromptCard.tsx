import { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BookingPromptCardProps {
  visible: boolean;
  serviceName: string;
  servicePrice: string;
  stylistId: string;
  serviceId?: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export default function BookingPromptCard({
  visible,
  serviceName,
  servicePrice,
  stylistId,
  serviceId,
  onDismiss,
  autoDismissMs = 10000,
}: BookingPromptCardProps) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [visible, autoDismissMs, onDismiss]);

  const handleBook = () => {
    onDismiss();
    if (serviceId) {
      navigate(`/app/stylist/${stylistId}/service/${serviceId}`);
    } else {
      navigate(`/app/stylist/${stylistId}`);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 0, y: 20, scale: 0.95 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 20, scale: 0.95 }
          }
          transition={{ duration: prefersReducedMotion ? 0.05 : 0.3, ease: 'easeOut' }}
          className="absolute bottom-[140px] sm:bottom-[155px] left-3 right-[60px] sm:right-[68px] z-[26]"
        >
          <div className="rounded-2xl p-3.5 backdrop-blur-xl border border-white/10 shadow-2xl" style={{ backgroundColor: 'rgba(20,20,20,0.92)' }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <ShoppingBag size={16} className="text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-white/50 font-medium uppercase tracking-wider">Showcased</p>
                  <p className="text-[13px] font-bold text-white truncate">{serviceName}</p>
                  <p className="text-[12px] text-white/60 font-semibold">{servicePrice}</p>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 active:scale-90"
                aria-label="Dismiss"
              >
                <X size={12} className="text-white/50" />
              </button>
            </div>

            <button
              onClick={handleBook}
              className="w-full mt-3 py-2.5 rounded-xl text-white text-[13px] font-bold active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#FE2C55' }}
            >
              Book Now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
