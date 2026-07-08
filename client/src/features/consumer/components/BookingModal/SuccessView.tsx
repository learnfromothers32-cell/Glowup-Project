import { motion } from "framer-motion";
import { CheckCircle2, Check, Copy, ExternalLink, Calendar, Clock, LayoutList, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Stylist } from "@/domain/stylist/stylist.types";
import type { ServiceObject } from "./BookingModal";

interface SuccessViewProps {
  stylist: Stylist;
  bookingResponse: {
    bookingId: string;
    stylistName: string;
    date: string;
    time: string;
    queuePosition: number;
    estimatedWaitMinutes: number;
  };
  selectedService: ServiceObject | null;
  copied: boolean;
  onCopyId: () => void;
  onDone: () => void;
  onViewBookings: () => void;
  formatShortDate: (dateStr: string) => string;
}

function fmtTime12h(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function SuccessView({
  stylist,
  bookingResponse,
  selectedService,
  copied,
  onCopyId,
  onDone,
  onViewBookings,
  formatShortDate,
}: SuccessViewProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 max-w-lg mx-auto">
      {/* Checkmark animation */}
      <motion.div variants={item} className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
          className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-200/50 dark:shadow-emerald-900/40 mb-4"
        >
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
          >
            <CheckCircle2 size={48} className="text-white" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        <h3 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary mb-1">You're all set!</h3>
        <p className="text-sm text-text-muted dark:text-text-dark-muted max-w-xs mx-auto">
          Awaiting stylist confirmation — we'll notify you
        </p>
      </motion.div>

      {/* Booking card */}
      <motion.div variants={item} className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-purple-500/5 dark:from-brand-500/10 dark:to-purple-500/10 rounded-2xl" />
        <div className="relative bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/30 rounded-2xl overflow-hidden shadow-lg shadow-gray-100/50 dark:shadow-black/20">
          <div className="h-1.5 bg-gradient-to-r from-brand-400 via-purple-400 to-brand-500" />
          <div className="p-5">
            {/* Stylist + Queue */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 ring-2 ring-white dark:ring-gray-800 shadow-sm shrink-0">
                {stylist.image ? (
                  <img src={stylist.image} alt={stylist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">✂️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary dark:text-text-dark-primary truncate">{stylist.name}</p>
                <p className="text-xs text-text-muted dark:text-text-dark-muted truncate">{selectedService?.name}</p>
              </div>
              <div className="text-center shrink-0">
                <p className="text-[9px] text-text-muted dark:text-text-dark-muted uppercase tracking-widest font-semibold mb-0.5">Queue</p>
                <div className="flex items-baseline justify-center gap-px">
                  <span className="text-[9px] font-bold text-text-muted dark:text-text-dark-muted">#</span>
                  <span className="text-3xl font-black text-text-primary dark:text-text-dark-primary tabular-nums">{bookingResponse.queuePosition}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-100 dark:border-gray-700/30 my-4" />

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-3">
              {[
                { icon: Calendar, label: "Date", value: formatShortDate(bookingResponse.date) },
                { icon: Clock, label: "Time", value: fmtTime12h(bookingResponse.time) },
                { icon: LayoutList, label: "Wait", value: `~${bookingResponse.estimatedWaitMinutes} min` },
                { icon: Sparkles, label: "Booking ID", value: bookingResponse.bookingId.slice(0, 10) + "…", mono: true },
              ].map(({ icon: Icon, label, value, mono }) => (
                <div key={label}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={10} className="text-text-muted dark:text-text-dark-muted" />
                    <p className="text-[9px] text-text-muted dark:text-text-dark-muted uppercase tracking-widest font-semibold">
                      {label}
                    </p>
                  </div>
                  <p className={`text-sm font-bold text-text-primary dark:text-text-dark-primary ${mono ? "font-mono" : ""}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={item} className="space-y-2.5">
        <Button onClick={onDone} variant="primary" size="lg" className="w-full shadow-lg shadow-brand-500/25 h-12 rounded-2xl text-sm font-bold">
          Done
          <ArrowRight size={15} />
        </Button>

        <Button onClick={onCopyId} variant="secondary" className="w-full h-11 rounded-2xl text-sm font-semibold">
          {copied ? (
            <>
              <Check size={14} className="text-emerald-500" />
              Booking ID Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy Booking ID
            </>
          )}
        </Button>

        <Button onClick={onViewBookings} variant="ghost-gray" size="sm" className="w-full h-10 rounded-2xl text-xs">
          View my bookings
          <ExternalLink size={10} />
        </Button>
      </motion.div>
    </motion.div>
  );
}
