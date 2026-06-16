import { useCallback, useRef } from "react";

export type ReactionType = "like" | "heart" | "fire" | "laugh" | "wow";

interface FloatingReaction {
  id: number;
  type: ReactionType;
  x: number;
}

export function useReactions() {
  const counterRef = useRef(0);

  const spawnReaction = useCallback((type: ReactionType, count = 1) => {
    const reactions: FloatingReaction[] = [];
    for (let i = 0; i < count; i++) {
      counterRef.current++;
      reactions.push({
        id: counterRef.current,
        type,
        x: Math.random() * 60 + 20,
      });
    }
    return reactions;
  }, []);

  return { spawnReaction };
}
