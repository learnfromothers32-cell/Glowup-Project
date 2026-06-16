import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "../../utils/cn";
import type { FaceAnalysis } from "../../api/hairstyles";

interface FaceAnalysisCardProps {
  analysis: FaceAnalysis | null;
  loading: boolean;
  error?: string | null;
  className?: string;
}

const SHAPE_LABELS: Record<string, string> = {
  oval: "Oval",
  round: "Round",
  square: "Square",
  heart: "Heart",
  diamond: "Diamond",
  oblong: "Oblong",
};

export default function FaceAnalysisCard({ analysis, loading, error, className }: FaceAnalysisCardProps) {
  return (
    <div className={cn("rounded-xl border bg-white p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-gray-400" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Face Analysis</p>
      </div>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2.5 py-2"
        >
          <Loader2 size={14} className="animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Analyzing face...</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-2.5 py-2"
        >
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <span className="text-sm text-red-500">{error}</span>
        </motion.div>
      )}

      {analysis && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 py-1">
            <CheckCircle2 size={14} className="text-green-500 shrink-0" />
            <span className="text-sm font-medium text-gray-800">
              Face detected
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-lg p-2.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Face Shape</p>
              <p className="text-sm font-semibold text-gray-800">
                {SHAPE_LABELS[analysis.faceShape] || analysis.faceShape}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Confidence</p>
              <p className="text-sm font-semibold text-gray-800">
                {Math.round(analysis.confidence * 100)}%
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
