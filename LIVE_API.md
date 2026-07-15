# LIVE_API.md

> **GlowUp Live — REST API Design**  
> Phase 2 — Architecture Design  
> Date: July 15, 2026

---

## 1. Overview

All live streaming REST endpoints are mounted under `/api/live`. The API follows the existing GlowUp conventions:
- `protect` middleware for authenticated routes
- `requireRole('stylist')` for host-only routes
- `softAuth` for optional authentication (discovery feed)
- Zod validation via `validate()` and `validateQuery()` middleware
- `sendSuccess` / `sendPaginated` response format
- `asyncHandler` wrapper on all handlers

---

## 2. Endpoint Catalog

### 2.0 Health Check

#### GET `/api/live/health` — Provider health check

| | |
|---|---|
| **Auth** | None (internal monitoring) |
| **Rate Limit** | None |
| **Response** | `{ success: boolean, data: { healthy: boolean, provider: string, latencyMs: number, details: string, timestamp: string } }` |
| **Status** | 200 (healthy) or 503 (unhealthy) |
| **Use** | Monitoring, load balancer health checks, debugging |

### 2.1 Session Management

#### POST `/api/live/sessions` — Create a live session

| | |
|---|---|
| **Auth** | Required (stylist) |
| **Rate Limit** | generalLimiter (500/15min) |
| **Body** | `{ title: string, description?: string, category?: string, tags?: string[], scheduledAt?: string }` |
| **Validation** | title: required, 1-200 chars. description: optional, max 2000 chars. category: optional, max 50 chars. tags: optional, array of max 10 strings (each max 30 chars). scheduledAt: optional ISO date string (must be future). |
| **Action** | 1. Find stylist profile for user. 2. Check no active session exists. 3. Generate room name `live_{stylistId}_{timestamp}`. 4. Create LiveKit room via API. 5. Create LiveSession document. |
| **Response** | `{ success: true, data: { session: LiveSession, livekit: { roomName: string } } }` |
| **Status** | 201 |
| **Errors** | 400: Validation failed. 404: Stylist profile not found. 409: Active session already exists. |
| **OpenAPI** | `operationId: createLiveSession`, `tags: [Live, Sessions]` |

#### GET `/api/live/sessions/:id` — Get session details

| | |
|---|---|
| **Auth** | Soft (optional) |
| **Rate Limit** | readLimiter (300/15min) |
| **Params** | `id`: ObjectId |
| **Response** | `{ success: true, data: { session: LiveSession } }` — includes populated stylist info |
| **Errors** | 404: Not found |
| **OpenAPI** | `operationId: getLiveSession` |

#### PATCH `/api/live/sessions/:id/start` — Start a live stream

| | |
|---|---|
| **Auth** | Required (stylist — must own session) |
| **Params** | `id`: ObjectId |
| **Action** | Set status to `live`, set `startedAt`. Generate host LiveKit token. |
| **Response** | `{ success: true, data: { session, token: string } }` |
| **Errors** | 403: Not owner. 409: Already live. 404: Not found. |
| **OpenAPI** | `operationId: startLiveSession` |

#### PATCH `/api/live/sessions/:id/pause` — Pause the stream

| | |
|---|---|
| **Auth** | Required (stylist — must own session) |
| **Response** | `{ success: true, data: { session } }` |
| **Errors** | 403: Not owner. 409: Not live. |
| **OpenAPI** | `operationId: pauseLiveSession` |

#### PATCH `/api/live/sessions/:id/resume` — Resume the stream

| | |
|---|---|
| **Auth** | Required (stylist — must own session) |
| **Response** | `{ success: true, data: { session } }` |
| **Errors** | 403: Not owner. 409: Not paused. |
| **OpenAPI** | `operationId: resumeLiveSession` |

#### PATCH `/api/live/sessions/:id/end` — End the stream

