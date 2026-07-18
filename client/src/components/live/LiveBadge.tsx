interface LiveBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LiveBadge({ className = '', size = 'md' }: LiveBadgeProps) {
  const sizes = {
    sm: 'px-1.5 py-0.5 text-[9px] gap-1',
    md: 'px-2 py-1 text-[10px] gap-1.5',
    lg: 'px-3 py-1.5 text-xs gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider text-white bg-red-500 rounded-full shadow-lg shadow-red-500/30 ${sizes[size]} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      LIVE
    </span>
  );
}
