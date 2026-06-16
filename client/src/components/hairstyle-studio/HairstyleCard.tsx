import { cn } from "../../utils/cn";
import type { Hairstyle } from "../../api/hairstyles";

interface HairstyleCardProps {
  hairstyle: Hairstyle;
  selected: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

const COLOR_PALETTE = [
  "bg-gradient-to-br from-amber-200 to-amber-300",
  "bg-gradient-to-br from-stone-200 to-stone-300",
  "bg-gradient-to-br from-yellow-200 to-yellow-300",
  "bg-gradient-to-br from-gray-300 to-gray-400",
  "bg-gradient-to-br from-orange-200 to-orange-300",
  "bg-gradient-to-br from-warmGray-200 to-warmGray-300",
  "bg-gradient-to-br from-rose-200 to-rose-300",
  "bg-gradient-to-br from-blueGray-200 to-blueGray-300",
  "bg-gradient-to-br from-amber-100 to-amber-200",
  "bg-gradient-to-br from-stone-300 to-stone-400",
  "bg-gradient-to-br from-yellow-100 to-yellow-200",
  "bg-gradient-to-br from-gray-200 to-gray-300",
  "bg-gradient-to-br from-orange-100 to-orange-200",
  "bg-gradient-to-br from-warmGray-300 to-warmGray-400",
  "bg-gradient-to-br from-rose-100 to-rose-200",
  "bg-gradient-to-br from-blueGray-300 to-blueGray-400",
  "bg-gradient-to-br from-amber-300 to-amber-400",
  "bg-gradient-to-br from-stone-100 to-stone-200",
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

export default function HairstyleCard({ hairstyle, selected, onSelect, disabled }: HairstyleCardProps) {
  return (
    <button
      onClick={() => onSelect(hairstyle._id || hairstyle.id)}
      disabled={disabled}
      className={cn(
        "group flex flex-col items-center gap-1.5 transition-all",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "w-16 h-16 rounded-full overflow-hidden transition-all duration-200 ring-2 ring-offset-2",
          selected
            ? "ring-black ring-offset-2 scale-105 shadow-md"
            : "ring-transparent ring-offset-0 hover:ring-gray-300 hover:ring-offset-1 hover:shadow-sm",
        )}
      >
        <div className={cn(
          "w-full h-full flex items-center justify-center",
          getColor(hairstyle.name)
        )}>
          <span className="text-lg font-bold text-white/80 drop-shadow-sm">
            {hairstyle.name.charAt(0)}
          </span>
        </div>
      </div>
      <span className={cn(
        "text-[11px] font-medium truncate max-w-[72px] text-center leading-tight transition-colors",
        selected ? "text-black font-semibold" : "text-gray-500 group-hover:text-gray-700"
      )}>
        {hairstyle.name}
      </span>
    </button>
  );
}