| | |
|---|---|
| **Auth** | Required (stylist — must own session) |
| **Action** | Set status `ended`, record `endedAt`, calculate `durationMs`, queue replay worker, notify all viewers. |
| **Response** | `{ success: true, data: { session } }` |
| **Errors** | 403: Not owner. 409: Already ended. |
| **OpenAPI** | `operationId: endLiveSession` |

#### GET `/api/live/sessions/:id/token` — Generate join token

| | |
|---|---|
| **Auth** | Required |
| **Params** | `id`: ObjectId |
| **Action** | 1. Verify session is live/paused. 2. Check not banned. 3. Check followers-only. 4. Generate LiveKit JWT with appropriate permissions (host= publish+subscribe, viewer= subscribe only). |
| **Response** | `{ success: true, data: { token: string, roomName: string, expiresAt: string } }` |
| **Errors** | 403: Banned/followers-only. 404: Session not found. 409: Room full. |
| **OpenAPI** | `operationId: getLiveToken` |

---

### 2.2 Discovery & Feed

#### GET `/api/live/featured` — Featured live sessions

| | |
|---|---|
| **Auth** | Soft |
| **Query** | `limit?: number (default: 20, max: 50)` |
| **Action** | Query LiveSession where status=`live`, sorted by `peakViewerCount DESC, likeCount DESC`. Populate stylist info. |
| **Response** | `{ success: true, data: { sessions: LiveSession[] } }` |
| **Cache** | Redis `live:featured`, TTL 30s |
| **OpenAPI** | `operationId: getFeaturedLive` |

#### GET `/api/live/discover` — Discovery feed (paginated)

| | |
|---|---|
| **Auth** | Soft |
| **Query** | `category?: string, tag?: string, sort?: 'trending' | 'newest' | 'popular', cursor?: string, limit?: number (default: 20)` |
| **Action** | Query with filters, cursor-based pagination. |
| **Response** | `{ success: true, data: { sessions: LiveSession[], nextCursor?: string } }` |
| **Cache** | Redis `live:discovery:{hash}`, TTL 30s |
| **OpenAPI** | `operationId: discoverLive` |

#### GET `/api/live/following` — Sessions from followed stylists

| | |
|---|---|
| **Auth** | Required |
| **Query** | `cursor?: string, limit?: number` |
| **Action** | Load user's followed stylist IDs (from User.favorites). Query LiveSession where stylistId in favorites, status=`live`. |
| **Response** | `{ success: true, data: { sessions: LiveSession[], nextCursor?: string } }` |
| **OpenAPI** | `operationId: getFollowingLive` |

#### GET `/api/live/nearby` — Nearby live sessions

| | |
|---|---|
| **Auth** | Required |
| **Query** | `lat: number, lng: number, radius?: number (km, default: 50), limit?: number` |
| **Action** | Geo-query: find stylists within radius. Filter for live sessions. |
| **Response** | `{ success: true, data: { sessions: LiveSession[] } }` |
| **OpenAPI** | `operationId: getNearbyLive` |

---

### 2.3 Replay

#### GET `/api/live/replays` — List replays

| | |
|---|---|
| **Auth** | Soft |
| **Query** | `stylistId?: string, category?: string, cursor?: string, limit?: number` |
| **Response** | `{ success: true, data: { replays: LiveReplay[], nextCursor?: string } }` |
| **OpenAPI** | `operationId: listReplays` |

#### GET `/api/live/replays/:id` — Get single replay

| | |
|---|---|
| **Auth** | Soft |
| **Action** | Increment `viewCount`. Return replay with populated stylist info. |
| **Response** | `{ success: true, data: { replay: LiveReplay } }` |
| **OpenAPI** | `operationId: getReplay` |

---

### 2.4 Chat (REST — Fallback/Pagination)

#### GET `/api/live/sessions/:id/messages` — Get chat history

| | |
|---|---|
| **Auth** | Required |
| **Params** | `id`: sessionId |
| **Query** | `before?: string (messageId cursor), limit?: number (default: 50, max: 100)` |
| **Action** | Paginated query: find messages older than `before` cursor, exclude deleted (unless requester is mod). |
| **Response** | `{ success: true, data: { messages: LiveChatMessage[], hasMore: boolean } }` |
| **OpenAPI** | `operationId: getChatMessages` |

