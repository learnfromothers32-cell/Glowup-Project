# LIVE_DATABASE.md

> **GlowUp Live — Database Design**  
> Phase 2 — Architecture Design  
> Date: July 15, 2026

---

## 1. Overview

All live streaming data is stored in MongoDB Atlas (same cluster as existing GlowUp data). Five new collections are introduced. Existing collections (User, Stylist, Booking, Queue, Product, Service, UserCredit, Notification) are consumed read-only or with minimal field additions.

**Naming convention:** Collection names are camelCase with `live` prefix to avoid collision.

---

## 2. New Collections

### 2.1 LiveSession

**Collection:** `liveSessions`

The authoritative record for every live stream. One document per stream attempt.

```typescript
interface ILiveSession {
  _id: ObjectId;
  
  // ── Relationships ──
  stylistId: ObjectId;        // ref: Stylist — required, indexed
  hostUserId: ObjectId;       // ref: User — required
  
  // ── Content ──
  title: string;              // required, maxLength: 200
  description: string;        // maxLength: 2000, default: ''
  category: string;           // required, indexed (matches Stylist.category values)
  tags: string[];             // default: [], max 10 items, each maxLength: 30
  
  // ── State ──
  status: 'scheduled' | 'live' | 'paused' | 'ended';
  
  // ── LiveKit ──
  roomName: string;           // unique — LiveKit room identifier, format: `live_{stylistId}_{timestamp}`
  
  // ── Metrics (real-time, authoritative in MongoDB) ──
  viewerCount: number;        // default: 0 — current connected viewers
  peakViewerCount: number;    // default: 0 — high-water mark
  totalViews: number;         // default: 0 — cumulative unique views
  uniqueViewerCount: number;  // default: 0 — distinct viewer IDs
  likeCount: number;          // default: 0
  chatMessageCount: number;   // default: 0
  giftCount: number;          // default: 0
  totalGiftValue: number;     // default: 0 — sum of all gift credits
  bookingCount: number;       // default: 0
  
  // ── Settings ──
  settings: {
    chatEnabled: boolean;     // default: true
    slowModeMs: number;       // default: 0 (0 = disabled)
    followersOnly: boolean;   // default: false
    giftsEnabled: boolean;    // default: true
    recordingEnabled: boolean;// default: true
    maxViewers: number;       // default: 10000
  };
  
  // ── Pinned Items ──
  pinnedProducts: Array<{
    productId: ObjectId;      // ref: Product
    pinnedAt: Date;
  }>;
  pinnedServices: Array<{
    serviceId: ObjectId;      // ref: Service
    pinnedAt: Date;
  }>;
  
  // ── Lifecycle ──
  scheduledAt?: Date;         // for scheduled streams
  startedAt?: Date;
  pausedAt?: Date;
  endedAt?: Date;
  durationMs: number;         // default: 0 — total live duration
  
  // ── Replay ──
  replayUrl?: string;         // Cloudinary URL of processed recording
  thumbnailUrl?: string;      // Cloudinary URL of auto-generated thumbnail
  replayStatus: 'none' | 'processing' | 'ready' | 'failed';
  
  // ── Analytics (computed on end, cached) ──
  averageWatchTimeMs: number; // default: 0
  
  // ── Moderation ──
  reportCount: number;        // default: 0
  isUnderReview: boolean;     // default: false
  
  // ── Timestamps ──
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**

| Index | Fields | Type | Purpose |
|-------|--------|------|---------|
| `stylistId_1_status_1` | `{ stylistId: 1, status: 1 }` | Compound | Host's sessions query, find active session |
| `status_1_category_1_startedAt_-1` | `{ status: 1, category: 1, startedAt: -1 }` | Compound | Discovery feed: filter by status + category, sort by newest |
| `status_1_peakViewerCount_-1` | `{ status: 1, peakViewerCount: -1 }` | Compound | Discovery feed: trending/popular |
| `status_1_startedAt_-1` | `{ status: 1, startedAt: -1 }` | Compound | Discovery feed: newest live |
| `roomName_1` | `{ roomName: 1 }` | Unique | Lookup by LiveKit room name |
| `stylistId_1_status_1` (partial) | `{ stylistId: 1, status: 1 }` partialFilterExpression: `{ status: { $in: ['live', 'paused'] } }` | Partial Unique | **One active session per stylist** — prevents duplicate live streams |
| `tags_1_status_1` | `{ tags: 1, status: 1 }` | Compound | Tag-based discovery |
| `scheduledAt_1` (partial) | `{ scheduledAt: 1 }` partialFilterExpression: `{ status: 'scheduled' }` | Partial | Scheduled stream lookup |

**Why each index exists:**
- `stylistId_1_status_1`: Every query from the host side filters by their stylist ID + status. Also used to check if a stylist already has an active session.
- `status_1_category_1_startedAt_-1`: The primary discovery feed query — "show me live sessions in this category, newest first."
- `status_1_peakViewerCount_-1`: Trending tab — "show me the most popular live sessions."
- `roomName_1`: Unique lookup when LiveKit webhook fires with a room name.
- Partial unique on `stylistId + status`: Business rule — a stylist cannot run two simultaneous live streams.
- `tags_1_status_1`: Tag-based filtering for category pages.
- `scheduledAt_1`: Upcoming scheduled streams notification.

---

### 2.2 LiveChatMessage

**Collection:** `liveChatMessages`

Persisted chat messages with TTL-based cleanup.

```typescript
interface ILiveChatMessage {
  _id: ObjectId;
  
