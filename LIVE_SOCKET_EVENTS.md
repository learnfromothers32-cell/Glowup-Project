# LIVE_SOCKET_EVENTS.md

> **GlowUp Live — Socket Event Contracts**  
> Phase 2 — Architecture Design  
> Phase 3C — Infrastructure Implementation  
> Phase 3F — Commerce Events  
> Phase 3H — Safety, Engagement & Validation  
> Date: July 15, 2026

---

## 1. Overview

All live streaming real-time communication uses a dedicated `/live` Socket.IO namespace. This namespace is completely isolated from the existing `/queue` and `/conversations` namespaces.

**Connection:** `io('/live', { auth: { token: <JWT> } })`

**Authentication:** JWT Bearer token in `socket.handshake.auth.token`. Required for all events. The `socket.user` object contains `{ id: string, role: UserRole }`.

**Rooms:**
- `live:{sessionId}` — All participants in a live session (host + viewers + mods)
- `user:{userId}` — Individual user room for targeted messages (kicked, banned notifications)

### Phase 3C Implementation Status

| Event | Status | Notes |
|---|---|---|
| `live:join` | ✅ Implemented | Infrastructure-only, no chat |
| `live:leave` | ✅ Implemented | |
| `live:heartbeat` | ✅ Implemented | |
| `live:pong` | ✅ Implemented | Server → Client |
| `live:joined` | ✅ Implemented | Server → Client |
| `live:left` | ✅ Implemented | Server → Client |
| `live:presence` | ✅ Implemented | Server → Client |
| `live:viewer-count` | ✅ Implemented | Server → Client |
| `live:host-online` | ✅ Implemented | Server → Client |

### Phase 3D — Chat Backend

| Event | Direction | Status | Notes |
|---|---|---|---|
| `live:chat:send` | Client → Server | ✅ Implemented | Sends chat message with idempotency, spam, slow mode |
| `live:chat:ack` | Server → Client | ✅ Implemented | Acknowledgement with server sequenceNumber |
| `live:chat:message` | Broadcast | ✅ Implemented | Cross-instance via ChatBroadcaster (Redis Pub/Sub) |
| `live:chat:history` | Client → Server | ✅ Implemented | Cursor-based pagination |
| `live:chat:history` | Server → Client | ✅ Implemented | Paginated message list |
| `live:chat:delete` | Client → Server | ✅ Implemented | Soft-delete with permission check |
| `live:chat:deleted` | Broadcast | ✅ Implemented | Notifies all clients |
| `live:chat:pin` | Client → Server | ✅ Implemented | Host/mod only |
| `live:chat:pinned` | Broadcast | ✅ Implemented | Notifies all clients |
| `live:chat:error` | Server → Client | ✅ Implemented | Slow mode, moderation errors |
| `live:host-offline` | ✅ Implemented | Server → Client |
| `live:error` | ✅ Implemented | Server → Client |
| `live:status` | ✅ Implemented | Server → Client |
| `live:start` | ⏳ Phase 3D+ | Host starts stream |
| `live:end` | ⏳ Phase 3D+ | Host ends stream |
| `live:pause` | ⏳ Phase 3D+ | Host pauses stream |
| `live:resume` | ⏳ Phase 3D+ | Host resumes stream |
| `live:chat:send` | ⏳ Phase 3D | Chat system |
| `live:chat:message` | ⏳ Phase 3D | Chat system |
| `live:gift:send` | ⏳ Phase 3G | Gift system |
| `live:reaction` | ⏳ Phase 3G | Reactions |

### Phase 3F — Commerce Events

| Event | Direction | Status | Notes |
|---|---|---|---|
| `live:service:pin` | Client → Server | ✅ Implemented | Host only, broadcasts to room |
| `live:service:pinned` | Server → Client | ✅ Implemented | Broadcast to all in room |
| `live:service:unpin` | Client → Server | ✅ Implemented | Host only, broadcasts to room |
| `live:service:unpinned` | Server → Client | ✅ Implemented | Broadcast to all in room |
| `live:availability:update` | Client → Server | ✅ Implemented | Host only, broadcasts to room |
| `live:availability:updated` | Server → Client | ✅ Implemented | Broadcast to all in room |
| `live:shelf:toggle` | Client → Server | ✅ Implemented | Host only, broadcasts to room |
| `live:shelf:updated` | Server → Client | ✅ Implemented | Broadcast to all in room |