#### DELETE `/api/live/sessions/:id/messages/:msgId` — Delete message

| | |
|---|---|
| **Auth** | Required (host or moderator) |
| **Action** | Soft-delete message. Create moderation record. |
| **Response** | `{ success: true }` |
| **Errors** | 403: Not authorized. 404: Message not found. |
| **OpenAPI** | `operationId: deleteChatMessage` |

---

### 2.5 Gifts

#### GET `/api/live/gifts/catalog` — Gift catalog

| | |
|---|---|
| **Auth** | Public |
| **Response** | `{ success: true, data: { gifts: GiftCatalogItem[] } }` — In-memory catalog, no DB query |
| **Cache** | Redis `live:gifts:catalog`, TTL 300s |
| **OpenAPI** | `operationId: getGiftCatalog` |

#### GET `/api/live/gifts/balance` — User credit balance

| | |
|---|---|
| **Auth** | Required |
| **Response** | `{ success: true, data: { balance: number, lifetimeCredits: number } }` |
| **OpenAPI** | `operationId: getGiftBalance` |

#### GET `/api/live/sessions/:id/leaderboard` — Gift leaderboard

| | |
|---|---|
| **Auth** | Soft |
| **Params** | `id`: sessionId |
| **Query** | `period?: 'all' | 'daily' | 'weekly' (default: 'all'), limit?: number (default: 10)` |
| **Action** | Aggregate LiveGift by senderId, sum totalCredits, sort descending. |
| **Response** | `{ success: true, data: { leaderboard: Array<{ userId, name, avatar, totalCredits, giftCount }> } }` |
| **Cache** | Redis sorted set `live:leaderboard:{sessionId}`, real-time |
| **OpenAPI** | `operationId: getGiftLeaderboard` |

#### GET `/api/live/gifts/history` — User's gift history

| | |
|---|---|
| **Auth** | Required |
| **Query** | `cursor?: string, limit?: number` |
| **Response** | `{ success: true, data: { gifts: LiveGift[], nextCursor?: string } }` |
| **OpenAPI** | `operationId: getGiftHistory` |

---

### 2.6 Moderation

#### POST `/api/live/sessions/:id/report` — Report stream

| | |
|---|---|
| **Auth** | Required |
| **Body** | `{ reason: string, details?: string }` |
| **Validation** | reason: required, max 500. details: optional, max 1000. |
| **Action** | Create moderation record. Increment `reportCount`. If >= 5, set `isUnderReview`. |
| **Response** | `{ success: true }` |
| **Errors** | 409: Already reported |
| **Rate Limit** | 3 per 10 minutes |
| **OpenAPI** | `operationId: reportStream` |

#### POST `/api/live/sessions/:id/messages/:msgId/report` — Report message

| | |
|---|---|
| **Auth** | Required |
| **Body** | `{ reason: string }` |
| **Response** | `{ success: true }` |
| **OpenAPI** | `operationId: reportMessage` |

#### GET `/api/live/sessions/:id/moderation-log` — Audit log

| | |
|---|---|
| **Auth** | Required (host or moderator) |
| **Query** | `action?: string, cursor?: string, limit?: number` |
| **Response** | `{ success: true, data: { actions: LiveModeration[], hasMore: boolean } }` |
| **OpenAPI** | `operationId: getModerationLog` |

---

### 2.7 Pinned Items

#### POST `/api/live/sessions/:id/pin/product` — Pin product

| | |
|---|---|
| **Auth** | Required (stylist — must own session) |
| **Body** | `{ productId: string }` |
| **Action** | Verify product belongs to stylist. Add to `pinnedProducts`. |
| **Response** | `{ success: true, data: { pinnedProducts } }` |
| **Errors** | 404: Product not found. 403: Not your product. |
| **OpenAPI** | `operationId: pinProduct` |

#### DELETE `/api/live/sessions/:id/pin/product/:productId` — Unpin product

