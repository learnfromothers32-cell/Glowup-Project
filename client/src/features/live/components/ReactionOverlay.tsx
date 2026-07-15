import { useEffect } from "react";
import { cn } from "@/utils/cn";
import { useReactionStore } from "@/domain/live/stores/reactionStore";
import type { ReactionType } from "@/domain/live/stores/reactionStore";
import { onReactionReceived, offReactionReceived } from "@/services/liveSocket";

const REACTION_EMOJIS: Record<ReactionType, string> = {
  love: "❤️",
  fire: "🔥",
  clap: "👏",
  wow: "😍",
  glow: "✨",
};

interface ReactionOverlayProps {
  sessionId: string;
  isHost?: boolean;
  className?: string;
}

export function ReactionOverlay({ sessionId, className }: ReactionOverlayProps) {
  const { activeReactions } = useReactionStore();

  useEffect(() => {
    const handleReaction = (data: { type: ReactionType; userId: string }) => {
      useReactionStore.getState().addReaction(data.type, data.userId);
    };

    onReactionReceived(handleReaction);
    return () => offReactionReceived(handleReaction);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-30 overflow-hidden",
        className
      )}
      role="region"
      aria-label="Live reactions"
      aria-live="polite"
    >
      {activeReactions.map((reaction) => (
        <span
          key={reaction.id}
          className={cn(
            "absolute text-3xl animate-float-up select-none",
            "motion-reduce:animate-none motion-reduce:opacity-0"
          )}
          style={{
            left: `${reaction.x}%`,
            bottom: "80px",
            animationDuration: "3s",
          }}
          aria-hidden="true"
        >
          {REACTION_EMOJIS[reaction.type]}
        </span>
      ))}
    </div>
  );
}

interface ReactionBarProps {
  onSend: (type: ReactionType) => void;
  disabled?: boolean;
  className?: string;
}

export function ReactionBar({ onSend, disabled, className }: ReactionBarProps) {
  const canSend = useReactionStore((s) => s.canSendReaction);

  const handleClick = (type: ReactionType) => {
    if (!canSend()) return;
    onSend(type);
  };

  return (
    <div
      className={cn("flex gap-1", className)}
      role="toolbar"
      aria-label="Send reaction"
    >
      {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((type) => (
        <button
          key={type}
          onClick={() => handleClick(type)}
          disabled={disabled || !canSend()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-white/10 transition-colors text-lg",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-purple-500"
          )}
          aria-label={`Send ${type} reaction`}
          title={type}
        >
          {REACTION_EMOJIS[type]}
        </button>
      ))}
    </div>
  );
}
