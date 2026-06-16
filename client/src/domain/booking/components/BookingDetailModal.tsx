import { X, MapPin, Calendar } from "lucide-react";
import { Modal } from "./SharedUI";
import { StatusBadge, fmtDate, fmtTime, getLocationString, fmtISO, initials } from "./StatusBadge";
import type { Booking } from "../booking.types";

function getClientName(b: Booking): string {
  if (typeof b.clientId === "object" && b.clientId !== null) return (b.clientId as any).name || "Client";
  return "Client";
}

function getStylistName(b: Booking): string {
  if (typeof b.stylistId === "object" && b.stylistId !== null) return (b.stylistId as any).name || "Stylist";
  return "Stylist";
}

function getServiceName(b: Booking): string {
  if (typeof b.serviceId === "object" && b.serviceId !== null) return (b.serviceId as any).name || "Service";
  return "Service";
}

interface BookingDetailModalProps {
  booking: Booking;
  stylistImage?: string;
  clientView?: boolean;
  onClose: () => void;
}

export default function BookingDetailModal({
  booking,
  stylistImage,
  clientView = true,
  onClose,
}: BookingDetailModalProps) {
  const isCancelled = booking.status === "cancelled";
  const name = clientView ? getStylistName(booking) : getClientName(booking);
  const serviceName = getServiceName(booking);
  const dateStr = booking.startTime ? new Date(booking.startTime).toISOString().split("T")[0] : "";
  const location = !clientView && typeof booking.clientId === "object" && booking.clientId !== null
    ? (booking.clientId as any).location
    : typeof booking.stylistId === "object" && booking.stylistId !== null
      ? (booking.stylistId as any).location
      : null;

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Booking Details</h2>
          <p className="text-xs text-gray-400 mt-0.5">{serviceName}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex items-center gap-3">
          {stylistImage ? (
            <img
              src={stylistImage}
              alt={name}
              className={`w-12 h-12 rounded-xl object-cover ring-1 ring-gray-100 ${isCancelled ? "grayscale" : ""}`}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-400">{initials(name)}</span>
            </div>
          )}
          <div>
            <p className={`text-sm font-semibold ${isCancelled ? "text-gray-400 line-through" : "text-gray-900"}`}>
              {name}
            </p>
            <p className="text-xs text-gray-500">
              <StatusBadge status={booking.status} date={dateStr} />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Date</p>
            <p className="text-sm font-semibold text-gray-900">{booking.startTime ? fmtDate(new Date(booking.startTime)) : "—"}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Time</p>
            <p className="text-sm font-semibold text-gray-900">{booking.startTime ? fmtISO(booking.startTime) : "—"}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Status</p>
            <p><StatusBadge status={booking.status} date={dateStr} /></p>
          </div>
          {booking.totalPrice > 0 && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Price</p>
              <p className="text-sm font-semibold text-gray-900">${booking.totalPrice}</p>
            </div>
          )}
        </div>

        {location && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            <p className="text-xs text-gray-600">{getLocationString(location)}</p>
          </div>
        )}

        {booking.notes && (
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Notes</p>
            <p className="text-xs text-gray-600">{booking.notes}</p>
          </div>
        )}

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Booking ID</p>
          <p className="text-xs text-gray-500 font-mono">{booking._id}</p>
        </div>
      </div>
    </Modal>
  );
}