### Redis Keys (Phase 3C + 3C.5)

| Key Pattern | Type | Purpose |
|---|---|---|
| `live:presence:{sessionId}` | Hash | Socket → PresenceEntry JSON |
| `live:heartbeat:{sessionId}:{userId}` | String | Last heartbeat timestamp |
| `live:viewers:{sessionId}` | String (int) | Current viewer count |
| `live:peak:{sessionId}` | String (int) | Peak viewer count |
| `live:broadcast:{sessionId}` | Pub/Sub channel | Cross-instance event delivery |
| `ratelimit:*` | Sorted Set | Rate limiting windows |

---

## 2. Event Catalog

### 2.1 Session Lifecycle Events

#### `live:start` — Host starts a live stream

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (stylist only) |
| **Payload** | `{ sessionId: string, title?: string, category?: string }` |
| **Validation** | sessionId: ObjectId format. title: optional, max 200 chars. category: optional, max 50 chars |
| **Server Action** | Verify stylist owns session. Set status to `live`. Create LiveKit room. Generate host token. |
| **Acknowledgement** | `{ success: true, data: { roomName: string, token: string, session: LiveSession } }` |
| **Broadcast** | `live:host:started` to all `user:{userId}` rooms of users following this stylist |
| **Error** | `{ success: false, message: string }` — "Session not found", "Not authorized", "Already live" |
| **Retry** | Client should not auto-retry. Show error to host. |

#### `live:end` — Host ends a live stream

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string }` |
| **Validation** | sessionId: ObjectId format |
| **Server Action** | Set status to `ended`. Record `endedAt`. Calculate `durationMs`. Trigger replay worker. Disconnect all viewers. |
| **Acknowledgement** | `{ success: true }` |
| **Broadcast** | `live:host:ended` to `live:{sessionId}` room. All viewers receive disconnect signal. |
| **Error** | `{ success: false, message: "Not authorized" }` |
| **Retry** | No auto-retry. |

#### `live:pause` — Host pauses the stream

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string }` |
| **Validation** | sessionId: ObjectId format |
| **Server Action** | Set status to `paused`. Record `pausedAt`. |
| **Acknowledgement** | `{ success: true }` |
| **Broadcast** | `live:status` to `live:{sessionId}` — `{ status: "paused" }` |
| **Error** | `{ success: false, message: "Not authorized" }` |

