import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

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
          ? "border-gray-900 bg-white shadow-lg shadow-gray-100"
          : completed
            ? "border-gray-200 bg-white"
            : "border-gray-100 bg-gray-50/50"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
            completed
              ? "bg-green-500 text-white"
              : active
                ? "bg-gray-900 text-white"
                : "bg-gray-200 text-gray-500"
          }`}
        >
          {completed ? <Check size={14} strokeWidth={3} /> : number}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${
            active ? "text-gray-900" : completed ? "text-gray-700" : "text-gray-400"
          }`}>
            {title}
          </p>
          {!active && completed && summary ? (
            <p className="text-xs text-gray-500 truncate">{summary}</p>
          ) : active ? (
            <p className="text-xs text-gray-400">{subtitle}</p>
          ) : null}
        </div>

        {completed && !disabled && (
          <button
            className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
            onClick={() => {
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
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
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-gray-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
