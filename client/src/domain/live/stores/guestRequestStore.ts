import { create } from "zustand";

export type GuestRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface GuestRequest {
  id: string;
  sessionId: string;
  viewerId: string;
  displayName: string;
  status: GuestRequestStatus;
  reason?: string;
  createdAt: string;
}

export interface GuestRequestState {
  myRequestStatus: GuestRequestStatus | null;
  pendingRequests: GuestRequest[];
  setMyRequestStatus: (status: GuestRequestStatus | null) => void;
  addPendingRequest: (request: GuestRequest) => void;
  removePendingRequest: (requestId: string) => void;
  setPendingRequests: (requests: GuestRequest[]) => void;
  reset: () => void;
}

const initialState = {
  myRequestStatus: null as GuestRequestStatus | null,
  pendingRequests: [] as GuestRequest[],
};

export const useGuestRequestStore = create<GuestRequestState>((set) => ({
  ...initialState,
  setMyRequestStatus: (status) => set({ myRequestStatus: status }),
  addPendingRequest: (request) =>
    set((state) => ({
      pendingRequests: [...state.pendingRequests, request],
    })),
  removePendingRequest: (requestId) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
    })),
  setPendingRequests: (requests) => set({ pendingRequests: requests }),
  reset: () => set(initialState),
}));
