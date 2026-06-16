import { useState } from "react";
import { X, RotateCcw, Loader2, Info } from "lucide-react";
import { Modal } from "./SharedUI";
import { fmtDate, fmtTime, generateDates, fmtSlot, fmtISO } from "./StatusBadge";
import type { Booking } from "../booking.types";

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

interface RescheduleModalProps {
  booking: Booking;
  stylistName?: string;
  newDate: string;
  newTime: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

function getServiceName(b: Booking): string {
  if (typeof b.serviceId === "object" && b.serviceId !== null) return (b.serviceId as any).name || "Service";
  return "Service";
}

export default function RescheduleModal({
  booking,
  stylistName,
  newDate,
  newTime,
  onDateChange,
  onTimeChange,
  onConfirm,
  onClose,
  loading,
}: RescheduleModalProps) {
  const serviceName = getServiceName(booking);

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Reschedule</h2>
          <p className="text-xs text-gray-400 mt-0.5">{stylistName} · {serviceName}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <Info size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            Currently: <strong>{fmtDate(new Date(booking.startTime))}</strong> at <strong>{fmtISO(booking.startTime)}</strong>
          </p>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Date</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {generateDates().map((d) => {
              const sel = d === newDate;
              const dt = new Date(d + "T00:00:00");
              return (
                <button key={d} onClick={() => onDateChange(d)}
                  className={`shrink-0 flex flex-col items-center py-2.5 px-3 rounded-xl border min-w-[56px] transition-all ${sel ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"}`}>
                  <span className={`text-[10px] font-semibold uppercase ${sel ? "text-gray-400" : "text-gray-400"}`}>
                    {fmtDate(d) === "Today" ? "Today" : dt.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className={`text-lg font-bold ${sel ? "text-white" : "text-gray-900"}`}>{dt.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Time</p>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((t) => (
              <button key={t} onClick={() => onTimeChange(t)}
                className={`py-2.5 rounded-xl border text-center text-xs font-medium transition-all ${t === newTime ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"}`}>
                {fmtSlot(t)}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onConfirm} disabled={loading || !newDate || !newTime}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${loading || !newDate || !newTime ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800 shadow-md"}`}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Rescheduling…</> : <><RotateCcw size={14} /> Confirm Reschedule</>}
        </button>
      </div>
    </Modal>
  );
}
