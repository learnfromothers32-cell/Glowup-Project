import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Smartphone, Wallet, Check, Shield, AlertCircle, ArrowRight, Lock, Receipt, Calendar, Clock, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import Section from "./Section";
import type { PaymentMethod } from "@/domain/booking/booking.types";
import type { ServiceObject, BookingPhase } from "./BookingModal";

const PLATFORM_FEE_PERCENT = 0.13;

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  detail: string;
  icon: typeof CreditCard;
  badge?: string;
  gradient: string;
}[] = [
  { id: "card", label: "Credit / Debit Card", detail: "Visa, Mastercard, Amex", icon: CreditCard, badge: "Popular", gradient: "from-blue-500 to-indigo-500" },
  { id: "mobile-money", label: "Mobile Money", detail: "MTN MoMo · Vodafone Cash · AirtelTigo", icon: Smartphone, badge: "Fast", gradient: "from-yellow-500 to-orange-500" },
  { id: "cash", label: "Cash at Salon", detail: "Pay on arrival after service", icon: Wallet, badge: "", gradient: "from-emerald-500 to-teal-500" },
];

function calcPrice(priceStr: string | undefined) {
  const subtotal = Math.round(parseFloat((priceStr || "0").replace(/[^0-9.]/g, "")) * 100) / 100;
  const fee = Math.round(subtotal * PLATFORM_FEE_PERCENT * 100) / 100;
  return { subtotal, fee, total: subtotal + fee };
}

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  note: string;
  paymentError: string | null;
  phase: BookingPhase;
  selectedService: ServiceObject | null;
  selectedDate: string | null;
  selectedTime: string | null;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  onNoteChange: (n: string) => void;
  onPay: () => void;
  active: boolean;
  disabled: boolean;
}

export default function PaymentStep({
  paymentMethod,
  note,
  paymentError,
  phase,
  selectedService,
  selectedDate,
  selectedTime,
  onPaymentMethodChange,
  onNoteChange,
  onPay,
  active,
  disabled,
}: PaymentStepProps) {
  const [noteId] = useState(() => `note-${Math.random().toString(36).slice(2)}`);
  const price = calcPrice(selectedService?.price);

  const formatSlot = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <Section
      id="section-pay"
      number={4}
      title="Review & Pay"
      subtitle="Almost there!"
      completed={false}
      active={active}
      disabled={disabled}
    >
      <div className="mt-1 space-y-5">
        {/* Order Summary */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700/30 bg-gradient-to-br from-gray-50/80 to-white dark:from-surface-dark-tertiary/60 dark:to-surface-dark-secondary overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/20 flex items-center gap-2">
            <Receipt size={13} className="text-text-muted dark:text-text-dark-muted" />
            <span className="text-[11px] font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider">Order Summary</span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Receipt size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{selectedService?.name || "Service"}</p>
                  {selectedDate && selectedTime && (
                    <p className="text-[11px] text-text-muted dark:text-text-dark-muted flex items-center gap-1 mt-0.5">
                      <Calendar size={9} />
                      {formatDate(selectedDate)}
                      <Clock size={9} className="ml-1" />
                      {formatSlot(selectedTime)}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-text-primary dark:text-text-dark-primary">GH₵ {price.subtotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700/30 mt-3 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted dark:text-text-dark-muted flex items-center gap-1">
                  Platform fee <span className="text-[10px] opacity-60">(13%)</span>
                </span>
                <span className="text-text-secondary dark:text-text-dark-secondary font-medium">GH₵ {price.fee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/30">
                <span className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">Total</span>
                <span className="text-lg font-bold text-text-primary dark:text-text-dark-primary">GH₵ {price.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <p className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider mb-3">
            Payment Method
          </p>
          <div className="space-y-2.5">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = paymentMethod === method.id;
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => onPaymentMethodChange(method.id)}
                  className={`group w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-brand-500 bg-brand-50/80 dark:bg-brand-950/20 shadow-md shadow-brand-500/10"
                      : "border-gray-100 dark:border-gray-700/30 bg-white dark:bg-surface-dark-secondary hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 bg-gradient-to-br ${
                      isSelected ? method.gradient + " text-white shadow-md scale-105" : "from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 text-text-muted dark:text-text-dark-muted group-hover:scale-105"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{method.label}</p>
                      {method.badge && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-brand-500 text-white">{method.badge}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted dark:text-text-dark-muted mt-0.5">{method.detail}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isSelected ? "border-brand-500 bg-brand-500 scale-110" : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div>
          <label htmlFor={noteId} className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary flex items-center gap-1.5 mb-2.5">
            <Edit3 size={11} className="text-text-muted" />
            Note <span className="font-normal text-text-muted dark:text-text-dark-muted">(optional)</span>
          </label>
          <Textarea
            id={noteId}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Any special requests for your stylist?"
            className="resize-none min-h-0 rounded-2xl border-gray-100 dark:border-gray-700/30 focus:border-brand-300 dark:focus:border-brand-700"
          />
          <p className="text-right text-[10px] text-text-muted dark:text-text-dark-muted mt-1.5 font-medium">{note.length}/200</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {paymentError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-400 text-sm"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{paymentError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security badges */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-text-muted dark:text-text-dark-muted bg-gray-50/80 dark:bg-surface-dark-tertiary/50 rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-700/20">
          <span className="flex items-center gap-1.5"><Lock size={11} className="text-green-500" /> 256-bit SSL</span>
          <span className="flex items-center gap-1.5"><Shield size={11} className="text-brand-500" /> Secured by Paystack</span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium"><Check size={11} /> No hidden fees</span>
        </div>

        {/* CTA */}
        <Button
          onClick={onPay}
          disabled={phase === "paying"}
          variant="primary"
          size="lg"
          loading={phase === "paying"}
          className="w-full shadow-lg shadow-brand-500/25 h-12 rounded-2xl text-sm font-bold"
        >
          {phase === "paying" ? (
            "Processing payment…"
          ) : (
            <>
              Pay GH₵ {price.total.toFixed(2)}
              <ArrowRight size={15} />
            </>
          )}
        </Button>
      </div>
    </Section>
  );
}