#### `live:resume` — Host resumes the stream

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string }` |
| **Validation** | sessionId: ObjectId format |
| **Server Action** | Set status to `live`. Clear `pausedAt`. Update `durationMs` with paused time. |
| **Acknowledgement** | `{ success: true }` |
| **Broadcast** | `live:status` to `live:{sessionId}` — `{ status: "live" }` |
| **Error** | `{ success: false, message: "Not authorized" }` |

---

### 2.2 Viewer Events

#### `live:join` — Viewer joins a live session

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required |
| **Payload** | `{ sessionId: string }` |
| **Validation** | sessionId: ObjectId format |
| **Server Action** | 1. Verify session status is `live` or `paused`. 2. Check user not banned. 3. Check `followersOnly` — if true, verify follow relationship. 4. Check `maxViewers`. 5. Join Socket.IO room `live:{sessionId}`. 6. Increment `viewerCount`. 7. Add to Redis viewer set. 8. Load last 50 chat messages. |
| **Acknowledgement** | `{ success: true, data: { session: LiveSession, chatHistory: LiveChatMessage[], viewers: Viewer[] } }` |
| **Broadcast** | `live:viewer:join` to `live:{sessionId}` — `{ userId, name, avatar }` |
| **Error** | `{ success: false, message: "Session not available" / "You are banned" / "Followers only" / "Room full" }` |
| **Retry** | Auto-reconnect up to 5 times with exponential backoff (1s, 2s, 4s, 8s, 16s). |

#### `live:leave` — Viewer leaves a live session

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required |
| **Payload** | `{ sessionId: string }` |
| **Validation** | sessionId: ObjectId format |
| **Server Action** | Leave Socket.IO room. Decrement `viewerCount`. Remove from Redis viewer set. Track watch duration for analytics. |
| **Acknowledgement** | `{ success: true }` |
| **Broadcast** | `live:viewer:leave` to `live:{sessionId}` — `{ userId }` |
| **Error** | None (always succeeds, even if not in room) |

#### `live:reconnect` — Viewer reconnects after disconnect

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required |
| **Payload** | `{ sessionId: string }` |
| **Validation** | sessionId: ObjectId format |
| **Server Action** | Same as `live:join` but: don't increment `viewerCount` (already counted). Don't broadcast join (rejoin). Load chat history from last seen timestamp. |
| **Acknowledgement** | `{ success: true, data: { session, chatHistory, viewers, missedMessages } }` |
| **Error** | `{ success: false, message: "Session ended" }` |

---

### 2.3 Chat Events (Phase 3D — Implemented)

#### `live:chat:send` — Send a chat message

| | |
|---|---|
| **Status** | ✅ Implemented |
| **Direction** | Client → Server |
| **Auth** | Required |
| **Payload** | `{ sessionId: string, content: string, messageId: string, replyTo?: string, attachments?: ChatAttachment[] }` |
| **Validation** | sessionId: ObjectId. content: 1-500 chars. messageId: client-generated UUID (idempotency key). |
| **Server Action** | 1. Validate content length. 2. Idempotency check (messageId). 3. Verify session exists, is live/paused, chat enabled. 4. Spam check (max 5 msg/10s per user, duplicate detection, blank detection). 5. Run moderation hooks (profanity, shadow ban, approval). 6. Persist with server-assigned sequenceNumber. 7. Broadcast via ChatBroadcaster. 8. Increment session chatMessageCount. |
| **Acknowledgement** | `live:chat:ack` → `{ success: true, messageId, serverMessageId, sequenceNumber }` |
| **Broadcast** | `live:chat:message` via Redis Pub/Sub → `{ message: { id, senderId, senderName, content, sequenceNumber, type, createdAt } }` |
| **Error** | `live:chat:error` → `{ code: "SLOW_MODE" / "RATE_LIMITED", message }` |
| **Rate Limit** | Via middleware pipeline (LiveRateLimiter) |

#### `live:chat:history` — Load chat history (paginated)

| | |
|---|---|
| **Status** | ✅ Implemented |
| **Direction** | Client → Server |
| **Auth** | Required |
| **Payload** | `{ sessionId: string, cursor?: string, limit?: number }` |
| **Validation** | sessionId: ObjectId. cursor: ISO date string. limit: 1-100, default 50. |
| **Server Action** | Query non-deleted messages before cursor (if provided). Return in chronological order. |
| **Response** | `live:chat:history` → `{ sessionId, messages: Message[], hasMore, nextCursor }` |
| **Error** | `live:error` → `{ code: "ROOM_NOT_FOUND", message }` if not in room |

#### `live:chat:delete` — Delete a message

| | |
|---|---|
| **Status** | ✅ Implemented |
| **Direction** | Client → Server |
| **Auth** | Required (host/mod/admin can delete any; users can delete own) |
| **Payload** | `{ sessionId: string, messageId: string, reason?: string }` |
| **Server Action** | Permission check → soft-delete (set isDeleted, content='[message deleted]') → broadcast deletion. |
| **Acknowledgement** | `live:chat:deleted` → `{ success: true, messageId }` |
| **Error** | `live:error` → `{ code: "PERMISSION_DENIED", message }` |

#### `live:chat:pin` — Pin a message

| | |
|---|---|
| **Status** | ✅ Implemented |
| **Direction** | Client → Server |
| **Auth** | Required (host or moderator) |
| **Payload** | `{ sessionId: string, messageId: string }` |
| **Server Action** | Permission check → set type='pinned' → broadcast. |
| **Acknowledgement** | `live:chat:pinned` → `{ success: true, messageId }` |
| **Error** | `live:error` → `{ code: "PERMISSION_DENIED", message }` |

#### `live:chat:typing` — Typing indicator

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required |
| **Payload** | `{ sessionId: string, isTyping: boolean }` |
| **Validation** | sessionId: ObjectId. isTyping: boolean. |
| **Server Action** | No persistence. Broadcast to room. |
| **Acknowledgement** | None (fire-and-forget) |
| **Broadcast** | `live:chat:typing` to `live:{sessionId}` — `{ userId, name, isTyping }` |
| **Error** | None |
| **Rate Limit** | 1 event per second per user |

#### `live:chat:delete` — Delete a message

| | |
|---|---|
| **Status** | ✅ Implemented |
| **Direction** | Client → Server |
| **Auth** | Required (host/mod/admin delete any; user deletes own) |
| **Payload** | `{ sessionId: string, messageId: string, reason?: string }` |
| **Server Action** | Permission check → soft-delete (isDeleted, content='[message deleted]') → broadcast deletion event. |
| **Acknowledgement** | `live:chat:deleted` → `{ success: true, messageId }` |
| **Error** | `live:error` → `{ code: "PERMISSION_DENIED", message }` |

---

### 2.4 Reaction Events

#### `live:like` — Like the stream

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required |
| **Payload** | `{ sessionId: string }` |
| **Validation** | sessionId: ObjectId format |
| **Server Action** | Atomic `$inc: { likeCount: 1 }` on LiveSession. Track in Redis for real-time counter. |
| **Acknowledgement** | None (fire-and-forget for performance) |
| **Broadcast** | `live:like` to `live:{sessionId}` — `{ likeCount: number }` |
| **Error** | None (silently ignore if session not found) |
| **Rate Limit** | 60 per minute per user (Redis-backed) |

#### `live:reaction` — Send an emoji reaction

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required |
| **Payload** | `{ sessionId: string, emoji: string }` |
| **Validation** | sessionId: ObjectId. emoji: must be in allowed emoji set (max 8 bytes). |
| **Server Action** | No persistence. Broadcast only. |
| **Acknowledgement** | None (fire-and-forget) |
| **Broadcast** | `live:reaction` to `live:{sessionId}` — `{ emoji, userId, name }` |
| **Error** | None |
| **Rate Limit** | 30 per minute per user |

---

### 2.5 Gift Events

#### `live:gift:send` — Send a gift

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required |
| **Payload** | `{ sessionId: string, giftType: string, quantity: number, idempotencyKey: string }` |
| **Validation** | sessionId: ObjectId. giftType: string, must exist in catalog. quantity: integer 1-100. idempotencyKey: UUID v4 string. |
| **Server Action** | Execute gift transaction (see LIVE_DATABASE.md §4.1). |
| **Acknowledgement** | `{ success: true, data: { gift: LiveGift, newBalance: number } }` |
| **Broadcast** | `live:gift:received` to `live:{sessionId}` — `{ gift: { giftType, giftName, senderName, quantity, totalCredits } }` |
| **Error** | `{ success: false, message: "Insufficient credits" / "Gifts disabled" / "Session not live" }` |
| **Retry** | Client uses idempotencyKey. Server returns existing gift if key already processed. |

---

### 2.6 Moderation Events

#### `live:mod:mute` — Mute a user

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host or moderator) |
| **Payload** | `{ sessionId: string, userId: string }` |
| **Validation** | Both ObjectIds |
| **Server Action** | 1. Add userId to Redis muted set for session. 2. Create LiveModeration record. 3. Notify target user. |
| **Acknowledgement** | `{ success: true }` |
| **Broadcast** | `live:mod:muted` to `live:{sessionId}` — `{ userId }` |
| **Targeted** | `live:mod:you:muted` to `user:{userId}` — `{ sessionId }` |

#### `live:mod:unmute` — Unmute a user

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host or moderator) |
| **Payload** | `{ sessionId: string, userId: string }` |
| **Server Action** | Remove from Redis muted set. Create LiveModeration record. |
| **Acknowledgement** | `{ success: true }` |
| **Broadcast** | `live:mod:unmuted` to `live:{sessionId}` — `{ userId }` |

#### `live:mod:kick` — Kick a user

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string, userId: string }` |
| **Server Action** | 1. Create LiveModeration record. 2. Emit `live:mod:kicked` to `user:{userId}`. 3. Force disconnect target socket from room. |
| **Acknowledgement** | `{ success: true }` |
| **Targeted** | `live:mod:kicked` to `user:{userId}` — `{ sessionId, reason }` |

