import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: { bg: string; text: string; border?: string; icon: string };
}

export function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color.bg}`}>
          <Icon size={16} className={color.icon} />
        </div>
        <span className={`text-2xl font-bold tabular-nums ${color.text}`}>
          {value}
        </span>
      </div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}

export function Modal({ children, onClose, wide }: ModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col ${
          wide ? "w-full max-w-lg" : "w-full max-w-md"
        }`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  sub: string;
}

export function EmptyState({ icon: Icon, title, sub }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <Icon size={28} className="text-gray-300" />
      </div>
      <p className="text-base font-semibold text-gray-700 mb-1">{title}</p>
      <p className="text-sm text-gray-400 max-w-[280px] leading-relaxed">{sub}</p>
    </div>
  );
}

export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 z-[400] pointer-events-none flex items-center gap-2 px-5 py-3 rounded-full bg-gray-900 text-white text-sm font-medium shadow-xl whitespace-nowrap transition-all duration-300 dark:bg-white dark:text-gray-900 ${
        visible
          ? "-translate-x-1/2 translate-y-0 opacity-100"
          : "-translate-x-1/2 translate-y-5 opacity-0"
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" className="shrink-0">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {message}
    </div>
  );
}

interface FilterPillsProps {
  filters: { key: string; label: string }[];
  active: string;
  onChange: (f: string) => void;
  counts: Record<string, number>;
}

export function FilterPills({ filters, active, onChange, counts }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {filters.map(({ key, label }) => {
        const on = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              on
                ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {label}
            {(counts[key] ?? 0) > 0 && (
              <span className={`text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full inline-flex items-center justify-center ${
                on ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
