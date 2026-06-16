import { useState, useRef, useCallback } from "react";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "../../utils/cn";

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  className?: string;
}

export default function BeforeAfterSlider({ before, after, className }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handleStart = () => { dragging.current = true; };
  const handleEnd = () => { dragging.current = false; };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging.current) handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 5));
    if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 5));
  }, []);

  return (
    <div className={cn(className)}>
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 cursor-ew-reselect select-none shadow-inner"
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        role="slider"
        tabIndex={0}
        aria-label="Before after comparison slider"
        aria-valuenow={position}
        onKeyDown={handleKeyDown}
      >
        <img
          src={after}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={before}
            alt="Before"
            className="absolute top-0 left-0 w-full h-full object-cover"
            style={{ width: `${100 / (position / 100)}%`, maxWidth: "none" }}
            draggable={false}
          />
        </div>

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center ring-2 ring-white">
            <ArrowLeftRight size={13} className="text-gray-700" />
          </div>
        </div>

        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-semibold text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">Before</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-semibold text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">After</span>
        </div>
      </div>
    </div>
  );
}
