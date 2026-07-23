import { Eye } from 'lucide-react';

interface LiveViewerCountProps {
  count: number;
  className?: string;
}

export default function LiveViewerCount({ count, className = '' }: LiveViewerCountProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Eye size={12} className="text-white/70" />
      <span className="text-[12px] text-white font-semibold tabular-nums">{count}</span>
    </div>
  );
}