| | |
|---|---|
| **Auth** | Required (stylist) |
| **Response** | `{ success: true }` |
| **OpenAPI** | `operationId: unpinProduct` |

#### POST `/api/live/sessions/:id/pin/service` — Pin service

| | |
|---|---|
| **Auth** | Required (stylist) |
| **Body** | `{ serviceId: string }` |
| **Response** | `{ success: true, data: { pinnedServices } }` |
| **OpenAPI** | `operationId: pinService` |

#### DELETE `/api/live/sessions/:id/pin/service/:serviceId` — Unpin service

| | |
|---|---|
| **Auth** | Required (stylist) |
| **Response** | `{ success: true }` |
| **OpenAPI** | `operationId: unpinService` |

#### GET `/api/live/sessions/:id/pinned` — Get pinned items

| | |
|---|---|
| **Auth** | Soft |
| **Response** | `{ success: true, data: { products: Product[], services: Service[] } }` |
| **OpenAPI** | `operationId: getPinnedItems` |

---

### 2.8 Analytics (Host Only)

#### GET `/api/live/sessions/:id/analytics` — Session analytics

| | |
|---|---|
| **Auth** | Required (stylist — must own session) |
| **Response** | `{ success: true, data: { viewerCount, peakViewerCount, totalViews, uniqueViewerCount, likeCount, chatMessageCount, giftCount, totalGiftValue, bookingCount, averageWatchTimeMs, durationMs } }` |
| **OpenAPI** | `operationId: getSessionAnalytics` |

#### GET `/api/live/analytics/overview` — Host's overall analytics

| | |
|---|---|
| **Auth** | Required (stylist) |
| **Query** | `period?: '7d' | '30d' | '90d' (default: '30d')` |
| **Action** | Aggregate across all host's sessions. |
| **Response** | `{ success: true, data: { totalSessions, totalViews, totalDuration, totalGiftRevenue, totalBookings, averageViewers, topSession } }` |
| **OpenAPI** | `operationId: getHostAnalytics` |

---

## 3. OpenAPI Structure