#### `live:mod:ban` — Ban a user

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string, userId: string, reason?: string }` |
| **Server Action** | 1. Add to Redis banned set for session (permanent). 2. Create LiveModeration record. 3. Force disconnect. 4. Prevent rejoin. |
| **Acknowledgement** | `{ success: true }` |
| **Targeted** | `live:mod:banned` to `user:{userId}` — `{ sessionId, reason }` |

#### `live:mod:unban` — Unban a user

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string, userId: string }` |
| **Server Action** | Remove from Redis banned set. Create LiveModeration record. |
| **Acknowledgement** | `{ success: true }` |

---

### 2.7 Pin Events

#### `live:pin:product` — Pin a product during live

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string, productId: string }` |
| **Validation** | Both ObjectIds. Verify product belongs to host's stylist profile. |
| **Server Action** | Add to session's `pinnedProducts` array. |
| **Acknowledgement** | `{ success: true, data: { product: Product } }` |
| **Broadcast** | `live:pin:product` to `live:{sessionId}` — `{ product: Product }` |

#### `live:unpin:product` — Unpin a product

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string, productId: string }` |
| **Server Action** | Remove from `pinnedProducts` array. |
| **Broadcast** | `live:unpin:product` to `live:{sessionId}` — `{ productId }` |

#### `live:pin:service` — Pin a service during live

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string, serviceId: string }` |
| **Server Action** | Add to `pinnedServices`. Verify service belongs to host. |
| **Broadcast** | `live:pin:service` to `live:{sessionId}` — `{ service: Service }` |

#### `live:pin:message` — Pin a chat message

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host or moderator) |
| **Payload** | `{ sessionId: string, messageId: string }` |
| **Server Action** | Set message `type: 'pinned'`. Update session's pinned message reference. |
| **Broadcast** | `live:pin:message` to `live:{sessionId}` — `{ message: LiveChatMessage }` |

---

### 2.8 Report Events

#### `live:report` — Report a stream

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required |
| **Payload** | `{ sessionId: string, reason: string, details?: string }` |
| **Validation** | sessionId: ObjectId. reason: required, max 500 chars. details: optional, max 1000 chars. |
| **Server Action** | 1. Increment session `reportCount`. 2. If reportCount >= 5, set `isUnderReview: true`. 3. Create LiveModeration record. 4. Notify admins via notification service. |
| **Acknowledgement** | `{ success: true }` |
| **Error** | `{ success: false, message: "Already reported" }` (one report per user per session) |
| **Rate Limit** | 3 per 10 minutes per user |

---

### 2.9 Analytics Events (Server → Client)

#### `live:analytics:update` — Real-time metrics broadcast

| | |
|---|---|
| **Direction** | Server → Client |
| **Target** | `live:{sessionId}` room |
| **Payload** | `{ viewerCount: number, likeCount: number, chatMessageCount: number, giftCount: number, totalGiftValue: number }` |
| **Frequency** | Every 5 seconds (batched updates from Redis) |

#### `live:viewer:list` — Current viewer list

| | |
|---|---|
| **Direction** | Server → Client |
| **Target** | Requesting socket only |
| **Payload** | `{ viewers: Array<{ userId: string, name: string, avatar?: string }> }` |
| **Trigger** | Response to `live:join` or explicit request |

---

### 2.10 Commerce Events (Phase 3F)

#### `live:service:pin` — Pin a service during live

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string, serviceId: string }` |
| **Validation** | Zod: `pinServiceSchema` — sessionId and serviceId required |
| **Server Action** | 1. Verify host owns session. 2. Fetch service details from DB. 3. Broadcast to room. |
| **Acknowledgement** | `live:service:pinned` emitted to sender + room |
| **Broadcast** | `live:service:pinned` to `live:{sessionId}` — `{ sessionId, serviceId, service: PinnedServiceData }` |

