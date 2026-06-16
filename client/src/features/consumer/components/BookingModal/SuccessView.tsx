import { motion } from "framer-motion";
import { CheckCircle2, Check, Copy, ExternalLink } from "lucide-react";
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
    <div className="p-6 max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="mx-auto w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center mb-6"
      >
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
        >
          <CheckCircle2 size={40} className="text-green-500" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-6"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-1">You're all set!</h3>
        <p className="text-sm text-gray-400">Confirmation sent to your email and phone</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden mb-6"
      >
        <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            {stylist.image && (
              <img src={stylist.image} alt={stylist.name} className="w-12 h-12 rounded-xl object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{stylist.name}</p>
              <p className="text-xs text-gray-400">{selectedService?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Queue</p>
              <p className="text-3xl font-black text-gray-900">#{bookingResponse.queuePosition}</p>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 my-4" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Date</p>
              <p className="text-sm font-semibold text-gray-900">{formatShortDate(bookingResponse.date)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Time</p>
              <p className="text-sm font-semibold text-gray-900">{bookingResponse.time}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Wait</p>
              <p className="text-sm font-semibold text-gray-900">~{bookingResponse.estimatedWaitMinutes} min</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Booking ID</p>
              <p className="text-xs font-mono text-gray-600">{bookingResponse.bookingId.slice(0, 12)}…</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <button
          onClick={onCopyId}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-600" />
              Booking ID Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy Booking ID
            </>
          )}
        </button>

        <button
          onClick={onDone}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 shadow-md transition-all active:scale-[0.98]"
        >
          Done
          <Check size={14} />
        </button>

        <button
          onClick={onViewBookings}
          className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors py-2 flex items-center justify-center gap-1"
        >
          View my bookings
          <ExternalLink size={10} />
        </button>
      </motion.div>
    </div>
  );
}
