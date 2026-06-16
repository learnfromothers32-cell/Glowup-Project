import { useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLiveSocket } from "../../../hooks/useLiveSocket";
import { useLiveStore } from "../store/liveStore";
import * as liveApi from "../../../api/live";
import type { DiscussionMessage } from "../types/live.types";

export function useDiscussion(sessionId: string, hostId?: string) {
  const { connected, on, off, emit } = useLiveSocket(hostId);
  const addMessage = useLiveStore((s) => s.addDiscussionMessage);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["live-messages", sessionId],
    queryFn: () => liveApi.getLiveMessages(sessionId),
    refetchInterval: 15_000,
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!connected) return;

    const handler = (msg: any) => {
      const discussionMsg: DiscussionMessage = {
        id: msg.id || Date.now().toString(),
        sessionId,
        userId: msg.userId,
        userName: msg.userName,
        userImage: msg.userImage,
        message: msg.message,
        replies: [],
        replyCount: 0,
        isPinned: false,
        createdAt: msg.createdAt || new Date().toISOString(),
      };
      addMessage(discussionMsg);
    };

    on("live:new-message", handler);
    return () => off("live:new-message");
  }, [connected, sessionId, on, off, addMessage]);

  const sendDiscussion = useCallback(
    (message: string, parentId?: string) => {
      emit("live:send-message", { stylistId: hostId, message, parentId });
    },
    [emit, hostId],
  );

  return { messages, isLoading, sendDiscussion, connected };
}
