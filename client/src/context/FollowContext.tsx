import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import * as favoritesApi from "../api/favorites";

interface FollowContextValue {
  isFollowing: (stylistId: string) => boolean;
  follow: (stylistId: string) => Promise<void>;
  unfollow: (stylistId: string) => Promise<void>;
  syncFromServer: (entries: { stylistId: string; isFollowing: boolean }[]) => void;
  refresh: () => Promise<void>;
}

const FollowContext = createContext<FollowContextValue | null>(null);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const pendingRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const favs = await favoritesApi.getFavorites();
      setFollowing(new Set((favs || []).map((f: any) => f.id || f._id)));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFollowing = useCallback(
    (stylistId: string) => following.has(stylistId),
    [following],
  );

  const follow = useCallback(async (stylistId: string) => {
    if (pendingRef.current.has(stylistId)) return;
    pendingRef.current.add(stylistId);
    setFollowing((prev) => {
      const next = new Set(prev);
      next.add(stylistId);
      return next;
    });
    try {
      await favoritesApi.addFavorite(stylistId);
    } catch {
      setFollowing((prev) => {
        const next = new Set(prev);
        next.delete(stylistId);
        return next;
      });
    } finally {
      pendingRef.current.delete(stylistId);
    }
  }, []);

  const unfollow = useCallback(async (stylistId: string) => {
    if (pendingRef.current.has(stylistId)) return;
    pendingRef.current.add(stylistId);
    setFollowing((prev) => {
      const next = new Set(prev);
      next.delete(stylistId);
      return next;
    });
    try {
      await favoritesApi.removeFavorite(stylistId);
    } catch {
      setFollowing((prev) => {
        const next = new Set(prev);
        next.add(stylistId);
        return next;
      });
    } finally {
      pendingRef.current.delete(stylistId);
    }
  }, []);

  const syncFromServer = useCallback(
    (entries: { stylistId: string; isFollowing: boolean }[]) => {
      setFollowing((prev) => {
        const next = new Set(prev);
        for (const e of entries) {
          if (e.isFollowing) next.add(e.stylistId);
        }
        return next;
      });
    },
    [],
  );

  return (
    <FollowContext.Provider value={{ isFollowing, follow, unfollow, syncFromServer, refresh }}>
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow(): FollowContextValue {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error("useFollow must be used within a FollowProvider");
  return ctx;
}
