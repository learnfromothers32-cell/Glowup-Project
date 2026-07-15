# LIVE_ARCHITECTURE.md

> **GlowUp Live Streaming Platform — System Architecture**  
> Phase 2 — Architecture Design  
> Date: July 15, 2026

---

## 1. Architecture Overview

The GlowUp Live module is a **dedicated subsystem** that integrates with the existing platform without modifying any working features. It follows a **modular monolith** pattern within the existing Express/MongoDB/Socket.IO stack, using **LiveKit** as the WebRTC SFU for video delivery.

### Design Principles

1. **Isolation** — Live code lives under dedicated directories; no existing files are rewritten
2. **Reuse** — User, Stylist, Booking, Queue, Product, Service, Credit, Notification models are consumed read-only or extended minimally
3. **Single Source of Truth** — MongoDB for authoritative state, Redis for ephemeral hot state and pub/sub, LiveKit for video
4. **Event-Driven** — Socket.IO for bidirectional real-time; Redis pub/sub for cross-instance broadcast; Bull for async jobs
5. **Defense in Depth** — Every client message validated server-side; no trust in client state

---

## 2. High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React 19 SPA)                          │
│                                                                         │
│  ┌──────────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │ LiveKit SDK  │  │ Socket.IO│  │ TanStack  │  │ Zustand Store     │  │
│  │ (React)      │  │ Client   │  │ Query     │  │ (liveStore)       │  │
│  └──────┬───────┘  └────┬─────┘  └─────┬─────┘  └────────┬──────────┘  │
│         │               │              │                  │             │
└─────────┼───────────────┼──────────────┼──────────────────┼─────────────┘
          │ WebRTC        │ WebSocket    │ REST             │
          │ (media)       │ (signaling)  │ (CRUD)           │
