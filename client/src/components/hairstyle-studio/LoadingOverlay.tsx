import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
  className?: string;
}

export default function LoadingOverlay({ loading, message = "Loading...", className }: LoadingOverlayProps) {
  if (!loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center",
        className
      )}
    >
      <div className="text-center">
        <Loader2 size={24} className="animate-spin text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </motion.div>
  );
}