#### `live:service:unpin` — Unpin a service

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string }` |
| **Validation** | Zod: `unpinServiceSchema` — sessionId required |
| **Server Action** | Verify host owns session. Broadcast to room. |
| **Broadcast** | `live:service:unpinned` to `live:{sessionId}` — `{ sessionId }` |

#### `live:availability:update` — Update stylist availability

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string, availability: 'available' | 'busy' | 'away' | 'in-appointment' }` |
| **Validation** | Zod: `availabilitySchema` — sessionId + enum availability |
| **Server Action** | Verify host owns session. Broadcast to room. |
| **Broadcast** | `live:availability:updated` to `live:{sessionId}` — `{ sessionId, availability }` |

#### `live:shelf:toggle` — Toggle product shelf visibility

| | |
|---|---|
| **Direction** | Client → Server |
| **Auth** | Required (host only) |
| **Payload** | `{ sessionId: string, visible: boolean }` |
| **Validation** | Zod: `shelfToggleSchema` — sessionId + boolean visible |
| **Server Action** | Verify host owns session. Broadcast to room. |
| **Broadcast** | `live:shelf:updated` to `live:{sessionId}` — `{ sessionId, visible }` |

#### `PinnedServiceData` — Type

```typescript
interface PinnedServiceData {
  serviceId: string;   // MongoDB ObjectId
  name: string;        // Service name
  price: number;       // Price in Naira
  duration: number;    // Duration in minutes
  category: string;    // Service category
}
```

