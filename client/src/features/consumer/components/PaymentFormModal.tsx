import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, AlertCircle, Loader2, CheckCircle2, Smartphone, CreditCard, Wifi, Building, Check, ShieldCheck } from "lucide-react";
import { openPaystackPopup, tokenizeCard, formatAmount } from "@/services/paystack";
import { verifyPayment, chargeCard } from "@/api/payments";

interface PriceBreakdown {
  subtotal: number;
  platformFee: number;
  total: number;
}

interface PaymentFormModalProps {
  method: "card" | "mobile-money";
  amount: string;
  email: string;
  paystackKey: string;
  onProcessPayment: () => Promise<{ bookingId: string; reference: string; accessCode: string | null }>;
  onCreateBooking?: () => Promise<string>;
  onPaymentVerified: (bookingId: string) => void;
  onClose: () => void;
}

type FlowState = "form" | "processing" | "paystack" | "verifying" | "success" | "error";

const NETWORKS = [
  { id: "mtn" as const, label: "MTN MoMo", prefix: "024", prefix2: "025", color: "bg-yellow-400", textColor: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
  { id: "vodafone" as const, label: "Vodafone Cash", prefix: "020", prefix2: "050", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200" },
  { id: "airteltigo" as const, label: "AirtelTigo Money", prefix: "027", prefix2: "026", color: "bg-red-600", textColor: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200" },
];

function detectNetwork(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  for (const net of NETWORKS) {
    if (cleaned.startsWith(net.prefix) || cleaned.startsWith(net.prefix2) || cleaned.startsWith(net.prefix.slice(1)) || cleaned.startsWith(net.prefix2.slice(1))) {
      return net;
    }
  }
  return null;
}

function formatPhone(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 9);
  if (digits.length > 6) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  if (digits.length > 3) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return digits;
}

function calcBreakdown(priceStr: string): PriceBreakdown {
  const subtotal = Math.round(parseFloat(priceStr.replace(/[^0-9.]/g, "")) * 100) / 100;
  const platformFee = Math.round(subtotal * 0.13 * 100) / 100;
  const total = subtotal + platformFee;
  return { subtotal, platformFee, total };
}

function detectCardType(number: string): { brand: string; color: string; badge: string; pattern: RegExp } | null {
  const cleaned = number.replace(/\D/g, "");
  const cards = [
    { brand: "Visa", color: "text-blue-700 bg-blue-50 border-blue-200", pattern: /^4/ },
    { brand: "Mastercard", color: "text-orange-700 bg-orange-50 border-orange-200", pattern: /^5[1-5]|^2[2-7]/ },
    { brand: "Amex", color: "text-cyan-700 bg-cyan-50 border-cyan-200", pattern: /^3[47]/ },
  ];
  return cards.find((c) => c.pattern.test(cleaned)) || null;
}

function luhnCheck(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 4) groups.push(digits.slice(i, i + 4));
  return groups.join("  ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return digits;
}

export default function PaymentFormModal({
  method,
  amount,
  email,
  paystackKey,
  onProcessPayment,
  onCreateBooking,
  onPaymentVerified,
  onClose,
}: PaymentFormModalProps) {
  const [flow, setFlow] = useState<FlowState>("form");
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string>("");

  const [mobile, setMobile] = useState({ network: "mtn" as "mtn" | "vodafone" | "airteltigo", phone: "" });
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const breakdown = calcBreakdown(amount);
  const detectedNetwork = detectNetwork(mobile.phone);
  const phoneRef = useRef<HTMLInputElement>(null);
  const cardNumberRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (method === "card") {
      cardNumberRef.current?.focus();
    } else {
      phoneRef.current?.focus();
    }
  }, [method]);

  useEffect(() => {
    if (detectedNetwork && method === "mobile-money") {
      setMobile((prev) => ({ ...prev, network: detectedNetwork.id }));
    }
  }, [detectedNetwork, method]);

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFieldErrors({});
    setError(null);
  }, [mobile.phone, mobile.network, card.name, card.number, card.expiry, card.cvv, method]);

  function validateCardField(field: string): string {
    if (field === "name" && !card.name.trim()) return "Enter cardholder name";
    if (field === "number") {
      const digits = card.number.replace(/\D/g, "");
      if (digits.length < 13) return "Card number too short";
      if (!luhnCheck(card.number)) return "Invalid card number";
    }
    if (field === "expiry") {
      const d = card.expiry.replace(/\D/g, "");
      if (d.length !== 4) return "Enter MM / YY";
      const mm = parseInt(d.slice(0, 2));
      const yy = parseInt(d.slice(2));
      const now = new Date();
      const cy = now.getFullYear() % 100;
      const cm = now.getMonth() + 1;
      if (mm < 1 || mm > 12) return "Invalid month";
      if (yy < cy || (yy === cy && mm < cm)) return "Card has expired";
    }
    if (field === "cvv" && card.cvv.length < 3) return "Enter valid CVV";
    return "";
  }

  function handleCardBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateCardField(field);
    setFieldErrors((prev) => (err ? { ...prev, [field]: err } : { ...prev, [field]: "" }));
  }

  function isValidCard(): boolean {
    const e: Record<string, string> = {};
    ["name", "number", "expiry", "cvv"].forEach((f) => {
      const err = validateCardField(f);
      if (err) e[f] = err;
    });
    setFieldErrors(e);
    setTouched({ name: true, number: true, expiry: true, cvv: true });
    return Object.keys(e).length === 0;
  }

  function isCardValid(): boolean {
    return card.name.trim().length >= 2 &&
      card.number.replace(/\D/g, "").length >= 13 &&
      card.expiry.replace(/\D/g, "").length === 4 &&
      card.cvv.length >= 3;
  }

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (method === "mobile-money") {
      const digits = mobile.phone.replace(/\D/g, "");
      if (digits.length < 9) e.phone = "Enter a valid 9-digit phone number";
      if (!detectedNetwork) e.phone = "Could not detect network. Enter a Ghanaian phone number";
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }, [method, mobile.phone, detectedNetwork]);

  const handlePayWithPaystack = useCallback(async () => {
    setFlow("processing");
    setError(null);
    try {
      const result = await onProcessPayment();
      setBookingId(result.bookingId);

      if (!paystackKey) {
        // Dev mode — simulate payment success
        await new Promise((r) => setTimeout(r, 1500));
        onPaymentVerified(result.bookingId);
        return;
      }

      setFlow("paystack");
      const transaction = await openPaystackPopup({
        email,
        amount: Math.round(breakdown.total * 100),
        reference: result.reference,
        accessCode: result.accessCode,
        publicKey: paystackKey,
        currency: "GHS",
        channels: method === "mobile-money" ? ["mobile_money"] : undefined,
      });

      setFlow("verifying");
      await verifyPayment(transaction.reference);
      setFlow("success");
      onPaymentVerified(result.bookingId);
    } catch (err: any) {
      if (err?.message === "Payment cancelled by user") {
        setFlow("form");
        return;
      }
      setFlow("error");
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Payment failed. Please try again.",
      );
    }
  }, [onProcessPayment, paystackKey, email, breakdown.total, method, onPaymentVerified]);

  const handlePayWithCard = useCallback(async () => {
    setFlow("processing");
    setError(null);
    try {
      if (!onCreateBooking) throw new Error("Booking creation is not available");

      const bookingId = await onCreateBooking();
      setBookingId(bookingId);

      if (!paystackKey) {
        await new Promise((r) => setTimeout(r, 1500));
        onPaymentVerified(bookingId);
        return;
      }

      const digits = card.number.replace(/\D/g, "");
      const expiryDigits = card.expiry.replace(/\D/g, "");
      const tokenResult = await tokenizeCard({
        publicKey: paystackKey,
        cardNumber: digits,
        cvv: card.cvv,
        expiryMonth: expiryDigits.slice(0, 2),
        expiryYear: expiryDigits.slice(2),
      });

      setFlow("verifying");
      await chargeCard({
        bookingId,
        token: tokenResult.token,
        cardInfo: {
          last4: tokenResult.last4,
          brand: tokenResult.brand,
          expMonth: tokenResult.expMonth,
          expYear: tokenResult.expYear,
        },
      });

      setFlow("success");
      onPaymentVerified(bookingId);
    } catch (err: any) {
      setFlow("error");
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Card payment failed. Please try again.",
      );
    }
  }, [card, paystackKey, onCreateBooking, onPaymentVerified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "mobile-money") {
      if (!validate()) return;
      await handlePayWithPaystack();
    } else {
      if (!isValidCard()) return;
      await handlePayWithCard();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={flow === "form" ? onClose : undefined} />

      <motion.div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 260 }}
      >
        <AnimatePresence mode="popLayout">
          {flow === "form" && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.15 }}>
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${method === "card" ? "bg-gray-900" : "bg-purple-700"}`}>
                    {method === "card" ? <CreditCard size={18} /> : <Smartphone size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{method === "card" ? "Card Payment" : "Mobile Money"}</h3>
                    <p className="text-xs text-gray-400">Complete your booking payment</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors" aria-label="Close">
                  <X size={16} />
                </button>
              </div>

              {/* ── Price breakdown ── */}
              <div className="mx-5 mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Service fee</span>
                    <span className="text-gray-900 font-medium">GH₵ {breakdown.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Platform fee <span className="text-[10px] text-gray-400">(13%)</span></span>
                    <span className="text-gray-900 font-medium">GH₵ {breakdown.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Total</span>
                    <span className="text-base font-bold text-gray-900">GH₵ {breakdown.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {!paystackKey && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                    <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">Paystack key not configured — <code className="text-[10px] bg-amber-100 px-1 py-0.5 rounded">VITE_PAYSTACK_PUBLIC_KEY</code> missing in environment. Payment will be simulated for testing.</p>
                  </div>
                )}

                {method === "card" ? (
                  <>
                    {/* ── Security badges ── */}
                    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#6B46C1]/5 to-transparent border border-[#6B46C1]/10">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#6B46C1] uppercase tracking-wider">
                        <ShieldCheck size={12} /> 100% Secure
                      </span>
                      <span className="w-px h-3 bg-[#6B46C1]/20" />
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                        <Lock size={11} /> SSL Encrypted
                      </span>
                      <span className="w-px h-3 bg-gray-200" />
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                        <Check size={11} /> PCI-DSS
                      </span>
                    </div>

                    {/* ── Card number ── */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Card Number</label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
                          {detectCardType(card.number) ? (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${detectCardType(card.number)!.color}`}>
                              {detectCardType(card.number)!.brand}
                            </span>
                          ) : (
                            <CreditCard size={16} className="text-gray-300" />
                          )}
                        </div>
                        <input
                          ref={cardNumberRef}
                          value={card.number}
                          onChange={(e) => setCard((p) => ({ ...p, number: formatCardNumber(e.target.value) }))}
                          onBlur={() => handleCardBlur("number")}
                          placeholder="0000  0000  0000  0000"
                          inputMode="numeric"
                          maxLength={22}
                          className={`w-full h-12 border-2 rounded-xl pl-[4.5rem] pr-3.5 text-sm font-mono tracking-wider text-gray-900 placeholder:text-gray-300 outline-none transition-all bg-white ${
                            fieldErrors.number ? "border-red-300 focus:border-red-500 ring-4 ring-red-50" : "border-gray-200 hover:border-gray-300 focus:border-[#6B46C1] focus:ring-[3px] focus:ring-[#6B46C1]/10"
                          }`}
                        />
                      </div>
                      {fieldErrors.number && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.number}</p>}
                    </div>

                    {/* ── Cardholder name ── */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Cardholder Name</label>
                      <input
                        value={card.name}
                        onChange={(e) => setCard((p) => ({ ...p, name: e.target.value }))}
                        onBlur={() => handleCardBlur("name")}
                        placeholder="Name on card"
                        className={`w-full h-12 border-2 rounded-xl px-3.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-all bg-white ${
                          fieldErrors.name ? "border-red-300 focus:border-red-500 ring-4 ring-red-50" : "border-gray-200 hover:border-gray-300 focus:border-[#6B46C1] focus:ring-[3px] focus:ring-[#6B46C1]/10"
                        }`}
                      />
                      {fieldErrors.name && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.name}</p>}
                    </div>

                    {/* ── Expiry & CVV row ── */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Expiry Date</label>
                        <input
                          value={card.expiry}
                          onChange={(e) => setCard((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                          onBlur={() => handleCardBlur("expiry")}
                          placeholder="MM / YY"
                          inputMode="numeric"
                          maxLength={7}
                          className={`w-full h-12 border-2 rounded-xl px-3.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-all bg-white ${
                            fieldErrors.expiry ? "border-red-300 focus:border-red-500 ring-4 ring-red-50" : "border-gray-200 hover:border-gray-300 focus:border-[#6B46C1] focus:ring-[3px] focus:ring-[#6B46C1]/10"
                          }`}
                        />
                        {fieldErrors.expiry && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.expiry}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">CVV</label>
                        <div className="relative">
                          <input
                            value={card.cvv}
                            onChange={(e) => setCard((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                            onBlur={() => handleCardBlur("cvv")}
                            placeholder="123"
                            inputMode="numeric"
                            maxLength={4}
                            className={`w-full h-12 border-2 rounded-xl px-3.5 pr-10 text-sm font-mono text-gray-900 placeholder:text-gray-300 outline-none transition-all bg-white ${
                              fieldErrors.cvv ? "border-red-300 focus:border-red-500 ring-4 ring-red-50" : "border-gray-200 hover:border-gray-300 focus:border-[#6B46C1] focus:ring-[3px] focus:ring-[#6B46C1]/10"
                            }`}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                            <Lock size={14} />
                          </div>
                        </div>
                        {fieldErrors.cvv && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.cvv}</p>}
                      </div>
                    </div>

                    {/* ── Live card preview ── */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 text-white shadow-inner">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-5 rounded bg-gradient-to-br from-amber-300 to-amber-500 opacity-80" />
                          <div className="w-8 h-5 rounded bg-gradient-to-br from-red-400 to-red-600 opacity-60 -ml-2.5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {detectCardType(card.number) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                              {detectCardType(card.number)!.brand}
                            </span>
                          )}
                          <ShieldCheck size={13} className="opacity-40" />
                        </div>
                      </div>
                      <p className="text-base font-mono tracking-[4px] opacity-85 min-h-[1.25rem]">
                        {card.number || <span className="opacity-40">••••  ••••  ••••  ••••</span>}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                        <div>
                          <p className="text-[8px] uppercase tracking-widest opacity-40 mb-0.5">Cardholder</p>
                          <p className="text-[11px] font-medium tracking-wide opacity-80">
                            {card.name || <span className="opacity-40">Your Name</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] uppercase tracking-widest opacity-40 mb-0.5">Expires</p>
                          <p className="text-[11px] font-mono tracking-wider opacity-80">
                            {card.expiry || <span className="opacity-40">MM/YY</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Terms ── */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#6B46C1] focus:ring-[#6B46C1] focus:ring-offset-0"
                      />
                      <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                        I agree to the <button type="button" className="text-[#6B46C1] underline font-medium hover:text-[#553C9A] transition-colors">Terms of Service</button> and authorize <strong>GH₵ {breakdown.total.toFixed(2)}</strong>
                      </span>
                    </label>

                    {/* ── Pay button ── */}
                    <button
                      type="submit"
                      disabled={!isCardValid() || !acceptedTerms}
                      className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none bg-[#6B46C1] text-white hover:bg-[#553C9A] shadow-lg shadow-[#6B46C1]/25 hover:shadow-[#6B46C1]/30"
                    >
                      <Lock size={14} />
                      {!acceptedTerms ? "Accept terms to continue" : !isCardValid() ? "Fill in card details" : `PAY GHS ${breakdown.total.toFixed(2)}`}
                    </button>
                  </>
                ) : (
                  <>
                    {/* ── Network auto-detect ── */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Mobile Number</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold bg-white pr-2 border-r border-gray-200">+233</span>
                        <input
                          ref={phoneRef}
                          type="tel"
                          inputMode="numeric"
                          placeholder="024 000 0000"
                          value={formatPhone(mobile.phone)}
                          onChange={(e) => setMobile((p) => ({ ...p, phone: e.target.value }))}
                          className={`w-full border-2 rounded-xl pl-16 pr-3.5 py-3.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-all font-mono tracking-wider bg-white ${fieldErrors.phone ? "border-red-300 focus:border-red-500 ring-4 ring-red-50" : "border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5"}`}
                        />
                      </div>
                      {fieldErrors.phone && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.phone}</p>}
                    </div>

                    {/* ── Network badge ── */}
                    {detectedNetwork && (
                      <div className={`flex items-center gap-2.5 p-3 rounded-xl ${detectedNetwork.bgColor} border ${detectedNetwork.borderColor}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${detectedNetwork.color} shrink-0`} />
                        <div>
                          <p className={`text-xs font-semibold ${detectedNetwork.textColor}`}>{detectedNetwork.label}</p>
                          <p className="text-[11px] text-gray-500">Network detected from phone number</p>
                        </div>
                      </div>
                    )}

                    {!detectedNetwork && mobile.phone.length >= 3 && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                        <Building size={14} className="text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-500">Choose your network below or enter a Ghanaian number starting with 024, 027, 054, 020, 050, 055, or 059</p>
                      </div>
                    )}

                    {/* ── Network selector ── */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Or select network</label>
                      <div className="grid grid-cols-3 gap-2">
                        {NETWORKS.map((net) => {
                          const selected = mobile.network === net.id;
                          return (
                            <button key={net.id} type="button" onClick={() => setMobile((p) => ({ ...p, network: net.id }))}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${selected ? `${net.bgColor} ${net.borderColor}` : "border-gray-100 hover:border-gray-300 bg-white"}`}>
                              <div className={`w-3 h-3 rounded-full ${net.color}`} />
                              <span className={`text-[10px] font-semibold ${selected ? net.textColor : "text-gray-600"} text-center leading-tight`}>{net.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <Wifi size={14} className="text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-700">You'll receive a prompt on your phone to confirm the payment of GH₵ {breakdown.total.toFixed(2)}</p>
                    </div>

                    <button type="submit" disabled={!mobile.phone}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20">
                      <Lock size={13} />
                      {!mobile.phone ? "Enter phone number" : `Pay GH₵ ${breakdown.total.toFixed(2)}`}
                    </button>
                  </>
                )}

                <div className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-gray-50 border border-gray-100">
                  <Lock size={11} className="text-gray-400 shrink-0" />
                  <span className="text-[11px] text-gray-500 font-medium">256-bit SSL encrypted · Secured by Paystack</span>
                </div>
              </form>
            </motion.div>
          )}

          {flow === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-20 px-6 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-inner">
                <Loader2 size={36} className="animate-spin text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-1">Preparing Payment</p>
              <p className="text-sm text-gray-400">Please wait while we set up your payment…</p>
              <div className="mt-6 flex justify-center gap-1">
                {[0, 0.2, 0.4].map((d, i) => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: d }} />
                ))}
              </div>
            </motion.div>
          )}

          {flow === "paystack" && (
            <motion.div key="paystack" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-20 px-6 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-6 shadow-inner">
                <Smartphone size={36} className="text-blue-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-1">Complete Payment</p>
              <p className="text-sm text-gray-400">Follow the instructions in the Paystack popup to complete your {method === "card" ? "card" : "mobile money"} payment</p>
              <div className="mt-6 flex justify-center gap-1">
                {[0, 0.2, 0.4].map((d, i) => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: d }} />
                ))}
              </div>
            </motion.div>
          )}

          {flow === "verifying" && (
            <motion.div key="verifying" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-20 px-6 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center mb-6 shadow-inner">
                <Loader2 size={36} className="animate-spin text-emerald-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-1">Verifying Payment</p>
              <p className="text-sm text-gray-400">Confirming your transaction with the payment provider…</p>
            </motion.div>
          )}

          {flow === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-20 px-6 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-green-200">
                <CheckCircle2 size={36} className="text-white" strokeWidth={2} />
              </motion.div>
              <p className="text-lg font-semibold text-gray-900 mb-1">Payment Successful</p>
              <p className="text-sm text-gray-400 mb-2">Your booking has been confirmed</p>
              {bookingId && (
                <p className="text-xs font-mono text-gray-300 bg-gray-50 inline-block px-3 py-1 rounded-full">Ref: {bookingId.slice(-8).toUpperCase()}</p>
              )}
            </motion.div>
          )}

          {flow === "error" && (
            <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-6 space-y-5">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0"><AlertCircle size={16} className="text-red-500" /></div>
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-0.5">Payment Failed</p>
                  <p className="text-xs text-red-600">{error || "Something went wrong. Please try again."}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFlow("form"); setError(null); setFieldErrors({}); }} className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all">Try Again</button>
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
