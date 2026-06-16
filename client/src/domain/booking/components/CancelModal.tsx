import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { Modal } from "./SharedUI";
import { fmtDate, fmtTime, initials, fmtISO } from "./StatusBadge";
import type { Booking } from "../booking.types";

function getStylistName(b: Booking): string {
  if (typeof b.stylistId === "object" && b.stylistId !== null) return (b.stylistId as any).name || "Stylist";
  return "Stylist";
}

function getServiceName(b: Booking): string {
  if (typeof b.serviceId === "object" && b.serviceId !== null) return (b.serviceId as any).name || "Service";
  return "Service";
}

interface CancelModalProps {
  booking: Booking;
  stylistImage?: string;
  stylistName?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

export default function CancelModal({
  booking,
  stylistImage,
  stylistName,
  onConfirm,
  onClose,
  loading,
}: CancelModalProps) {
  const name = stylistName || getStylistName(booking);
  const serviceName = getServiceName(booking);
  const price = typeof booking.serviceId === "object" && booking.serviceId !== null
    ? (booking.serviceId as any).price || booking.totalPrice
    : booking.totalPrice;

  return (
    <Modal onClose={onClose}>
      <div className="h-1 bg-gradient-to-r from-red-500 to-red-300" />
      <div className="p-5">
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          Cancel this booking?
        </h3>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 mb-3">
          <div className="flex items-center gap-3">
            {stylistImage ? (
              <img src={stylistImage} alt={name} className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-400">{initials(name)}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">{name}</p>
              <p className="text-xs text-gray-500">{serviceName}</p>
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Calendar size={10} />
                {booking.startTime ? fmtDate(new Date(booking.startTime)) : "—"} at {booking.startTime ? fmtISO(booking.startTime) : "—"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-5">
          <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Late cancellations within 24 hours may incur a fee of ${Math.round((price || 0) * 0.5)}.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              loading
                ? "bg-red-100 text-red-400 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 shadow-sm"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Cancelling…
              </>
            ) : (
              "Yes, cancel"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