```yaml
openapi: 3.0.3
info:
  title: GlowUp Live API
  version: 1.0.0
  description: Live streaming platform API

servers:
  - url: /api

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    LiveSession:
      type: object
      properties:
        _id: { type: string }
        stylistId: { type: string }
        hostUserId: { type: string }
        title: { type: string }
        status: { type: string, enum: [scheduled, live, paused, ended] }
        roomName: { type: string }
        viewerCount: { type: integer }
        likeCount: { type: integer }
        # ... (full schema in LIVE_DATABASE.md)

    LiveChatMessage:
      type: object
      properties:
        _id: { type: string }
        content: { type: string }
        senderName: { type: string }
        senderAvatar: { type: string }
        type: { type: string, enum: [text, emoji, gift, system, pinned] }
        createdAt: { type: string, format: date-time }

    LiveGift:
      type: object
      properties:
        _id: { type: string }
        giftType: { type: string }
        giftName: { type: string }
        totalCredits: { type: integer }
        senderName: { type: string }
        quantity: { type: integer }
        createdAt: { type: string, format: date-time }

    GiftCatalogItem:
      type: object
      properties:
        type: { type: string }
        name: { type: string }
        value: { type: integer }
        emoji: { type: string }
        animation: { type: string }

    Error:
      type: object
      properties:
        success: { type: boolean, enum: [false] }
        message: { type: string }

    Pagination:
      type: object
      properties:
        total: { type: integer }
        page: { type: integer }
        limit: { type: integer }
        totalPages: { type: integer }
        hasMore: { type: boolean }

paths:
  /live/sessions:
    post: { operationId: createLiveSession, security: [{ bearerAuth: [] }], tags: [Live, Sessions] }
  /live/sessions/{id}:
    get: { operationId: getLiveSession, tags: [Live, Sessions] }
  /live/sessions/{id}/start:
    patch: { operationId: startLiveSession, security: [{ bearerAuth: [] }], tags: [Live, Sessions] }
  /live/sessions/{id}/pause:
    patch: { operationId: pauseLiveSession, security: [{ bearerAuth: [] }], tags: [Live, Sessions] }
  /live/sessions/{id}/resume:
    patch: { operationId: resumeLiveSession, security: [{ bearerAuth: [] }], tags: [Live, Sessions] }
  /live/sessions/{id}/end:
    patch: { operationId: endLiveSession, security: [{ bearerAuth: [] }], tags: [Live, Sessions] }
  /live/sessions/{id}/token:
    get: { operationId: getLiveToken, security: [{ bearerAuth: [] }], tags: [Live, Sessions] }
  /live/featured:
    get: { operationId: getFeaturedLive, tags: [Live, Discovery] }
  /live/discover:
    get: { operationId: discoverLive, tags: [Live, Discovery] }
  /live/following:
    get: { operationId: getFollowingLive, security: [{ bearerAuth: [] }], tags: [Live, Discovery] }
  /live/nearby:
    get: { operationId: getNearbyLive, security: [{ bearerAuth: [] }], tags: [Live, Discovery] }
  /live/replays:
    get: { operationId: listReplays, tags: [Live, Replays] }
  /live/replays/{id}:
    get: { operationId: getReplay, tags: [Live, Replays] }
  /live/sessions/{id}/messages:
    get: { operationId: getChatMessages, security: [{ bearerAuth: [] }], tags: [Live, Chat] }
  /live/sessions/{id}/messages/{msgId}:
    delete: { operationId: deleteChatMessage, security: [{ bearerAuth: [] }], tags: [Live, Chat] }
  /live/gifts/catalog:
    get: { operationId: getGiftCatalog, tags: [Live, Gifts] }
  /live/gifts/balance:
    get: { operationId: getGiftBalance, security: [{ bearerAuth: [] }], tags: [Live, Gifts] }
  /live/sessions/{id}/leaderboard:
    get: { operationId: getGiftLeaderboard, tags: [Live, Gifts] }
  /live/gifts/history:
    get: { operationId: getGiftHistory, security: [{ bearerAuth: [] }], tags: [Live, Gifts] }
  /live/sessions/{id}/report:
    post: { operationId: reportStream, security: [{ bearerAuth: [] }], tags: [Live, Moderation] }
  /live/sessions/{id}/moderation-log:
    get: { operationId: getModerationLog, security: [{ bearerAuth: [] }], tags: [Live, Moderation] }
  /live/sessions/{id}/pin/product:
    post: { operationId: pinProduct, security: [{ bearerAuth: [] }], tags: [Live, Pins] }
    delete: { operationId: unpinProduct, security: [{ bearerAuth: [] }], tags: [Live, Pins] }
  /live/sessions/{id}/pin/service:
    post: { operationId: pinService, security: [{ bearerAuth: [] }], tags: [Live, Pins] }
    delete: { operationId: unpinService, security: [{ bearerAuth: [] }], tags: [Live, Pins] }
  /live/sessions/{id}/pinned:
    get: { operationId: getPinnedItems, tags: [Live, Pins] }
  /live/sessions/{id}/analytics:
    get: { operationId: getSessionAnalytics, security: [{ bearerAuth: [] }], tags: [Live, Analytics] }
  /live/analytics/overview:
    get: { operationId: getHostAnalytics, security: [{ bearerAuth: [] }], tags: [Live, Analytics] }
```

---

## 4. Rate Limits Summary

| Endpoint Category | Limit | Window | Key |
|------------------|-------|--------|-----|
| Session CRUD | 500/15min | General | IP + user |
| Discovery/Read | 300/15min | Read | IP |
| Gift send | 10/min | Socket | userId |
| Report | 3/10min | Per endpoint | userId + sessionId |
| Chat message | 30/min | Socket | userId + sessionId |
| Like | 60/min | Socket | userId |
| Pin/Unpin | 5/min | Socket | userId |

---

*End of LIVE_API.md*