---

### 2.11 System Events

#### `live:status` — Session status change

| | |
|---|---|
| **Direction** | Server → Client |
| **Target** | `live:{sessionId}` room |
| **Payload** | `{ status: 'live' | 'paused' | 'ended' }` |
| **Trigger** | Host starts/pauses/resumes/ends |

#### `live:error` — Server-side error notification

| | |
|---|---|
| **Direction** | Server → Client |
| **Target** | Individual socket |
| **Payload** | `{ code: string, message: string }` |
| **Trigger** | Any server-side error that the client should know about |

---

## 3. Event Flow Diagrams

### 3.1 Join Flow (Complete)

```
Client                          Server                         Redis
  │                               │                              │
  │ live:join {sessionId}         │                              │
  │──────────────────────────────▶│                              │
  │                               │ Check auth                   │
  │                               │ Check session status         │
  │                               │ Check ban list ─────────────▶│ HSET live:banned:{id}
  │                               │◀─── not banned ──────────────│
  │                               │ Check followers-only         │
  │                               │ (read User.favorites)        │
  │                               │                              │
  │                               │ JOIN room live:{sessionId}   │
  │                               │ INCR viewerCount             │
  │                               │ SADD live:viewers:{id} userId│
  │                               │─────────────────────────────▶│
  │                               │                              │
  │                               │ LOAD last 50 chat messages   │
  │                               │ (MongoDB query)              │
  │                               │                              │
  │                               │ LOAD viewer list             │
  │                               │─────────────────────────────▶│ SMEMBERS live:viewers:{id}
  │                               │◀─── viewer set ──────────────│
  │                               │                              │
  │ live:join:ack {session,       │                              │
  │   chatHistory, viewers}       │                              │
  │◀──────────────────────────────│                              │
  │                               │                              │
  │                               │ BROADCAST live:viewer:join   │
  │                               │ to room (excluding sender)   │
  │                               │─────────────────────────────▶│ PUBLISH
  │                               │                              │
```

### 3.2 Chat Message Flow (Complete)

```
Client                          Server                         MongoDB    Redis
  │                               │                              │          │
  │ live:chat:send                │                              │          │
  │ {sessionId, content, replyTo} │                              │          │
  │──────────────────────────────▶│                              │          │
  │                               │ 1. Check muted ───────────────────────▶│
  │                               │ 2. Check banned ──────────────────────▶│
  │                               │ 3. Check slow mode ──────────────────▶│
  │                               │ 4. Check spam (5 msgs/10s) ─────────▶│
  │                               │ 5. Filter profanity (bad-words lib)  │
  │                               │ 6. Sanitize HTML (XSS prevention)    │
  │                               │                              │          │
  │                               │ CREATE LiveChatMessage       │          │
  │                               │─────────────────────────────▶│          │
  │                               │                              │          │
  │                               │ PUBLISH to channel           │          │
  │                               │ live:{sessionId}:chat        │          │
  │                               │──────────────────────────────────────▶│
  │                               │                              │          │
  │                               │          (Other server instances receive│
  │                               │           via Redis SUB and forward    │
  │                               │           to their local sockets)     │
  │                               │                              │          │
  │ live:chat:message {message}   │                              │          │
  │◀──────────────────────────────│                              │          │
```