  // ── Relationships ──
  sessionId: ObjectId;        // ref: LiveSession — required, indexed
  
  // ── Sender ──
  senderId: ObjectId;         // ref: User — required
  senderName: string;         // denormalized for performance
  senderAvatar?: string;      // denormalized
  senderRole: 'host' | 'moderator' | 'viewer';
  
  // ── Content ──
  content: string;            // required, maxLength: 500
  type: 'text' | 'emoji' | 'gift' | 'system' | 'pinned';
  
  // ── Threading ──
  replyTo?: ObjectId;         // ref: LiveChatMessage — for reply threading
  
  // ── Moderation ──
  isDeleted: boolean;         // default: false (soft delete)
  deletedBy?: ObjectId;       // ref: User — who deleted it
  deletedReason?: string;     // moderation reason
  isFiltered: boolean;        // default: false — profanity filter flagged
  originalContent?: string;   // original before filtering
  
  // ── Timestamps ──
  createdAt: Date;            // TTL: 2592000 seconds (30 days)
}
```

**Indexes:**

| Index | Fields | Type | Purpose |
|-------|--------|------|---------|
| `sessionId_1_createdAt_-1` | `{ sessionId: 1, createdAt: -1 }` | Compound | Chat history: newest messages first for a session |
| `sessionId_1_createdAt_1` | `{ sessionId: 1, createdAt: 1 }` | Compound | Chat history: load older messages (pagination) |
| TTL index | `{ createdAt: 1 }` | TTL (2592000s) | Auto-delete messages after 30 days |

**Why each index exists:**
- `sessionId_1_createdAt_-1`: Primary query — fetch latest N messages for a session when viewer joins.
- `sessionId_1_createdAt_1`: Pagination — "load more" scrolls to older messages.
- TTL index: Automatic cleanup — chat messages are ephemeral, no manual deletion needed.

**Design decision:** Messages are soft-deleted (`isDeleted: true`) rather than physically deleted, so moderation can reference them and the UI can show "[message deleted]" placeholders.

---

### 2.3 LiveGift

**Collection:** `liveGifts`

Immutable ledger of all gift transactions. Every document represents one gift send.

```typescript
interface ILiveGift {
  _id: ObjectId;
  
  // ── Relationships ──
  sessionId: ObjectId;        // ref: LiveSession — required, indexed
  senderId: ObjectId;         // ref: User — required, indexed
  recipientId: ObjectId;      // ref: User (the host) — required
  
