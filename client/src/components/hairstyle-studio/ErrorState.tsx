import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "../../utils/cn";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
        <AlertTriangle size={20} className="text-red-400" />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">Something went wrong</p>
      <p className="text-xs text-gray-400 text-center max-w-xs mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:opacity-90 transition-all"
        >
          <RefreshCw size={12} />
          Try again
        </button>
      )}
    </div>
  );
}
