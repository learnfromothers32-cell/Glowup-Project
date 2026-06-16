import { Heart } from "lucide-react";
import { cn } from "../../utils/cn";

interface FavoriteButtonProps {
  favorite: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export default function FavoriteButton({ favorite, onToggle, disabled, className }: FavoriteButtonProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      disabled={disabled}
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
        favorite
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-gray-100 text-gray-400 hover:bg-gray-200",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={14}
        className={cn("transition-all", favorite && "fill-red-500")}
      />
    </button>
  );
}
