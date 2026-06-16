import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HairstyleCard from "./HairstyleCard";
import type { Hairstyle } from "../../api/hairstyles";
import { cn } from "../../utils/cn";

interface HairstyleGridProps {
  hairstyles: Hairstyle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
  className?: string;
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
  { id: "unisex", label: "Unisex" },
];

export default function HairstyleGrid({ hairstyles, selectedId, onSelect, disabled, className }: HairstyleGridProps) {
  const [category, setCategory] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const filtered = useMemo(() => {
    if (category === "all") return hairstyles;
    return hairstyles.filter((h) => h.category === category);
  }, [hairstyles, category]);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons);
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [filtered]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 200;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    const el = scrollRef.current;
    if (!el) return;
    const btn = el.querySelector(`[data-id="${id}"]`);
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all",
              category === cat.id
                ? "bg-black text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 -ml-3"
            aria-label="Scroll left"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center w-full py-8">
              <p className="text-sm text-gray-400">No hairstyles in this category</p>
            </div>
          ) : (
            filtered.map((hairstyle) => (
              <div key={hairstyle._id || hairstyle.id} data-id={hairstyle._id || hairstyle.id}>
                <HairstyleCard
                  hairstyle={hairstyle}
                  selected={(selectedId === hairstyle._id || selectedId === hairstyle.id)}
                  onSelect={handleSelect}
                  disabled={disabled}
                />
              </div>
            ))
          )}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 -mr-3"
            aria-label="Scroll right"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
