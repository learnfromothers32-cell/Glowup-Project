import { useState, useCallback, useEffect } from "react";
import { X, ArrowLeft, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { getAvailableSlots } from "@/api/bookings";
import { useCreateBookingMutation } from "@/domain/booking/booking.hooks";
import type { LiveService } from "@/domain/live/stores/commerceStore";

interface BookingOverlayProps {
  stylistId: string;
  stylistName: string;
  services: LiveService[];
  preSelectedServiceId?: string;
  onClose: () => void;
  onSuccess: () => void;
  className?: string;
}

type BookingPhase = "select-service" | "select-time" | "confirm" | "success";

export function BookingOverlay({
  stylistId,
  stylistName,
  services,
  preSelectedServiceId,
  onClose,
  onSuccess,
  className,
}: BookingOverlayProps) {
  const [phase, setPhase] = useState<BookingPhase>(
    preSelectedServiceId ? "select-time" : "select-service",
  );
  const [selectedService, setSelectedService] = useState<LiveService | null>(
    () => services.find((s) => s._id === preSelectedServiceId) ?? null,
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = useCreateBookingMutation();

  useEffect(() => {
    if (!selectedService || phase !== "select-time") return;
    setLoadingSlots(true);
    setError(null);
    getAvailableSlots({
      stylistId,
      date: selectedDate,
      serviceId: selectedService._id,
    })
      .then((data) => {
        setSlots(data.slots || []);
      })
      .catch(() => {
        setSlots([]);
        setError("Failed to load available times. Please try again.");
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedService, selectedDate, stylistId, phase]);

  const handleSelectService = useCallback((service: LiveService) => {
    setSelectedService(service);
    setPhase("select-time");
    setError(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedService || !selectedSlot) return;
    setError(null);
    try {
      await createBooking.mutateAsync({
        stylistId,
        serviceId: selectedService._id,
        startTime: `${selectedDate}T${selectedSlot}`,
        paymentMethod: "cash",
      });
      setPhase("success");
      onSuccess();
    } catch (err) {
      setError("Booking failed. Please try again.");
    }
  }, [selectedService, selectedSlot, selectedDate, stylistId, createBooking, onSuccess]);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().split("T")[0],
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    };
  });

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-end sm:items-center justify-center", className)}
      role="dialog"
      aria-modal="true"
      aria-label={`Book appointment with ${stylistName}`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-surface-dark-secondary rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/40">
          <div className="flex items-center gap-2">
            {phase === "select-time" && (
              <button
                onClick={() => { setPhase("select-service"); setError(null); }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Go back to service selection"
              >
                <ArrowLeft size={16} className="text-gray-500" aria-hidden="true" />
              </button>
            )}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {phase === "select-service"
                ? "Select Service"
                : phase === "select-time"
                  ? "Pick a Time"
                  : phase === "confirm"
                    ? "Confirm Booking"
                    : "Booking Confirmed!"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close booking"
          >
            <X size={16} className="text-gray-500" aria-hidden="true" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300 text-xs"
            role="alert"
          >
            <AlertCircle size={14} aria-hidden="true" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
              aria-label="Dismiss error"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {phase === "select-service" && (
            <div className="space-y-2" role="listbox" aria-label="Available services">
              {services.map((service) => (
                <button
                  key={service._id}
                  onClick={() => handleSelectService(service)}
                  role="option"
                  aria-selected={selectedService?._id === service._id}
                  className="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-gray-700/40 hover:border-brand-200 dark:hover:border-brand-800/40 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{service.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{service.duration}min · {service.category}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">₦{service.price.toLocaleString()}</p>
                  </div>
                </button>
              ))}
              {services.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">No services available</p>
              )}
            </div>
          )}

          {phase === "select-time" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">Date</label>
                <div className="flex gap-1.5 overflow-x-auto pb-1" role="radiogroup" aria-label="Select date">
                  {dates.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDate(d.value)}
                      role="radio"
                      aria-checked={selectedDate === d.value}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                        selectedDate === d.value
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">Available Times</label>
                {loadingSlots ? (
                  <div className="text-center py-6 text-xs text-gray-400" role="status" aria-label="Loading available times">
                    Loading...
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Select time slot">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => { setSelectedSlot(slot.time); setPhase("confirm"); }}
                        disabled={!slot.available}
                        role="radio"
                        aria-checked={selectedSlot === slot.time}
                        aria-disabled={!slot.available}
                        className={cn(
                          "py-2 rounded-lg text-xs font-semibold transition-all",
                          !slot.available
                            ? "bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                            : selectedSlot === slot.time
                              ? "bg-brand-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20",
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
                {slots.length === 0 && !loadingSlots && !error && (
                  <p className="text-xs text-gray-400 text-center py-4">No available slots for this date</p>
                )}
              </div>
            </div>
          )}

          {phase === "confirm" && selectedService && selectedSlot && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{selectedService.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Stylist</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{stylistName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{selectedDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{selectedSlot}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{selectedService.duration}min</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">₦{selectedService.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {phase === "success" && (
            <div className="text-center py-8" role="status">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 mx-auto mb-4 flex items-center justify-center" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Booked!</h3>
              <p className="text-sm text-gray-500 mt-1">Your appointment with {stylistName} is confirmed</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700/40">
          {phase === "confirm" && (
            <Button
              variant="primary"
              size="md"
              className="w-full"
              loading={createBooking.isPending}
              onClick={handleConfirm}
              aria-label="Confirm booking"
            >
              Confirm Booking
            </Button>
          )}
          {phase === "success" && (
            <Button variant="primary" size="md" className="w-full" onClick={onClose} aria-label="Close booking confirmation">
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
