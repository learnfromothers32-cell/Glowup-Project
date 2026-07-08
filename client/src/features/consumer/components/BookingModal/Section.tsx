import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

interface SectionProps {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  completed: boolean;
  active: boolean;
  disabled: boolean;
  children: React.ReactNode;
  summary?: string;
}

export default function Section({
  id,
  number,
  title,
  subtitle,
  completed,
  active,
  disabled,
  children,
  summary,
}: SectionProps) {
  return (
    <div
      id={id}
      className={`rounded-2xl border transition-all duration-300 ${
        active
          ? "border-brand-200 dark:border-brand-900/60 bg-white dark:bg-surface-dark-secondary shadow-lg shadow-brand-500/5 dark:shadow-black/30"
          : completed
            ? "border-gray-150 dark:border-gray-700/50 bg-white dark:bg-surface-dark-secondary"
            : "border-gray-100/80 dark:border-gray-700/30 bg-gray-50/60 dark:bg-surface-dark-tertiary/40"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
            completed
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/40"
              : active
                ? "bg-brand-500 text-white shadow-sm shadow-brand-200 dark:shadow-brand-900/40"
                : "bg-gray-200 dark:bg-gray-700/70 text-gray-400 dark:text-gray-500"
          }`}
        >
          {completed ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Check size={14} strokeWidth={3} />
            </motion.span>
          ) : (
            <span className="leading-none">{number}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold transition-colors duration-200 ${
              active
                ? "text-text-primary dark:text-text-dark-primary"
                : completed
                  ? "text-text-secondary dark:text-text-dark-secondary"
                  : "text-text-muted dark:text-text-dark-muted"
            }`}
          >
            {title}
          </p>
          {!active && completed && summary ? (
            <p className="text-xs text-text-muted dark:text-text-dark-muted truncate mt-0.5">{summary}</p>
          ) : active ? (
            <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">{subtitle}</p>
          ) : null}
        </div>

        {completed && !disabled && (
          <button
            className="flex items-center gap-1 text-[11px] font-medium text-text-muted dark:text-text-dark-muted hover:text-text-secondary dark:hover:text-text-dark-secondary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/60"
            onClick={() => {
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            <ChevronDown size={12} />
            Edit
          </button>
        )}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 border-t border-gray-100 dark:border-gray-700/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