  // ── Gift Details ──
  giftType: string;           // required — key from gift catalog (e.g., 'rose', 'diamond', 'crown')
  giftName: string;           // denormalized display name
  giftValue: number;          // credits cost — denormalized from catalog
  quantity: number;           // default: 1, min: 1, max: 100
  
  // ── Financial ──
  totalCredits: number;       // giftValue * quantity — debited from sender
  senderBalanceBefore: number;// snapshot of sender balance before debit
  senderBalanceAfter: number; // snapshot of sender balance after debit
  
  // ── Idempotency ──
  idempotencyKey: string;     // unique, required — client-generated UUID v4
  
  // ── Status ──
  status: 'completed' | 'failed' | 'refunded';
  failureReason?: string;
  
  // ── Audit ──
  createdAt: Date;
}
```

**Indexes:**

| Index | Fields | Type | Purpose |
|-------|--------|------|---------|
| `sessionId_1_createdAt_-1` | `{ sessionId: 1, createdAt: -1 }` | Compound | Session gift feed + leaderboard source |
| `senderId_1_createdAt_-1` | `{ senderId: 1, createdAt: -1 }` | Compound | User gift history |
| `idempotencyKey_1` | `{ idempotencyKey: 1 }` | Unique | Prevent duplicate gift sends |
| `sessionId_1_senderId_1` (partial) | `{ sessionId: 1, senderId: 1 }` partialFilterExpression: `{ status: 'completed' }` | Compound | Per-user leaderboard computation |

**Why each index exists:**
- `sessionId_1_createdAt_-1`: Gift feed for a session, leaderboard aggregation source.
- `senderId_1_createdAt_-1`: User's gift history page.
- `idempotencyKey_1`: **Critical for financial integrity** — prevents double-sends on network retries or socket duplicates.
- `sessionId_1_senderId_1` (partial): Aggregation pipeline for per-sender gift totals (leaderboard).

---

### 2.4 LiveReplay

**Collection:** `liveReplays`

Metadata for completed stream recordings.

```typescript
interface ILiveReplay {
  _id: ObjectId;
  
  // ── Relationships ──
  sessionId: ObjectId;        // ref: LiveSession — required, unique
  stylistId: ObjectId;        // ref: Stylist — required, indexed
  
  // ── Content ──
  title: string;              // denormalized from session
  description: string;        // denormalized
  category: string;           // denormalized
  
  // ── Media ──
  videoUrl: string;           // Cloudinary or LiveKit Egress URL
  thumbnailUrl: string;       // Cloudinary URL
  durationMs: number;
  
  // ── Stats (snapshot at end of stream) ──
  viewCount: number;          // default: 0 — replay views (not live views)
  likeCount: number;          // default: 0
  commentCount: number;       // default: 0
  
  // ── Lifecycle ──
  status: 'processing' | 'ready' | 'failed';
  processedAt?: Date;
  
  // ── Retention ──
  expiresAt?: Date;           // TTL index — optional expiration
  isArchived: boolean;        // default: false
  