---

## 4. Error Codes

| Code | Meaning | Client Action |
|------|---------|--------------|
| `SESSION_NOT_FOUND` | Session does not exist | Show "Stream not found" |
| `SESSION_NOT_LIVE` | Session is ended or not started | Show "Stream is not live" |
| `SESSION_PAUSED` | Stream is paused | Show "Stream paused" overlay |
| `NOT_AUTHORIZED` | User lacks permission | Show "Not authorized" |
| `HOST_ONLY` | Action requires host role | Show "Only host can do this" |
| `BANNED` | User is banned from session | Show "You are banned" |
| `FOLLOWERS_ONLY` | Followers-only mode | Show "Follow to join" |
| `MUTED` | User is muted | Show "You are muted" in chat input |
| `ROOM_FULL` | Max viewers reached | Show "Stream is full" |
| `SLOW_MODE` | Slow mode active | Show countdown timer in chat input |
| `SPAM_DETECTED` | Too many messages | Show "Slow down" |
| `INSUFFICIENT_CREDITS` | Not enough gift credits | Show "Not enough credits" |
| `GIFTS_DISABLED` | Host disabled gifts | Hide gift button |
| `ALREADY_REPORTED` | User already reported | Show "Already reported" |
| `DUPLICATE_GIFT` | Idempotency key reused | Show existing gift result |

---

## 5. Connection Lifecycle

### 5.1 Connect

```
Client connects to /live namespace
  → Server middleware: verify JWT
  → socket.user = { id, role }
  → Client waits for user action (join session)
```

### 5.2 Event Pipeline (Phase 3C.5)

Every event flows through a composable middleware chain:

```
Event received
  → authenticate (JWT verification)
  → authorize (role check)
  → validateRoom (session membership)
  → rateLimit (LiveRateLimiter, Redis-backed)
  → validatePayload (Zod schema)
  → logging (event metadata)
  → performance (high-resolution timing)
  → business handler
  → standardized response (emitSuccess / emitError)
```

**Registration:**
```typescript
import { registerSocketEvent } from '../pipeline';
import { createAuthMiddleware, createRateLimitMiddleware, createValidatePayloadMiddleware } from '../middleware';

registerSocketEvent(socket, {
  event: 'live:chat:send',
  middleware: [
    createAuthMiddleware(),
    createRateLimitMiddleware(rateLimiter, 'live:chat:send'),
    createValidatePayloadMiddleware(chatSendSchema),
  ],
  handler: async (socket, context, data) => {
    // context.user = { id, role } (from authenticate)
    // context.payload = validated data (from validatePayload)
  }
});
```

**Standardized Responses:**
| Helper | Code | Usage |
|--------|------|-------|
| `emitSuccess(socket, data?)` | — | Acknowledge success |
| `emitValidationError(socket, msg)` | `INVALID_PAYLOAD` | Bad input |
| `emitUnauthorized(socket, msg?)` | `PERMISSION_DENIED` | No permission |
| `emitRateLimited(socket, msg?)` | `RATE_LIMITED` | Too many requests |
| `emitNotFound(socket, msg?)` | `ROOM_NOT_FOUND` | Session not found |
| `emitBanned(socket, msg?)` | `USER_BANNED` | User banned |
| `emitInternalError(socket, msg?)` | `INTERNAL_ERROR` | Server error |

### 5.3 Broadcast Abstraction

All cross-instance broadcasting uses `ChatBroadcaster` interface:

```typescript
import { ChatBroadcaster } from './broadcast';

// Publish
await broadcaster.publish(sessionId, 'live:chat:message', { message });

// Subscribe
await broadcaster.subscribe(sessionId, (msg) => {
  socket.to(`live:${msg.sessionId}`).emit(msg.event, msg.data);
});
```

Channel: `live:broadcast:{sessionId}` — Redis Pub/Sub fans out to all subscribers.

### 5.4 Active

```
Client joins session room
  → Receives broadcast events
  → Sends events (chat, like, reaction, gift)
  → Server tracks in Redis for cross-instance state
```

### 5.5 Disconnect

