import api from './axios';

export const startLive = async (title?: string, category?: string, privacy?: string) => {
  const { data } = await api.post('/live/start', { title, category, privacy });
  return data.data.session;
};

export const stopLive = async () => {
  const { data } = await api.post('/live/stop');
  return data.data.session;
};

export const getLiveSession = async (stylistId: string) => {
  const { data } = await api.get(`/live/session/${stylistId}`);
  return data.data;
};

export const getLiveMessages = async (sessionId: string, before?: string) => {
  const { data } = await api.get(`/live/messages/${sessionId}`, {
    params: { before }
  });
  return data.data.messages;
};

export const getTrendingStreams = async (category?: string) => {
  const { data } = await api.get('/live/trending', {
    params: { category }
  });
  return data.data.streams;
};

export const getLiveCategories = async () => {
  const { data } = await api.get('/live/categories');
  return data.data.categories;
};

export const getLiveFeed = async (params?: {
  page?: number;
  limit?: number;
  filter?: string;
}) => {
  const { data } = await api.get('/live/feed', { params });
  return data.data;
};

export const getUpcomingSessions = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const { data } = await api.get('/live/upcoming', { params });
  return data.data;
};

export const getPastSessions = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
}) => {
  const { data } = await api.get('/live/past', { params });
  return data.data;
};

export const scheduleLive = async (body: {
  title: string;
  description?: string;
  category?: string;
  scheduledAt: string;
  durationMinutes?: number;
}) => {
  const { data } = await api.post('/live/schedule', body);
  return data.data;
};

export const reportStream = async (sessionId: string, reason: string, details?: string) => {
  const { data } = await api.post('/live/report', { sessionId, reason, details });
  return data;
};

export const reportComment = async (messageId: string, sessionId: string, reason: string) => {
  const { data } = await api.post('/live/report/comment', { messageId, sessionId, reason });
  return data;
};
