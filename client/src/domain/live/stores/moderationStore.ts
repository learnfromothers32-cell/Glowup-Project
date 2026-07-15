import { create } from "zustand";

export interface ModerationState {
  mutedUsers: Set<string>;
  bannedUsers: Set<string>;
  pendingReports: number;
  setMutedUsers: (users: string[]) => void;
  addMutedUser: (userId: string) => void;
  removeMutedUser: (userId: string) => void;
  setBannedUsers: (users: string[]) => void;
  addBannedUser: (userId: string) => void;
  removeBannedUser: (userId: string) => void;
  setPendingReports: (count: number) => void;
  incrementPendingReports: () => void;
  reset: () => void;
}

const initialState = {
  mutedUsers: new Set<string>(),
  bannedUsers: new Set<string>(),
  pendingReports: 0,
};

export const useModerationStore = create<ModerationState>((set) => ({
  ...initialState,
  setMutedUsers: (users) => set({ mutedUsers: new Set(users) }),
  addMutedUser: (userId) =>
    set((state) => {
      const next = new Set(state.mutedUsers);
      next.add(userId);
      return { mutedUsers: next };
    }),
  removeMutedUser: (userId) =>
    set((state) => {
      const next = new Set(state.mutedUsers);
      next.delete(userId);
      return { mutedUsers: next };
    }),
  setBannedUsers: (users) => set({ bannedUsers: new Set(users) }),
  addBannedUser: (userId) =>
    set((state) => {
      const next = new Set(state.bannedUsers);
      next.add(userId);
      return { bannedUsers: next };
    }),
  removeBannedUser: (userId) =>
    set((state) => {
      const next = new Set(state.bannedUsers);
      next.delete(userId);
      return { bannedUsers: next };
    }),
  setPendingReports: (count) => set({ pendingReports: count }),
  incrementPendingReports: () =>
    set((state) => ({ pendingReports: state.pendingReports + 1 })),
  reset: () => set(initialState),
}));
