import { useCallback, useEffect, useRef } from "react";
import {
  sendChatMessage,
  requestChatHistory,
  onChatMessage,
  offChatMessage,
  onChatAck,
  offChatAck,
  onChatHistory,
  offChatHistory,
  onChatDeleted,
  offChatDeleted,
  onChatPinned,
  offChatPinned,
  onChatError,
  offChatError,
} from "@/services/liveSocket";
import { useChatStore } from "@/domain/live/stores/chatStore";
import { useConnectionStore } from "@/domain/live/stores/connectionStore";
import type { ChatMessage, ChatAckResponse, ChatHistoryResponse } from "@/domain/live/live.types";

export function useLiveChat() {
  const messages = useChatStore((s) => s.messages);
  const pendingMessageIds = useChatStore((s) => s.pendingMessageIds);
  const hasMoreHistory = useChatStore((s) => s.hasMoreHistory);
  const isLoadingHistory = useChatStore((s) => s.isLoadingHistory);
  const historyCursor = useChatStore((s) => s.historyCursor);
  const pinnedMessageId = useChatStore((s) => s.pinnedMessageId);
  const addMessage = useChatStore((s) => s.addMessage);
  const addPendingMessage = useChatStore((s) => s.addPendingMessage);
  const confirmPendingMessage = useChatStore((s) => s.confirmPendingMessage);
  const removePendingMessage = useChatStore((s) => s.removePendingMessage);
  const setHistory = useChatStore((s) => s.setHistory);
  const prependHistory = useChatStore((s) => s.prependHistory);
  const setIsLoadingHistory = useChatStore((s) => s.setIsLoadingHistory);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const pinMessage = useChatStore((s) => s.pinMessage);
  const resetChat = useChatStore((s) => s.reset);

  const sessionId = useConnectionStore((s) => s.sessionId);

  const handleChatMessage = useCallback(
    (msg: ChatMessage) => {
      addMessage(msg);
    },
    [addMessage],
  );

  const handleChatAck = useCallback(
    (ack: ChatAckResponse) => {
      confirmPendingMessage(ack.messageId, ack.serverMessageId);
    },
    [confirmPendingMessage],
  );

  const handleChatHistory = useCallback(
    (data: ChatHistoryResponse) => {
      if (useChatStore.getState().messages.length === 0) {
        setHistory(data.messages, data.hasMore, data.nextCursor);
      } else {
        prependHistory(data.messages, data.hasMore, data.nextCursor);
      }
    },
    [setHistory, prependHistory],
  );

  const handleChatDeleted = useCallback(
    (data: { success: boolean; messageId: string }) => {
      if (data.success) {
        deleteMessage(data.messageId);
      }
    },
    [deleteMessage],
  );

  const handleChatPinned = useCallback(
    (data: { success: boolean; messageId: string }) => {
      if (data.success) {
        pinMessage(data.messageId);
      }
    },
    [pinMessage],
  );

  const handleChatError = useCallback((_data: { code: string; message: string }) => {}, []);

  useEffect(() => {
    onChatMessage(handleChatMessage);
    onChatAck(handleChatAck);
    onChatHistory(handleChatHistory);
    onChatDeleted(handleChatDeleted);
    onChatPinned(handleChatPinned);
    onChatError(handleChatError);

    return () => {
      offChatMessage(handleChatMessage);
      offChatAck(handleChatAck);
      offChatHistory(handleChatHistory);
      offChatDeleted(handleChatDeleted);
      offChatPinned(handleChatPinned);
      offChatError(handleChatError);
    };
  }, [
    handleChatMessage,
    handleChatAck,
    handleChatHistory,
    handleChatDeleted,
    handleChatPinned,
    handleChatError,
  ]);

  const sendMessage = useCallback(
    (content: string, replyTo?: string) => {
      if (!sessionId || !content.trim()) return;
      const messageId = crypto.randomUUID();
      const localMsg: ChatMessage = {
        id: messageId,
        senderId: "local",
        senderName: "",
        content: content.trim(),
        messageId,
        sequenceNumber: Date.now(),
        type: "message",
        replyTo,
        createdAt: new Date().toISOString(),
      };
      addPendingMessage(messageId);
      addMessage(localMsg);
      sendChatMessage(sessionId, content.trim(), messageId, replyTo);
    },
    [sessionId, addPendingMessage, addMessage],
  );

  const loadHistory = useCallback(() => {
    if (!sessionId || !hasMoreHistory || isLoadingHistory) return;
    setIsLoadingHistory(true);
    requestChatHistory(sessionId, historyCursor ?? undefined);
  }, [sessionId, hasMoreHistory, isLoadingHistory, historyCursor, setIsLoadingHistory]);

  return {
    messages,
    pendingMessageIds,
    hasMoreHistory,
    isLoadingHistory,
    pinnedMessageId,
    sendMessage,
    loadHistory,
    resetChat,
  };
}
