import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

interface GenerationPreviewProps {
  generatedImage: string | null;
  generating: boolean;
  selectedName?: string;
  className?: string;
}

export default function GenerationPreview({
  generatedImage,
  generating,
  selectedName,
  className,
}: GenerationPreviewProps) {
  return (
    <div className={cn("rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm", className)}>
      <div className="aspect-[4/5] bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center relative">
        {generating ? (
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Loader2 size={32} className="animate-spin text-gray-300 mx-auto mb-3" />
            </motion.div>
            <p className="text-sm text-gray-400 font-medium">Generating preview...</p>
            {selectedName && (
              <p className="text-xs text-gray-300 mt-1">{selectedName}</p>
            )}
          </div>
        ) : generatedImage ? (
          <motion.img
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            src={generatedImage}
            alt="Hairstyle preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center px-8">
            <Sparkles size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">Select a hairstyle</p>
            <p className="text-xs text-gray-300 mt-1">Choose from the styles below</p>
          </div>
        )}
      </div>
    </div>
  );
}
