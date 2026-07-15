import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as liveApi from "../../api/live";
import type {
  DiscoverSessionsParams,
  CreateLiveSessionParams,
} from "./live.types";

const LIVE_SESSIONS_KEY = "live-sessions";
const LIVE_SESSION_KEY = (id: string) => [LIVE_SESSIONS_KEY, id];

export function useLiveSessions(params?: DiscoverSessionsParams) {
  return useQuery({
    queryKey: [LIVE_SESSIONS_KEY, params],
    queryFn: () => liveApi.getLiveSessions(params),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useFeaturedSessions(limit?: number) {
  return useQuery({
    queryKey: [LIVE_SESSIONS_KEY, "featured", limit],
    queryFn: () => liveApi.getFeaturedSessions(limit),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useLiveSession(id: string) {
  return useQuery({
    queryKey: LIVE_SESSION_KEY(id),
    queryFn: () => liveApi.getLiveSessionById(id),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useSessionStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: [LIVE_SESSIONS_KEY, id, "status"],
    queryFn: () => liveApi.getSessionStatus(id),
    enabled: enabled && !!id,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

export function useCreateLiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateLiveSessionParams) =>
      liveApi.createLiveSession(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LIVE_SESSIONS_KEY] });
    },
  });
}

export function useStartLiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveApi.startLiveSession(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: LIVE_SESSION_KEY(id) });
      queryClient.invalidateQueries({ queryKey: [LIVE_SESSIONS_KEY] });
    },
  });
}

export function useEndLiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveApi.endLiveSession(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: LIVE_SESSION_KEY(id) });
      queryClient.invalidateQueries({ queryKey: [LIVE_SESSIONS_KEY] });
    },
  });
}

export function useUpdateLiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      params,
    }: {
      id: string;
      params: Partial<CreateLiveSessionParams>;
    }) => liveApi.updateLiveSession(id, params),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: LIVE_SESSION_KEY(id) });
      queryClient.invalidateQueries({ queryKey: [LIVE_SESSIONS_KEY] });
    },
  });
}

export function useDeleteLiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveApi.deleteLiveSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LIVE_SESSIONS_KEY] });
    },
  });
}