```
Client disconnects (network issue, tab close, etc.)
  → Server 'disconnect' handler fires
  → Decrement viewerCount
  → Remove from Redis viewer set
  → Broadcast live:viewer:leave immediately
  → If host disconnects: live:host-offline emitted
  → Stale connection cleanup: Redis TTL (300s) handles it
```

### 5.6 Reconnect

```
Client reconnects
  → Re-authenticate with JWT
  → Emit live:reconnect { sessionId }
  → Server: rejoin room, return missed messages
  → Client: reconcile state (viewer count, likes, pinned items)
```

---

## Phase 3H — Safety, Engagement & Validation Events

### 6.1 Moderation Events (Client → Server)

| Event | Payload | Permission | Description |
|---|---|---|---|
| `live:mod:mute` | `{ sessionId, userId, reason? }` | host/mod | Mute a user |
| `live:mod:unmute` | `{ sessionId, userId }` | host/mod | Unmute a user |
| `live:mod:ban` | `{ sessionId, userId, reason? }` | host/mod | Ban a user |
| `live:mod:unban` | `{ sessionId, userId }` | host/mod | Unban a user |
| `live:mod:delete` | `{ sessionId, messageId, reason? }` | host/mod | Delete a message |
| `live:mod:report-message` | `{ sessionId, messageId, reason? }` | viewer | Report a message |
| `live:mod:report-user` | `{ sessionId, userId, reason? }` | viewer | Report a user |

### 6.2 Moderation Events (Server → Client)

| Event | Payload | Broadcast | Description |
|---|---|---|---|
| `live:mod:user-muted` | `{ sessionId, userId, mutedBy }` | Room | User was muted |
| `live:mod:user-unmuted` | `{ sessionId, userId }` | Room | User was unmuted |
| `live:mod:user-banned` | `{ sessionId, userId, reason? }` | Room | User was banned |
| `live:mod:user-unbanned` | `{ sessionId, userId }` | Room | User was unbanned |
| `live:mod:message-deleted` | `{ sessionId, messageId }` | Room | Message was deleted |
| `live:mod:report-submitted` | `{ sessionId, reportId }` | Sender only | Report confirmation |
| `live:mod:notification` | `{ sessionId, type, message }` | Target user | Safety notification (muted/banned/removed/confirmed) |

### 6.3 Reaction Events

| Event | Payload | Permission | Description |
|---|---|---|---|
| `live:reaction:send` | `{ sessionId, type }` | viewer | Send a reaction (love/fire/clap/wow/glow) |

| Event | Payload | Broadcast | Description |
|---|---|---|---|
| `live:reaction:received` | `{ sessionId, type, userId, counts }` | Room (incl. sender) | Reaction broadcast with aggregated counts |

**Rate Limiting:** 1 reaction per 500ms per user. Silently dropped if rate-limited (no error emitted).

### 6.4 Guest Request Events

| Event | Payload | Permission | Description |
|---|---|---|---|
| `live:guest:request` | `{ sessionId, reason? }` | viewer | Request to join as guest |
| `live:guest:cancel` | `{ sessionId }` | viewer | Cancel pending request |
| `live:guest:accept` | `{ sessionId, requestId }` | host only | Accept guest request |
| `live:guest:reject` | `{ sessionId, requestId }` | host only | Reject guest request |

| Event | Payload | Broadcast | Description |
|---|---|---|---|
| `live:guest:request-received` | `{ sessionId, requestId, displayName, reason? }` | Room | New guest request (host sees it) |
| `live:guest:request-cancelled` | `{ sessionId, requestId }` | Room | Request was cancelled |
| `live:guest:request-accepted` | `{ sessionId, requestId }` | Room | Request was accepted |
| `live:guest:request-rejected` | `{ sessionId, requestId }` | Room | Request was rejected |
| `live:guest:request-status` | `{ sessionId, status }` | Requester only | Status update for requester |

### 6.5 Host Analytics Events

| Event | Payload | Broadcast | Description |
|---|---|---|---|
| `live:analytics:update` | `{ sessionId, reactionCounts, pendingRequests, mutedUsers, bannedUsers, viewerCount }` | Host only | Periodic analytics update |

---

*End of LIVE_SOCKET_EVENTS.md*
