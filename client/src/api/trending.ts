import api from "./axios";

export interface TrendingTransformation {
  id: string;
  stylistId: string;
  stylistName: string;
  stylistImage?: string;
  category?: string;
  location?: string;
  rating: number;
  before?: string;
  after: string;
  caption?: string;
  serviceName?: string;
  mediaType?: 'image' | 'video';
  likes: number;
  views: number;
  shares: number;
  commentCount: number;
  bookmarks: number;
  score?: number;
  createdAt: string;
  isFollowing?: boolean;
}

export interface TrendingCursor {
  score: number;
  id: string;
}

export interface TrendingResult {
  items: TrendingTransformation[];
  nextCursor?: TrendingCursor;
}

export interface CommentData {
  id: string;
  transformationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
}

export interface CommentsResult {
  comments: CommentData[];
  total: number;
  page: number;
  totalPages: number;
}

export const getTrendingTransformations = async (
  limit = 20,
  cursor?: TrendingCursor,
): Promise<TrendingResult> => {
  const params: Record<string, string | number> = { limit };
  if (cursor) {
    params.cursorScore = cursor.score;
    params.cursorId = cursor.id;
  }
  const { data } = await api.get<{ data: TrendingResult }>("/trending", { params });
  return data.data;
};

export const trackTrendingEvent = async (
  postId: string,
  event: "view" | "like" | "unlike" | "share" | "comment" | "bookmark",
): Promise<void> => {
  await api.post("/trending/track", { postId, event });
};

export const getComments = async (
  transformationId: string,
  page = 1,
  limit = 20,
): Promise<CommentsResult> => {
  const { data } = await api.get<{ data: CommentsResult }>(
    `/comments/${transformationId}`,
    { params: { page, limit } },
  );
  return data.data;
};

export const createComment = async (
  transformationId: string,
  stylistId: string,
  text: string,
  userName: string,
  userAvatar?: string,
): Promise<CommentData> => {
  const { data } = await api.post<{ data: CommentData }>("/comments", {
    transformationId,
    stylistId,
    text,
    userName,
    userAvatar,
  });
  return data.data;
};

export const toggleCommentLike = async (
  commentId: string,
): Promise<{ likes: number; isLiked: boolean }> => {
  const { data } = await api.post<{ data: { likes: number; isLiked: boolean } }>(
    `/comments/${commentId}/like`,
  );
  return data.data;
};

export const reportTransformation = async (
  postId: string,
  stylistId: string,
  reason: string,
): Promise<void> => {
  await api.post("/trending/report", { postId, stylistId, reason });
};

export interface UserEngagements {
  likes: string[];
  bookmarks: string[];
}

export const getUserEngagements = async (): Promise<UserEngagements> => {
  const { data } = await api.get<{ data: UserEngagements }>("/engagements");
  return data.data;
};

export const toggleEngagement = async (
  transformationId: string,
  type: "like" | "bookmark",
  active: boolean,
): Promise<void> => {
  await api.post("/engagements/toggle", { transformationId, type, active });
};