  // ── Timestamps ──
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**

| Index | Fields | Type | Purpose |
|-------|--------|------|---------|
| `sessionId_1` | `{ sessionId: 1 }` | Unique | One replay per session |
| `stylistId_1_createdAt_-1` | `{ stylistId: 1, createdAt: -1 }` | Compound | Stylist's replay gallery |
| `status_1_createdAt_-1` | `{ status: 1, createdAt: -1 }` | Compound | Discovery: ready replays |
| TTL index (optional) | `{ expiresAt: 1 }` | TTL | Auto-expire archived replays |

---

### 2.5 LiveModeration

**Collection:** `liveModerations`

Audit log of all moderation actions. Append-only.

```typescript
interface ILiveModeration {
  _id: ObjectId;
  
  // ── Context ──
  sessionId: ObjectId;        // ref: LiveSession — required, indexed
  
  // ── Action ──
  action: 'mute' | 'unmute' | 'kick' | 'ban' | 'unban' | 'delete_message' | 'report' | 'slow_mode_change' | 'chat_toggle' | 'gifts_toggle';
  
  // ── Target ──
  targetUserId?: ObjectId;    // ref: User — who was affected
  targetMessageId?: ObjectId; // ref: LiveChatMessage — which message was affected
  
  // ── Actor ──
  performedBy: ObjectId;      // ref: User — who performed the action
  
  // ── Details ──
  reason?: string;            // maxLength: 500
  metadata?: Record<string, any>;
  
  // ── Timestamps ──
  createdAt: Date;
}
```

**Indexes:**

| Index | Fields | Type | Purpose |
|-------|--------|------|---------|
| `sessionId_1_createdAt_-1` | `{ sessionId: 1, createdAt: -1 }` | Compound | Moderation audit log for session |
| `sessionId_1_targetUserId_1` | `{ sessionId: 1, targetUserId: 1 }` | Compound | Check if user is banned/muted |
| `sessionId_1_action_1_createdAt_-1` | `{ sessionId: 1, action: 1, createdAt: -1 }` | Compound | Filtered audit log queries |

---

## 3. Existing Collection Modifications

### 3.1 Notification — Add `'live'` Type

```typescript
// In server/src/models/Notification.ts
// BEFORE:
type: { enum: ['booking', 'stylist', 'badge', 'promo', 'reminder', 'follow', 'waitlist'] }

// AFTER:
type: { enum: ['booking', 'stylist', 'badge', 'promo', 'reminder', 'follow', 'waitlist', 'live'] }
```

**Migration:** No data migration needed. Existing documents have no `'live'` type. New documents use the new type.

### 3.2 UserCredit — No Schema Changes

The existing `UserCredit` model with `balance`, `lifetimeCredits`, and `transactions[]` array is fully reused for gift wallet operations. Gift debits are recorded as `{ type: 'usage', amount: -N, description: 'Gift: Rose x1', reference: giftId }`.

**Concern:** The `transactions` array grows unbounded. For users with high gift volume, this could become large.

**Mitigation:** Add a utility function to archive old transactions (keep last 500, archive rest to a separate `UserCreditArchive` collection). This is a future optimization, not blocking.

### 3.3 Stylist — No Schema Changes

Read-only access for:
- `followerCount`: Used to determine "followers only" eligibility
- `name`, `image`: Denormalized into LiveSession and LiveChatMessage for display
- `category`: Used for discovery feed filtering

---

## 4. Transaction Patterns

### 4.1 Gift Send (Critical — Financial Integrity)

```typescript
async function sendGifttransaction(
  sessionId: string,
  senderId: string,
  giftType: string,
  quantity: number,
  idempotencyKey: string,
) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // 1. Idempotency check (within transaction for atomicity)
      const existing = await LiveGift.findOne({ idempotencyKey }).session(session);
      if (existing) {
        if (existing.status === 'completed') return existing; // Idempotent return
        throw new ApiError(409, 'Gift transaction in progress');
      }
      
      // 2. Load gift catalog entry
      const giftDef = GIFT_CATALOG[giftType];
      if (!giftDef) throw new ApiError(404, 'Gift not found');
      const totalCredits = giftDef.value * quantity;
      
      // 3. Debit sender (atomic findOneAndUpdate with balance check)
      const senderCredit = await UserCredit.findOneAndUpdate(
        { userId: senderId, balance: { $gte: totalCredits } },
        {
          $inc: { balance: -totalCredits },
          $push: {
            transactions: {
              $each: [{
                type: 'usage',
                amount: -totalCredits,
                description: `Gift: ${giftDef.name} x${quantity}`,
                createdAt: new Date(),
              }],
              $slice: -500,  // Keep last 500 transactions inline
            },
          },
        },
        { new: true, session }
      );
      if (!senderCredit) throw new ApiError(400, 'Insufficient credits');
      
      // 4. Create gift record
      await LiveGift.create([{
        sessionId,
        senderId,
        recipientId: hostUserId,
        giftType,
        giftName: giftDef.name,
        giftValue: giftDef.value,
        quantity,
        totalCredits,
        senderBalanceBefore: senderCredit.balance + totalCredits,
        senderBalanceAfter: senderCredit.balance,
        idempotencyKey,
        status: 'completed',
      }], { session });
      
      // 5. Update session counters (atomic)
      await LiveSession.findOneAndUpdate(
        { _id: sessionId, status: 'live' },
        {
          $inc: {
            giftCount: 1,
            totalGiftValue: totalCredits,
          },
        },
        { session }
      );
    });
  } finally {
    session.endSession();
  }
}
```

**Safety guarantees:**
- IdempotencyKey unique index prevents duplicate processing
- `$gte` balance check in `findOneAndUpdate` prevents overdraft
- Atomicity across debit + gift creation + session update
- `$slice: -500` prevents unbounded array growth

### 4.2 Session Start (Prevent Duplicates)

```typescript
async function startSession(stylistId: string, hostUserId: string, input: CreateSessionInput) {
  // Atomic: create only if no active session exists
  const session = await LiveSession.findOneAndUpdate(
    {
      stylistId,
      status: { $in: ['live', 'paused'] },
    },
    { $setOnInsert: { /* ... */ } },
    { upsert: false }  // Do NOT upsert — we want to fail if active exists
  );
  
  if (session) {
    throw new ApiError(409, 'You already have an active live session');
  }
  
  // Safe to create
  return LiveSession.create({ stylistId, hostUserId, status: 'live', ... });
}
```

---

## 5. Data Lifecycle

### 5.1 LiveSession Lifecycle

```
[scheduled] ──start()──▶ [live] ──pause()──▶ [paused] ──resume()──▶ [live]
                                                           │
                                                           └──end()──▶ [ended]
```

- `scheduled` → `live`: `startedAt` set, LiveKit room created
- `live` → `paused`: `pausedAt` set, viewers see "Stream paused" overlay
- `paused` → `live`: `pausedAt` cleared, `durationMs` incremented by paused duration
- `live`/`paused` → `ended`: `endedAt` set, `durationMs` finalized, replay job queued
- Never transitions backwards from `ended`

### 5.2 Chat Message Retention

- Messages exist for 30 days (TTL index on `createdAt`)
- Deleted messages (`isDeleted: true`) are soft-deleted — TTL still applies
- No manual cleanup required

### 5.3 Gift Record Retention

- Gift records are **permanent** — no TTL
- They are financial records and must be retained for audit
- The `UserCredit.transactions` array is capped at 500 entries via `$slice`

### 5.4 Replay Retention

- Replays default to **no expiration**
- Admin can set `expiresAt` for temporary replays
- `isArchived` flag for cold storage migration (future)

### 5.5 Moderation Log Retention

- Moderation records are **permanent** — no TTL
- They serve as audit trail for disputes and compliance

---

## 6. Scaling Considerations

### 6.1 Sharding Strategy

For the initial scale (100 hosts, 10K viewers per stream), **no sharding is needed**. At current projected volumes:

- `liveSessions`: ~10K documents/year → fits in single partition
- `liveChatMessages`: ~1M documents/year (at 100 messages/min × 100 streams × 60 min) → manageable with TTL cleanup
- `liveGifts`: ~100K documents/year → tiny
- `liveReplays`: ~10K documents/year → tiny
- `liveModerations`: ~10K documents/year → tiny

**Future sharding key:** If needed, shard `liveChatMessages` by `sessionId` (hashed) for even distribution.

### 6.2 Connection Pool

The existing Mongoose connection pool (10 sockets) is sufficient. Chat messages are the highest-volume writes, but each write is small (< 1KB) and fast (< 5ms).

---

## 7. Migration Strategy

### Phase 3 Deliverables (No Data Migration Needed)

All collections are new. No existing data is affected.

### Optional Future Migration

```javascript
// migrate-live-notification-type.js
// Add 'live' to Notification.type enum — this is a metadata-only change in Mongoose
// No actual data migration needed since no existing documents use 'live' type
```

---

*End of LIVE_DATABASE.md*
