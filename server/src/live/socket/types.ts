/**
 * Live Socket Event Types & Validation
 *
 * Typed event definitions for the /live namespace.
 * Zod schemas for server-side validation of client payloads.
 */

import { z } from 'zod';

// ── Socket Role ──

export type SocketRole = 'host' | 'viewer' | 'moderator' | 'admin' | 'guest';

// ── Presence State ──

export interface PresenceEntry {
  userId: string;
  socketId: string;
  role: SocketRole;
  displayName: string;
  joinedAt: number;
  lastHeartbeat: number;
}

// ── Room State (from Redis) ──

export interface LiveRoomState {
  sessionId: string;
  status: 'scheduled' | 'live' | 'paused' | 'ended';
  hostUserId: string;
  viewerCount: number;
  startedAt: number | null;
}

// ── Client → Server Events ──

export interface ClientToServerEvents {
  'live:join': (data: { sessionId: string; role: SocketRole; displayName?: string }) => void;
  'live:leave': (data: { sessionId: string }) => void;
  'live:heartbeat': (data: { sessionId: string }) => void;
  'live:service:pin': (data: { sessionId: string; serviceId: string }) => void;
  'live:service:unpin': (data: { sessionId: string }) => void;
  'live:availability:update': (data: { sessionId: string; availability: LiveAvailability }) => void;
  'live:shelf:toggle': (data: { sessionId: string; visible: boolean }) => void;
  // Moderation
  'live:mod:mute': (data: { sessionId: string; userId: string; reason?: string }) => void;
  'live:mod:unmute': (data: { sessionId: string; userId: string }) => void;
  'live:mod:ban': (data: { sessionId: string; userId: string; reason?: string }) => void;
  'live:mod:unban': (data: { sessionId: string; userId: string }) => void;
  'live:mod:delete': (data: { sessionId: string; messageId: string; reason?: string }) => void;
  'live:mod:report-message': (data: { sessionId: string; messageId: string; reason?: string }) => void;
  'live:mod:report-user': (data: { sessionId: string; userId: string; reason?: string }) => void;
  // Reactions
  'live:reaction:send': (data: { sessionId: string; type: string }) => void;
  // Guest Requests
  'live:guest:request': (data: { sessionId: string; reason?: string }) => void;
  'live:guest:cancel': (data: { sessionId: string }) => void;
  'live:guest:accept': (data: { sessionId: string; requestId: string }) => void;
  'live:guest:reject': (data: { sessionId: string; requestId: string }) => void;
}

// ── Server → Client Events ──

export interface ServerToClientEvents {
  'live:joined': (data: { sessionId: string; presence: PresenceEntry[]; viewerCount: number }) => void;
  'live:left': (data: { sessionId: string }) => void;
  'live:presence': (data: { sessionId: string; action: 'join' | 'leave'; user: PresenceEntry }) => void;
  'live:viewer-count': (data: { sessionId: string; count: number }) => void;
  'live:status': (data: { sessionId: string; status: string }) => void;
  'live:pong': (data: { sessionId: string; timestamp: number }) => void;
  'live:error': (data: { code: string; message: string }) => void;
  'live:host-online': (data: { sessionId: string }) => void;
  'live:host-offline': (data: { sessionId: string }) => void;
  'live:service:pinned': (data: { sessionId: string; serviceId: string; service: PinnedServiceData }) => void;
  'live:service:unpinned': (data: { sessionId: string }) => void;
  'live:availability:updated': (data: { sessionId: string; availability: LiveAvailability }) => void;
  'live:shelf:updated': (data: { sessionId: string; visible: boolean }) => void;
  // Moderation
  'live:mod:user-muted': (data: { sessionId: string; userId: string; mutedBy: string }) => void;
  'live:mod:user-unmuted': (data: { sessionId: string; userId: string }) => void;
  'live:mod:user-banned': (data: { sessionId: string; userId: string; reason?: string }) => void;
  'live:mod:user-unbanned': (data: { sessionId: string; userId: string }) => void;
  'live:mod:message-deleted': (data: { sessionId: string; messageId: string }) => void;
  'live:mod:report-submitted': (data: { sessionId: string; reportId: string }) => void;
  'live:mod:notification': (data: { sessionId: string; type: 'muted' | 'banned' | 'message-removed' | 'report-confirmed'; message: string }) => void;
  // Reactions
  'live:reaction:received': (data: { sessionId: string; type: string; userId: string; counts: Record<string, number> }) => void;
  // Guest Requests
  'live:guest:request-received': (data: { sessionId: string; requestId: string; displayName: string; reason?: string }) => void;
  'live:guest:request-cancelled': (data: { sessionId: string; requestId: string }) => void;
  'live:guest:request-accepted': (data: { sessionId: string; requestId: string }) => void;
  'live:guest:request-rejected': (data: { sessionId: string; requestId: string }) => void;
  'live:guest:request-status': (data: { sessionId: string; status: 'pending' | 'accepted' | 'rejected' | 'cancelled' }) => void;
  // Analytics (host-only)
  'live:analytics:update': (data: { sessionId: string; reactionCounts: Record<string, number>; pendingRequests: number; mutedUsers: number; bannedUsers: number; viewerCount: number }) => void;
}

// ── Commerce Types ──

export type LiveAvailability = 'available' | 'busy' | 'fully-booked' | 'on-break' | 'queue-only';

export interface PinnedServiceData {
  serviceId: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

// ── Zod Schemas for Validation ──

export const joinRoomSchema = z.object({
  sessionId: z.string().min(1).max(100),
  role: z.enum(['host', 'viewer', 'moderator', 'admin', 'guest']),
  displayName: z.string().max(100).optional(),
});

export const leaveRoomSchema = z.object({
  sessionId: z.string().min(1).max(100),
});

export const heartbeatSchema = z.object({
  sessionId: z.string().min(1).max(100),
});

export const pinServiceSchema = z.object({
  sessionId: z.string().min(1).max(100),
  serviceId: z.string().min(1).max(100),
});

export const unpinServiceSchema = z.object({
  sessionId: z.string().min(1).max(100),
});

export const availabilitySchema = z.object({
  sessionId: z.string().min(1).max(100),
  availability: z.enum(['available', 'busy', 'fully-booked', 'on-break', 'queue-only']),
});

export const shelfToggleSchema = z.object({
  sessionId: z.string().min(1).max(100),
  visible: z.boolean(),
});

export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type LeaveRoomInput = z.infer<typeof leaveRoomSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type PinServiceInput = z.infer<typeof pinServiceSchema>;
export type UnpinServiceInput = z.infer<typeof unpinServiceSchema>;
export type AvailabilityUpdateInput = z.infer<typeof availabilitySchema>;
export type ShelfToggleInput = z.infer<typeof shelfToggleSchema>;

// ── Error Codes ──

export const LIVE_ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  USER_BANNED: 'USER_BANNED',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_CLOSED: 'ROOM_CLOSED',
  SESSION_ENDED: 'SESSION_ENDED',
  HOST_OFFLINE: 'HOST_OFFLINE',
  DUPLICATE_JOIN: 'DUPLICATE_JOIN',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  REDIS_UNAVAILABLE: 'REDIS_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SLOW_MODE: 'SLOW_MODE',
} as const;
