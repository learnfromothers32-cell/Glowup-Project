export type LiveCategory =
  | "fitness"
  | "startup"
  | "career"
  | "productivity"
  | "wellness"
  | "business"
  | "financial-literacy"
  | "community";

export const LIVE_CATEGORIES: { key: LiveCategory; label: string }[] = [
  { key: "fitness", label: "Fitness" },
  { key: "startup", label: "Startup" },
  { key: "career", label: "Career" },
  { key: "productivity", label: "Productivity" },
  { key: "wellness", label: "Wellness" },
  { key: "business", label: "Business" },
  { key: "financial-literacy", label: "Financial Literacy" },
  { key: "community", label: "Community" },
];

export interface LiveHost {
  id: string;
  name: string;
  image?: string;
  bio?: string;
  isVerified: boolean;
  isFollowing: boolean;
}

export interface LiveSession {
  id: string;
  hostId: string;
  host: LiveHost;
  title: string;
  description: string;
  category: LiveCategory;
  thumbnail?: string;
  viewerCount: number;
  isLive: boolean;
  startedAt?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  tags: string[];
}

export interface UpcomingSession {
  id: string;
  hostId: string;
  host: LiveHost;
  title: string;
  description: string;
  category: LiveCategory;
  scheduledAt: string;
  durationMinutes: number;
  reminder: boolean;
}

export interface DiscussionMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userImage?: string;
  message: string;
  parentId?: string;
  replies: DiscussionMessage[];
  replyCount: number;
  isPinned: boolean;
  createdAt: string;
}

export interface PastSession {
  id: string;
  hostId: string;
  host: LiveHost;
  title: string;
  description: string;
  category: LiveCategory;
  recordedAt: string;
  durationMinutes: number;
  viewCount: number;
  thumbnail?: string;
  recordingUrl?: string;
}

export interface LiveNotification {
  id: string;
  type: "host-live" | "session-reminder" | "session-change";
  message: string;
  hostName: string;
  hostImage?: string;
  sessionId?: string;
  read: boolean;
  scheduledAt?: string;
  createdAt: string;
}

export interface HostStreamSettings {
  title: string;
  description: string;
  category: LiveCategory;
  isMuted: boolean;
  isVideoOn: boolean;
  commentsEnabled: boolean;
}

export interface StreamQuality {
  label: string;
  value: "auto" | "720p" | "480p" | "360p";
}

export interface GiftItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  animation: "small" | "medium" | "large";
  color: string;
}

export interface GiftTransaction {
  id: string;
  userId: string;
  userName: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  coinAmount: number;
  animation: "small" | "medium" | "large";
}

export const GIFT_LIST: GiftItem[] = [
  { id: "rose", name: "Rose", icon: "🌹", price: 5, animation: "small", color: "#FF6B8A" },
  { id: "heart", name: "Heart", icon: "❤️", price: 10, animation: "small", color: "#FF2C55" },
  { id: "fire", name: "Fire", icon: "🔥", price: 25, animation: "medium", color: "#FF8C00" },
  { id: "diamond", name: "Diamond", icon: "💎", price: 50, animation: "medium", color: "#00BFFF" },
  { id: "crown", name: "Crown", icon: "👑", price: 100, animation: "large", color: "#FFD700" },
  { id: "rocket", name: "Rocket", icon: "🚀", price: 200, animation: "large", color: "#FF4500" },
];

export interface FloatingReaction {
  id: string;
  type: string;
  icon: string;
  x: number;
  createdAt: number;
}