┌─────────┼───────────────┼──────────────┼──────────────────┼─────────────┐
│         ▼               ▼              ▼                  ▼             │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │  LiveKit     │  │ Socket.IO│  │   Express    │  │  Redis        │   │
│  │  Cloud/SFU   │  │ Server   │  │   Router     │  │  (Upstash)    │   │
│  │             │  │          │  │              │  │               │   │
│  │  ┌────────┐ │  │ Names-   │  │ /api/live/*  │  │  Pub/Sub      │   │
│  │  │ Rooms  │ │  │ spaces:  │  │ /api/gifts/* │  │  Cache        │   │
│  │  │ Tracks │ │  │ /live    │  │ /api/replays │  │  Rate Limits  │   │
│  │  │ Egress │ │  │ /queue   │  │              │  │  Session      │   │
│  │  └────────┘ │  │ /convos  │  │              │  │  State        │   │
│  └──────┬──────┘  └────┬─────┘  └──────┬───────┘  └───────┬───────┘   │
│         │              │               │                   │           │
│         │              │    ┌──────────┼───────────────────┘           │
│         │              │    │          │                               │
│  ┌──────┼──────────────┼────┼──────────┼───────────────────────────┐   │
│  │      │    MongoDB Atlas│  │  Bull    │  LiveKit Webhook         │   │
│  │      │    ┌──────────┐ │  │  Queue   │                          │   │
│  │      │    │LiveSession│ │  │  ┌─────┐│  ┌──────────────┐        │   │
│  │      │    │LiveChat   │ │  │  │Replay││  │ room.start   │        │   │
│  │      │    │LiveGift   │ │  │  │Worker││  │ room.ended   │        │   │
│  │      │    │LiveReplay │ │  │  └─────┘│  │ egress.done  │        │   │
│  │      │    │LiveMod    │ │  └─────────┘  └──────────────┘        │   │
│  │      │    │           │ │                                       │   │
│  │      │    │ (existing)│ │                                       │   │
│  │      │    │ User      │ │         ┌─────────────────┐           │   │
│  │      │    │ Stylist   │ │         │  Cloudinary     │           │   │
│  │      │    │ Booking   │ ├────────▶│  (thumbnails,   │           │   │
│  │      │    │ Queue     │ │         │   replays)      │           │   │
│  │      │    │ Product   │ │         └─────────────────┘           │   │
│  │      │    │ Service   │ │                                       │   │
│  │      │    │ UserCredit│ │         ┌─────────────────┐           │   │
│  │      │    │ Notif     │ │────────▶│  Notification    │           │   │
│  │      │    └──────────┘ │         │  Service         │           │   │
│  │      └─────────────────┘         └─────────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│                        GLOWUP SERVER (Express + Node.js)               │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Diagrams

### 3.1 Host Starts Live Stream

```
Host Device                GlowUp Server            LiveKit              MongoDB
    │                           │                      │                    │
    │ POST /api/live/sessions   │                      │                    │
    │ {title, category}         │                      │                    │
    │──────────────────────────▶│                      │                    │
    │                           │ Create LiveSession   │                    │
    │                           │ status: "live"       │                    │
    │                           │──────────────────────────────────────────▶│
    │                           │                      │                    │
    │                           │ Create LiveKit Room  │                    │
    │                           │─────────────────────▶│                    │
    │                           │◀─── room created ────│                    │
    │                           │                      │                    │
    │                           │ Generate JWT Token   │                    │
    │ (host, publish+subscribe) │                      │                    │
    │◀─── {session, token} ─────│                      │                    │
    │                           │                      │                    │
    │ Connect to LiveKit Room   │                      │                    │
    │ (token in handshake)      │                      │                    │
    │──────────────────────────────────────────────────▶│                    │
    │◀─── connected ───────────────────────────────────│                    │
    │                           │                      │                    │
    │ Publish camera/mic track  │                      │                    │
    │──────────────────────────────────────────────────▶│                    │
    │                           │                      │                    │
    │                           │ Emit live:host:started to /live namespace│
    │                           │───────────────────────────────────────▶Redis│
    │                           │                      │              (pub/sub)│
```

### 3.2 Viewer Joins Live Stream

```
Viewer Device              GlowUp Server           LiveKit               Redis
    │                           │                    │                     │
    │ GET /api/live/featured    │                    │                     │
    │──────────────────────────▶│                    │                     │
    │◀── [{sessionId, ...}] ───│                    │                     │
    │                           │                    │                     │
    │ POST /api/live/sessions/  │                    │                     │
    │   {id}/token              │                    │                     │
    │──────────────────────────▶│                    │                     │
    │ Verify: session is live   │                    │                     │
    │ Check: not banned         │                    │                     │
    │ Check: followersOnly?     │                    │                     │
    │ Generate viewer token     │                    │                     │
    │◀── {token, roomName} ────│                    │                     │
    │                           │                    │                     │
    │ Socket: live:join         │                    │                     │
    │ {sessionId}               │                    │                     │
    │──────────────────────────▶│                    │                     │
    │ Join Socket.IO room       │                    │                     │
    │ Increment viewerCount     │                    │                     │
    │                           │──────────────────────────────────────▶   │
    │                           │                    │              (cache) │
    │◀── live:viewer:list ──────│                    │                     │
    │                           │                    │                     │
    │ Connect to LiveKit Room   │                    │                     │
    │ (token in handshake)      │                    │                     │
    │───────────────────────────────────────────────▶│                     │
    │◀── subscribed to host ─────────────────────────│                     │
    │                           │                    │                     │
    │ Receive video/audio       │                    │                     │
    │◀══════════════════════════════════════════════│                     │
```

### 3.3 Chat Message Flow

```
Viewer                Socket.IO /live         Redis Pub/Sub        MongoDB      Host Device
  │                         │                     │                  │              │
  │ live:chat:send          │                     │                  │              │
  │ {sessionId, content}    │                     │                  │              │
  │────────────────────────▶│                     │                  │              │
  │                         │ Validate:           │                  │              │
  │                         │  - auth required    │                  │              │
  │                         │  - content ≤ 500ch  │                  │              │
  │                         │  - not muted        │                  │              │
  │                         │  - not banned       │                  │              │
  │                         │  - slow mode check  │                  │              │
  │                         │  - profanity filter │                  │              │
  │                         │  - spam detection   │                  │              │
  │                         │                     │                  │              │
  │                         │ Persist to LiveChatMessage             │              │
  │                         │──────────────────────────────────────▶│              │
  │                         │                     │                  │              │
  │                         │ Publish to Redis    │                  │              │
  │                         │ channel:live:{id}:chat                │              │
  │                         │────────────────────▶│                  │              │
  │                         │                     │ Fan out to all   │              │
  │                         │                     │ server instances │              │
  │                         │                     │──────────────────│─────────────▶│
  │◀── live:chat:message ───│                     │                  │              │
  │  {message}              │                     │                  │              │
```

### 3.4 Gift Transaction Flow

```
Viewer                GlowUp Server           MongoDB (Transaction)    Host
  │                         │                          │                │
  │ live:gift:send          │                          │                │
  │ {sessionId, giftType,   │                          │                │
  │  quantity, idempotencyKey}                         │                │
  │────────────────────────▶│                          │                │
  │                         │ START TRANSACTION       │                │
  │                         │─────────────────────────▶│                │
  │                         │                          │                │
  │                         │ 1. Verify session live   │                │
  │                         │ 2. Verify gift exists    │                │
  │                         │ 3. Check sender balance  │                │
  │                         │    (UserCredit)          │                │
  │                         │ 4. Check idempotencyKey  │                │
  │                         │    not already used      │                │
  │                         │ 5. Debit sender balance  │                │
  │                         │ 6. Create LiveGift doc   │                │
  │                         │ 7. Append to sender      │                │
  │                         │    transaction history   │                │
  │                         │ 8. Append to host        │                │
  │                         │    earnings (if applicable)              │
  │                         │                          │                │
  │                         │ COMMIT TRANSACTION       │                │
  │                         │─────────────────────────▶│                │
  │                         │                          │                │
  │                         │ Emit live:gift:received  │                │
  │                         │ to room (all viewers)    │                │
  │                         │─────────────────────────────────────────▶│
  │◀── live:gift:animation ─│                          │                │
  │  {giftType, senderName} │                          │                │
```

### 3.5 In-Stream Booking Flow

```
Viewer                GlowUp Server           Booking Service        Host
  │                         │                          │               │
  │ live:book               │                          │               │
  │ {sessionId, serviceId}  │                          │               │
  │────────────────────────▶│                          │               │
  │                         │ 1. Verify session live   │               │
  │                         │ 2. Verify service exists │               │
  │                         │ 3. Redirect to booking   │               │
  │                         │    API with session context               │
  │◀── {bookingUrl, slot} ──│                          │               │
  │                         │                          │               │
  │ (Opens booking modal    │                          │               │
  │  pre-filled with stylist │                          │               │
  │  and service)            │                          │               │
  │                         │                          │               │
  │ POST /api/bookings      │                          │               │
  │ {stylistId, serviceId,  │                          │               │
  │  startTime}             │                          │               │
  │───────────────────────────────────────────────────▶│               │
  │                         │ (Existing booking flow — atomic create)  │
  │◀── {booking} ──────────│                          │               │
  │                         │                          │               │
  │ Socket: live:booking:   │                          │               │
  │   created               │                          │               │
  │────────────────────────▶│                          │               │
  │                         │ Emit to room             │               │
  │                         │ "New booking by viewer!" │               │
  │                         │─────────────────────────────────────────▶│
```

---

## 4. Service Boundaries

### 4.1 LiveService (Core Orchestrator)

**Responsibility:** Session lifecycle management, room state, host controls.

```
Inputs:                          Outputs:
- Create session request         - LiveSession document
- Start/pause/resume/end         - LiveKit room + token
- Session queries                - Session analytics snapshot
- Host control actions           - Status transitions
```

**Does NOT handle:** Chat, gifts, moderation, analytics aggregation, replay processing.

### 4.2 LiveKitService (Video Infrastructure)

**Responsibility:** LiveKit API wrapper — token generation, room management, recording, participant management.

```
Inputs:                          Outputs:
- Room name + participant ID     - JWT token
- Permission set                 - Room metadata
- Recording config               - Egress recording URL
- Quality settings               - Participant info
```

**Does NOT handle:** Session state, chat, gifts, database operations.

### 4.3 LiveChatService (Messaging)

**Responsibility:** Chat message processing, persistence, broadcasting, moderation integration.

```
Inputs:                          Outputs:
- Raw message from client        - Persisted LiveChatMessage
- Moderation checks              - Filtered/censored content
- Slow mode config               - Broadcast event
- Reply references               - Pinned message state
```

**Does NOT handle:** Video, gifts, session lifecycle, analytics.

### 4.4 LiveGiftService (Virtual Economy)

**Responsibility:** Gift catalog, wallet operations, transaction integrity, leaderboard computation.

```
Inputs:                          Outputs:
- Gift send request              - LiveGift transaction
- Idempotency key                - Updated UserCredit balance
- Gift catalog query             - Leaderboard data
- Balance query                  - Gift animation metadata
```

**Does NOT handle:** Chat, video, session lifecycle, moderation.

### 4.5 LiveAnalyticsService (Metrics)

**Responsibility:** Real-time metric tracking, historical aggregation, dashboard data.

```
Inputs:                          Outputs:
- Viewer join/leave events       - Real-time metrics snapshot
- Like/reaction events           - Historical aggregated data
- Gift events                    - Retention curves
- Chat events                    - Conversion metrics
- Booking attribution events     - Peak/average stats
```

**Does NOT handle:** Video, chat persistence, gift transactions, session state.

### 4.6 LiveModerationService (Safety)

**Responsibility:** Profanity filtering, spam detection, ban management, report processing, audit logging.

```
Inputs:                          Outputs:
- Message content                - Filtered/blocked result
- User actions                   - Ban/mute/kick decisions
- Report submissions             - Audit log entries
- Moderation config              - Shadow ban status
```

**Does NOT handle:** Video, gifts, session lifecycle, analytics aggregation.

### 4.7 LiveReplayWorker (Async Processing)

**Responsibility:** Post-stream recording processing, thumbnail generation, metadata extraction.

```
Inputs:                          Outputs:
- LiveKit Egress webhook         - Processed replay URL
- Session metadata               - Thumbnail URL
- Recording URL                  - Caption placeholder
                                 - Updated LiveReplay document
```

**Does NOT handle:** Real-time streaming, chat, gifts, live analytics.

---

## 5. Component Interaction Matrix

| | LiveService | LiveKit | Chat | Gifts | Analytics | Moderation | Replay |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **LiveService** | — | Token gen | — | — | Start event | — | Session end |
| **LiveKit** | Webhook | — | — | — | — | — | Egress |
| **Chat** | Config read | — | — | — | Chat count | Filter | — |
| **Gifts** | Session check | — | Gift message | — | Gift event | — | — |
| **Analytics** | Session data | Quality metrics | Chat count | Gift revenue | — | Report count | — |
| **Moderation** | Ban check | — | Message filter | — | Report event | — | — |
| **Replay** | Session end | Recording URL | — | — | — | — | — |

**Arrow meaning:** Row calls Column (dependency direction)

---

## 6. Technology Decisions

### 6.1 LiveKit vs alternatives

| Criteria | LiveKit | mediasoup | Cloudflare Calls |
|----------|---------|-----------|-----------------|
| Self-host option | Yes | Yes | No (cloud only) |
| Cloud offering | Yes (free tier) | No | Yes |
| React SDK | Yes (@livekit/components-react) | No (custom) | No (custom) |
| Simulcast | Built-in | Manual | Built-in |
| Adaptive bitrate | Built-in | Manual | Built-in |
| Recording | Egress API | Custom | Custom |
| TURN/STUN | Built-in | Self-managed | Built-in |
| Documentation | Excellent | Good | Limited |
| Community | Large | Medium | Small |
| **Decision** | **Selected** | — | — |

**Rationale:** LiveKit provides the most complete package with React SDK, built-in recording, adaptive bitrate, and excellent documentation. The free tier (50 participants, 50GB/month) is sufficient for initial launch. Cloud hosting eliminates operational burden of self-hosting SFU infrastructure.

### 6.2 Socket.IO for Chat (not LiveKit Data Channel)

**Decision:** Use Socket.IO `/live` namespace for chat, reactions, and control messages. Use LiveKit only for video/audio media tracks.

**Rationale:**
- Socket.IO is already integrated with Redis adapter for cross-instance broadcast
- Existing auth middleware and rate limiting patterns apply directly
- Chat needs persistence to MongoDB — Socket.IO handlers can write directly
- LiveKit DataChannel is optimized for low-latency media metadata, not persisted chat
- Separation of concerns: video (LiveKit) vs. application logic (Socket.IO)

### 6.3 Zustand for Client Live State

**Decision:** Use Zustand store (not React Context) for live state management.

**Rationale:**
- Real-time updates at 60fps require fine-grained subscriptions
- React Context re-renders entire subtree on any update
- Zustand provides selector-based subscriptions (only re-render when specific slice changes)
- Zustand supports middleware (immer, persist, devtools) out of the box
- Performance-critical paths: viewer count, like animation, chat scroll, gift animation

### 6.4 MongoDB Transactions for Gifts

**Decision:** Use MongoDB sessions with `withTransaction()` for all gift operations.

**Rationale:**
- Gift sends involve debiting UserCredit + creating LiveGift + updating session counters
- Partial failure must never leave inconsistent balance
- MongoDB transactions guarantee ACID across these operations
- Existing pattern in codebase (see `booking.controller.ts` queue operations)

### 6.5 Socket Infrastructure (Phase 3C)

**Decision:** Dedicated `/live` Socket.IO namespace with Redis-backed presence, viewer count, and rate limiting. Isolated from existing `/queue` and `/conversations` namespaces.

**Rationale:**
- Live streaming requires real-time presence tracking and viewer counts across multiple server instances
- Redis is the source of truth for room state — survives server restarts and enables horizontal scaling
- Rate limiting must be distributed (Redis) to be effective across instances, with in-memory fallback when Redis is unavailable
- Namespace isolation prevents live events from interfering with queue/conversation events
- JWT authentication on connect — no unauthenticated sockets in the `/live` namespace

**Components:**

| Component | File | Purpose |
|-----------|------|---------|
| Namespace setup | `socket/index.ts` | Creates `/live` namespace, JWT auth middleware, wires dependencies |
| Event handlers | `socket/handlers.ts` | `live:join`, `live:leave`, `live:heartbeat`, `disconnect` cleanup |
| Presence | `socket/presence.ts` | Redis hash: `live:presence:{sessionId}` → socket→user mapping |
| Viewer count | `socket/viewerCount.ts` | Redis INCR/DECR: `live:viewers:{sessionId}`, peak tracking |
| Rate limiting | `socket/rateLimit.ts` | Redis sorted set sliding window, in-memory fallback |
| Type definitions | `socket/types.ts` | Event interfaces, Zod schemas, error codes |

**Data Flow:**
```
Client connects → JWT verified → socket.user set
    ↓
live:join → validate schema → rate limit → check duplicate → verify session →
    add to Redis presence → join Socket.IO room → increment viewer count →
    emit live:joined + broadcast live:presence + live:viewer-count
    ↓
live:heartbeat → rate limit → update Redis heartbeat → emit live:pong
    ↓
disconnect → remove from Redis presence → decrement viewer count →
    broadcast live:presence + live:viewer-count → host-offline if host
```

**Redis Keys:**

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `live:presence:{sessionId}` | Hash | 300s | socketId → PresenceEntry JSON |
| `live:heartbeat:{sessionId}:{userId}` | String | 120s | Last heartbeat timestamp |
| `live:viewers:{sessionId}` | String (int) | 3600s | Current viewer count |
| `live:peak:{sessionId}` | String (int) | 3600s | Peak viewer count |
| `ratelimit:*` | Sorted Set | per-config | Sliding window counts |

**Heartbeat Protocol:**
- Client sends `live:heartbeat` every 30 seconds
- Server responds with `live:pong` and updates Redis
- Presence TTL (300s) auto-cleans stale connections
- Host disconnect triggers `live:host-offline` immediately

**Graceful Degradation:**
- Redis unavailable → namespace refuses to initialize (no presence/viewer sync)
- Rate limiter falls back to in-memory per-instance (not distributed)
- Presence TTL handles stale connection cleanup without explicit cleanup loops

### 6.5.1 Commerce Socket Events (Phase 3F)

**Decision:** Commerce events use the same `/live` namespace with host-only permission checks and room broadcast.

**Events:**

| Event | Direction | Auth | Purpose |
|-------|-----------|------|---------|
| `live:service:pin` | Client → Server | Host only | Pin a featured service |
| `live:service:pinned` | Broadcast | — | Notify room of pinned service |
| `live:service:unpin` | Client → Server | Host only | Remove pinned service |
| `live:service:unpinned` | Broadcast | — | Notify room of unpinned service |
| `live:availability:update` | Client → Server | Host only | Update availability status |
| `live:availability:updated` | Broadcast | — | Notify room of availability |
| `live:shelf:toggle` | Client → Server | Host only | Toggle product shelf visibility |
| `live:shelf:updated` | Broadcast | — | Notify room of shelf state |

**Server Handler Flow:**
```
Client emits live:service:pin {sessionId, serviceId}
  → Verify socket.user.id === session.hostUserId (host-only)
  → Fetch service details from Service model
  → Broadcast live:service:pinned to live:{sessionId} room
  → Emit live:service:pinned to sender
```

**Zod Schemas:** `pinServiceSchema`, `unpinServiceSchema`, `availabilitySchema`, `shelfToggleSchema` — defined in `socket/types.ts`.

### 6.5.2 Moderation, Reactions & Guest Requests (Phase 3H)

**Decision:** All safety and engagement features use the same `/live` namespace with role-based permission checks.

#### Moderation Workflow

```
Host/Mod emits live:mod:mute {sessionId, userId, reason?}
  → Verify socket.user.id === session.hostUserId OR participant.role === 'moderator'
  → Cannot mute the host
  → Set participant.isMuted = true
  → Create LiveModeration audit entry
  → Broadcast live:mod:user-muted to room
  → Emit live:mod:notification to muted user
```

**Actions:** mute, unmute, ban, unban, delete_message, report (message or user)
**Audit:** All actions recorded in `LiveModeration` model with moderator ID, target, timestamp, optional reason.

#### Profanity Filter

Server-only, configurable word list, case-insensitive. Supports `replace` (mask with `*`) or `reject` (drop message). Extension point for future AI moderation via `ModerationHooks` interface.

#### Reaction Flow

```
Viewer emits live:reaction:send {sessionId, type}
  → Rate limit check: 1 per 500ms per user (silently drop if exceeded)
  → Record in analytics service (in-memory counter)
  → Get aggregated counts
  → Broadcast live:reaction:received to room (incl. sender for animation)
```

**Types:** love, fire, clap, wow, glow. Client auto-cleanup after 3s animation. Max 15 active overlays.

#### Guest Request Lifecycle

```
Viewer emits live:guest:request {sessionId, reason?}
  → Validate session is live, no duplicate pending request
  → Create LiveGuestRequest (status: pending)
  → Broadcast live:guest:request-received to room
  → Emit live:guest:request-status to requester

Host emits live:guest:accept {sessionId, requestId}
  → Verify host permission
  → Update request status to accepted
  → Broadcast live:guest:request-accepted to room
```

**Future:** Accepted guests will connect to media streams (not yet implemented — workflow only).

#### Analytics Collection

In-memory counters during session: reactions, guest requests, service pins, reports. Persisted to `LiveSession` document on session end via `LiveAnalyticsService.persistSessionAnalytics()`.

#### Zod Schemas

`muteUserSchema`, `unmuteUserSchema`, `banUserSchema`, `unbanUserSchema`, `reportMessageSchema`, `reportUserSchema`, `reactionSendSchema`, `guestRequestSchema`, `guestRequestActionSchema` — defined in `validators/index.ts`.

### 6.6 Provider Abstraction (Media Layer)

**Decision:** Business logic depends only on `LiveMediaProvider` interface. The only implementation that knows about LiveKit SDK is `LiveKitMediaProvider`.

**Rationale:**
- Provider-agnostic architecture enables switching SFU without rewriting business logic
- Self-hosted LiveKit now, migrate to LiveKit Cloud or other providers later
- `MockLiveMediaProvider` for development/testing without LiveKit running
- Provider selected via `LIVE_PROVIDER` environment variable (`mock` or `livekit`)
- Dependency injection: `LiveSessionService` receives provider via constructor

**Architecture:**
```
Business Logic (controllers, services, repositories)
        ↓ depends on interface only
LiveMediaProvider (interface)
        ↓
┌───────┴───────┐
│               │
MockLive    LiveKitMedia
Provider    Provider
(dev)       (production)
                ↓ imports ONLY here
          livekit-server-sdk
```

**Migration Path:**
1. Self-hosted LiveKit (current) → change `LIVEKIT_URL` to server address
2. LiveKit Cloud → change `LIVEKIT_URL` to cloud endpoint
3. Other SFU → implement new provider class, keep interface

### 6.7 Socket Middleware Pipeline (Phase 3C.5)

**Decision:** Every socket event flows through a composable middleware chain. No handler duplicates authentication, validation, or rate limiting logic.

**Middleware Chain:**
```
Incoming Event
        │
        ▼
authenticate ──→ Verify JWT, set context.user
        │
        ▼
authorize ──→ Check role permissions
        │
        ▼
validateRoom ──→ Verify socket is in correct room
        │
        ▼
rateLimit ──→ Check rate limits via LiveRateLimiter
        │
        ▼
validatePayload ──→ Validate with Zod schema, set context.payload
        │
        ▼
logging ──→ Log event metadata
        │
        ▼
performance ──→ Record high-resolution start time
        │
        ▼
Business Handler
        │
        ▼
Standardized Response (emitSuccess / emitError / etc.)
```

**Key Components:**
| Component | File | Purpose |
|-----------|------|---------|
| Pipeline runner | `pipeline.ts` | `registerSocketEvent()` — chains middleware + handler |
| Response helpers | `responses.ts` | `emitSuccess()`, `emitError()`, `emitRateLimited()`, etc. |
| Metrics | `metrics.ts` | `LiveSocketMetricsCollector` — latency, errors, subscriptions |

**Usage:**
```typescript
registerSocketEvent(socket, {
  event: 'live:chat:send',
  middleware: [
    createAuthMiddleware(),
    createRateLimitMiddleware(rateLimiter, 'live:chat:send'),
    createValidatePayloadMiddleware(chatSendSchema),
  ],
  handler: async (socket, context, data) => {
    // context.user is set by authenticate
    // context.payload is set by validatePayload
    // Business logic here
  }
});
```

**Future handlers require minimal boilerplate — just define the event name, middleware chain, and handler.**

### 6.8 Broadcast Abstraction (Phase 3C.5)

**Decision:** Chat and future real-time features broadcast through `ChatBroadcaster` interface. Never directly through Redis Pub/Sub.

**Rationale:**
- Business logic must not depend on Redis — swap to NATS, Kafka, RabbitMQ without changing services
- `RedisChatBroadcaster` handles reconnect, error recovery, channel lifecycle
- `MockChatBroadcaster` for testing without Redis

**Architecture:**
```
ChatService (future)
        ↓ depends on ChatBroadcaster interface only
ChatBroadcaster (interface)
        ↓
┌───────┴───────┐
│               │
RedisChat   MockChat
Broadcaster  Broadcaster
(production)  (testing)
    ↓ imports ONLY here
  ioredis
```

**Channel Naming:** `live:broadcast:{sessionId}`
- Each server instance subscribes to channels for rooms it has sockets in
- Redis Pub/Sub fans out to all subscribers automatically
- Cross-instance delivery guaranteed

### 6.9 Stale Connection Strategy

**Decision:** Redis TTL is the authoritative cleanup mechanism. No active cleanup worker.

**Design:**
- `live:presence:{sessionId}` hash has 300s TTL, refreshed on each heartbeat
- `live:heartbeat:{sessionId}:{userId}` has 120s TTL
- When a socket disconnects, the `disconnect` handler removes presence immediately
- When a socket hangs without heartbeats, the Redis TTL expires the key
- No periodic sweep needed — Redis handles it

**Why no active cleanup worker:**
- Redis TTL is atomic and distributed — works across all server instances
- Active workers risk duplicate cleanup across instances
- TTL expiry is sufficient for the 300s/120s windows used

---

## 7. File Structure (Final)

### Backend

```
server/src/
├── live/                              # LIVE MODULE (isolated)
│   ├── config/
│   │   └── livekit.config.ts          # Environment validation for LiveKit
│   ├── types/
│   │   └── index.ts                   # Shared types, status machine, interfaces
│   ├── models/
│   │   ├── LiveSession.ts             # Session schema with indexes
│   │   ├── LiveParticipant.ts         # Participant tracking
│   │   ├── LiveModeration.ts          # Audit trail
│   │   ├── LiveChatMessage.ts          # Chat message schema (idempotency, ordering)
│   │   └── index.ts                   # Barrel export
│   ├── repositories/
│   │   ├── LiveSessionRepository.ts   # Session data access
│   │   ├── LiveParticipantRepository.ts
│   │   ├── LiveModerationRepository.ts
│   │   ├── LiveChatMessageRepository.ts  # Chat message CRUD + pagination
│   │   └── index.ts
│   ├── services/
│   │   ├── LiveSessionService.ts      # Business logic
│   │   ├── LiveChatService.ts         # Chat business logic (idempotency, spam, moderation)
│   │   └── index.ts
│   ├── providers/                     # PROVIDER ABSTRACTION
│   │   ├── types.ts                   # LiveMediaProvider interface + MockLiveMediaProvider
│   │   ├── LiveKitMediaProvider.ts    # LiveKit implementation (ONLY file importing livekit-server-sdk)
│   │   ├── factory.ts                 # Provider switching via LIVE_PROVIDER env
│   │   └── index.ts
│   ├── socket/                        # SOCKET INFRASTRUCTURE (Phase 3C + 3C.5)
│   │   ├── index.ts                   # /live namespace setup, auth middleware, provider factory
│   │   ├── types.ts                   # Event types, Zod schemas, error codes
│   │   ├── handlers.ts               # Event handlers (join, leave, heartbeat, disconnect)
│   │   ├── chatHandlers.ts           # Chat event handlers (send, history, delete, pin)
│   │   ├── presence.ts               # Redis-backed presence system
│   │   ├── viewerCount.ts            # Redis-backed viewer count
│   │   ├── rateLimit.ts              # Socket-specific rate limiting
│   │   ├── pipeline.ts               # Event registration system + middleware execution
│   │   ├── responses.ts              # Standardized socket response helpers
│   │   ├── metrics.ts                # Infrastructure metrics (latency, errors, subscriptions)
│   │   ├── broadcast/                # BROADCAST ABSTRACTION
│   │   │   ├── types.ts              # ChatBroadcaster interface
│   │   │   ├── RedisChatBroadcaster.ts # Redis Pub/Sub implementation
│   │   │   ├── MockChatBroadcaster.ts # In-memory mock for testing
│   │   │   └── index.ts
│   │   └── middleware/               # REUSABLE MIDDLEWARE PIPELINE
│   │       ├── types.ts              # MiddlewareContext, SocketMiddleware, SocketEventConfig
│   │       ├── authenticate.ts       # JWT verification
│   │       ├── authorize.ts          # Role-based authorization
│   │       ├── validateRoom.ts       # Room membership validation
│   │       ├── rateLimit.ts          # Rate limiting via LiveRateLimiter
│   │       ├── validatePayload.ts    # Zod schema validation
│   │       ├── logging.ts            # Event logging
│   │       ├── performance.ts        # High-resolution timing
│   │       └── index.ts
│   ├── validators/
│   │   └── index.ts                   # Zod schemas
│   ├── controllers/
│   │   ├── LiveSessionController.ts   # Route handlers
│   │   └── index.ts
│   ├── routes/
│   │   └── index.ts                   # Express router with auth, rate limiting
│   └── __tests__/
│       ├── LiveSessionService.test.ts
│       ├── LiveSessionController.test.ts
│       ├── LiveKitMediaProvider.test.ts
│       ├── livekit.config.test.ts
│       ├── provider-factory.test.ts
│       ├── validators.test.ts
│       ├── models.test.ts
│       ├── repositories.test.ts
│       ├── socket-events.test.ts
│       ├── socket-rateLimit.test.ts
│       ├── socket-handlers.test.ts
│       ├── chat-repository.test.ts       # LiveChatMessageRepository tests
│       ├── chat-service.test.ts          # LiveChatService tests
│       ├── chat-handlers.test.ts         # Chat socket handler tests
│       ├── chat-spam-idempotency.test.ts # Spam, idempotency, ordering, slow mode tests
│       ├── broadcast.test.ts          # ChatBroadcaster + RedisChatBroadcaster tests
│       ├── middleware.test.ts          # Middleware pipeline tests
│       └── pipeline.test.ts           # Event registration + execution tests
├── models/                            # EXISTING MODELS (read-only)
├── controllers/                       # EXISTING CONTROLLERS
├── routes/
│   └── index.ts                       # MODIFIED — mounts live routes at /api/live
├── config/
│   └── app.ts                         # MODIFIED — add livekit config section
└── socket/
    └── index.ts                       # FUTURE — /live namespace
```

### Frontend

```
client/src/
├── live/
│   ├── types/
│   │   └── index.ts             # NEW — 150 lines
│   ├── store/
│   │   └── liveStore.ts         # NEW — 200 lines
│   ├── hooks/
│   │   ├── useLiveRoom.ts       # NEW — 150 lines
│   │   ├── useLiveChat.ts       # NEW — 120 lines
│   │   ├── useLiveGifts.ts      # NEW — 80 lines
│   │   ├── useLiveAnalytics.ts  # NEW — 60 lines
│   │   ├── useLiveModeration.ts # NEW — 50 lines
│   │   └── useLiveDiscovery.ts  # NEW — 80 lines
│   ├── services/
│   │   ├── liveApi.ts           # NEW — 150 lines
│   │   └── liveSocket.ts        # NEW — 200 lines
│   ├── components/
│   │   ├── LivePlayer.tsx       # NEW — 200 lines
│   │   ├── LiveChat.tsx         # NEW — 250 lines
│   │   ├── LiveGiftAnimation.tsx# NEW — 150 lines
│   │   ├── LiveViewerBar.tsx    # NEW — 100 lines
│   │   ├── LiveHostControls.tsx # NEW — 150 lines
│   │   ├── LiveProductCard.tsx  # NEW — 80 lines
│   │   ├── LiveBookingCTA.tsx   # NEW — 80 lines
│   │   ├── LiveReportModal.tsx  # NEW — 100 lines
│   │   ├── LiveModerationPanel.tsx # NEW — 120 lines
│   │   ├── LiveReplayPlayer.tsx # NEW — 150 lines
│   │   ├── LiveDiscoveryFeed.tsx# NEW — 200 lines
│   │   └── LiveSkeleton.tsx     # NEW — 60 lines
│   └── pages/
│       ├── LiveHostPage.tsx     # NEW — 200 lines
│       ├── LiveViewerPage.tsx   # NEW — 200 lines
│       ├── LiveDiscoveryPage.tsx# NEW — 100 lines
│       └── LiveReplayPage.tsx   # NEW — 100 lines
```

**Total new code:** ~5,700 lines (backend ~2,900 + frontend ~2,800)

### Files Modified (Minimal)

| File | Change | Lines Added |
|------|--------|:-----------:|
| `server/src/routes/index.ts` | Import + mount live routes | 2 |
| `server/src/config/app.ts` | Add LiveKit config fields | 6 |
| `server/src/socket/index.ts` | Import + initialize `/live` namespace | 5 |
| `server/src/models/Notification.ts` | Add `'live'` to enum | 1 |
| `server/src/utils/notify.ts` | Add live notification helpers | 30 |
| `server/src/queues/hairstyleQueue.ts` | No change — new `liveQueue.ts` created | 0 |
| `client/src/App.tsx` | Wrap with LiveProvider | 3 |
| `client/src/router/AppRouter.tsx` | Add lazy live routes | 8 |
| `client/src/services/socket.ts` | Add live socket utilities | 30 |
| `server/package.json` | Add `livekit-server-sdk`, `bad-words` | 2 |
| `client/package.json` | Add `@livekit/components-react`, `livekit-client` | 2 |

---

## 8. Error Handling Strategy

### Backend

| Error Type | Pattern | Example |
|-----------|---------|---------|
| Validation | Zod schema → ApiError(400) | Invalid sessionId format |
| Authentication | ApiError(401) | Missing/invalid token |
| Authorization | ApiError(403) | Viewer trying to end session |
| Not Found | ApiError(404) | Session doesn't exist |
| Conflict | ApiError(409) | Already joined room |
| Rate Limit | ApiError(429) | Chat spam |
| Business Logic | ApiError(400/409) | Session not live, muted user |
| External Service | Try/catch + logger + fallback | LiveKit API failure |

### Frontend

| Error Type | Pattern | Example |
|-----------|---------|---------|
| Network | Toast + retry | API timeout |
| Socket disconnect | Auto-reconnect + UI indicator | Server restart |
| LiveKit failure | Fallback UI + reconnect | WebRTC failure |
| Permission denied | Redirect + toast | Mic/camera denied |
| Moderation | Toast + state update | Muted by host |

---

## 9. Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|------|---------------|-----|-------------|
| Active live sessions | Redis hash `live:active` | 30s | Session start/end |
| Viewer count per session | Redis hash `live:viewers:{id}` | None (real-time) | Join/leave events |
| Like count per session | Redis hash `live:likes:{id}` | None (real-time) | Like events |
| Gift leaderboard | Redis sorted set `live:leaderboard:{id}` | None (real-time) | Gift events |
| Chat slow-mode last message | Redis key `live:slowmode:{userId}:{sessionId}` | slowModeMs | New message |
| User mute status | Redis hash `live:muted:{sessionId}` | None (real-time) | Mute/unmute |
| User ban status | Redis hash `live:banned:{sessionId}` | None (real-time) | Ban/unban |
| Discovery feed | Redis cache `live:discovery:{filter}` | 30s | Session changes |
| Gift catalog | Redis cache `live:gifts:catalog` | 300s | Admin update |

---

## 10. Graceful Degradation

| Failure | Degraded Behavior |
|---------|------------------|
| Redis unavailable | Chat works on single instance; no cross-instance broadcast. Viewers on different instances see different chat. Rate limiting falls back to in-memory. |
| MongoDB unavailable | New sessions cannot be created. Existing sessions continue (LiveKit independent). Chat messages lost (not persisted). |
| LiveKit unavailable | Video fails. Chat and gifts continue. UI shows "Video unavailable" with retry. |
| Bull queue unavailable | Replays not generated. Live sessions unaffected. |
| Cloudinary unavailable | Thumbnails not generated. Replays use LiveKit egress direct URL. |

---

*End of LIVE_ARCHITECTURE.md*
