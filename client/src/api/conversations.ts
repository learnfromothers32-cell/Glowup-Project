import api from "./axios";
import { getSocketUrl } from "../services/socket";

export const getMyConversations = async () => {
  const { data } = await api.get("/conversations");
  return data.data.conversations;
};

export const getConversationMessages = async (id: string) => {
  const { data } = await api.get(`/conversations/${id}/messages`);
  return data.data;
};

export const sendMessage = async (id: string, content: string) => {
  const { data } = await api.post(`/conversations/${id}/messages`, { content });
  return data.data.message;
};

export const createConversation = async (payload: {
  clientId?: string;
  stylistId?: string;
  bookingId?: string;
  subject?: string;
}) => {
  const { data } = await api.post("/conversations", payload);
  return data.data.conversation;
};

export const archiveConversation = async (id: string) => {
  const { data } = await api.patch(`/conversations/${id}/archive`);
  return data;
};

export const getSocketConversationUrl = () => {
  return getSocketUrl("conversations");
};

export const getUnreadConversationsCount = async () => {
  const { data } = await api.get("/conversations/unread-count");
  return data.data.unreadCount as number;
};
