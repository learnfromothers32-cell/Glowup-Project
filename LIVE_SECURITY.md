# LIVE_SECURITY.md

> **GlowUp Live — Security Design**  
> Phase 2 — Architecture Design  
> Phase 3H — Safety Implementation  
> Date: July 15, 2026

---

## 1. Overview

The live streaming module handles real-time communication, financial transactions (gifts), and user-generated content (chat). This document defines the security measures protecting against abuse, fraud, and unauthorized access.

### Security Principles

1. **Zero Trust** — Every client message is validated server-side; no client state is trusted
2. **Defense in Depth** — Multiple layers: auth, rate limiting, input validation, content filtering, audit logging
3. **Least Privilege** — Users only access what their role allows; moderators have scoped permissions
4. **Financial Integrity** — Gift transactions use idempotency keys, ACID transactions, and balance checks
5. **Audit Everything** — All moderation actions and financial transactions are logged permanently

---

## 2. Authentication

### 2.1 Socket.IO Authentication

The `/live` namespace requires JWT Bearer token authentication:

```typescript
// server/src/socket/liveNamespace.ts
io.of("/live").use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));
    
    const decoded = verifyAccessToken(token);  // Same verify as REST middleware
    socket.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});
```

**Token Refresh:**
- Access tokens expire after 15 minutes
- Client must refresh before expiry via existing `/api/auth/refresh` endpoint
- Socket connection uses the current access token
- On token expiry, server emits `live:error` with code `TOKEN_EXPIRED`
- Client reconnects with fresh token

### 2.2 LiveKit Token Security

LiveKit tokens are **short-lived** (1 hour) and **scoped**:

```typescript
// Host token: publish + subscribe
const hostToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
  identity: `host_${userId}`,
  ttl: "1h",
})
  .addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })
  .toJwt();

// Viewer token: subscribe only
const viewerToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
  identity: `viewer_${userId}`,
  ttl: "1h",
})
  .addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: false,
    canSubscribe: true,
    canPublishData: false,
  })
  .toJwt();
```

**Key Points:**
- Tokens are generated server-side only; clients never create tokens
- Tokens are scoped to specific room names (prevents joining other rooms)
- Host tokens have `canPublish: true`; viewer tokens have `canPublish: false`
- Tokens expire after 1 hour; client must request new token on expiry
- API key/secret stored in environment variables, never exposed to client

---

## 3. Authorization

### 3.1 Role-Based Access Control (RBAC)

| Action | Host | Moderator | Viewer | Guest |
|--------|------|-----------|--------|-------|
| Start/End stream | ✅ | ❌ | ❌ | ❌ |
| Pause/Resume | ✅ | ❌ | ❌ | ❌ |
| Send chat | ✅ | ✅ | ✅ | ❌ |
| Send gift | ✅ | ✅ | ✅ | ❌ |
| Delete message | ✅ | ✅ | ❌ | ❌ |
| Mute user | ✅ | ✅ | ❌ | ❌ |
| Kick user | ✅ | ❌ | ❌ | ❌ |
| Ban user | ✅ | ❌ | ❌ | ❌ |
| Pin product/service | ✅ | ❌ | ❌ | ❌ |
| Report stream | ❌ | ❌ | ✅ | ❌ |
| View stream | ✅ | ✅ | ✅ | ✅ |

### 3.2 Host Verification

Before granting host permissions, server verifies:

1. **Stylist ownership**: `session.stylistId` matches user's stylist profile
2. **One active session**: Partial unique index prevents duplicate live streams
3. **Account status**: User account is not suspended or banned

```typescript
// Authorization check for host-only actions
function requireHost(socket, sessionId) {
  const session = await LiveSession.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  
  const stylist = await Stylist.findOne({ userId: socket.user.id });
  if (!stylist || !session.stylistId.equals(stylist._id)) {
    throw new ApiError(403, "Not authorized");
  }
  
  return session;
}
```

### 3.3 Moderator Verification

Moderators must be explicitly added by the host:

```typescript
// LiveSession.moderators array
moderators: [{
  userId: ObjectId,      // ref: User
  addedAt: Date,
  removedAt?: Date,
}]
```

**Authorization check:**
```typescript
function requireModerator(socket, sessionId) {
  const session = await LiveSession.findById(sessionId);
  const isHost = session.stylistId.equals(socket.user.stylistId);
  const isModerator = session.moderators.some(
    m => m.userId.equals(socket.user.id) && !m.removedAt
  );
  
  if (!isHost && !isModerator) throw new ApiError(403, "Not authorized");
  return session;
}
```

---

## 4. Rate Limiting

### 4.1 Socket Event Rate Limits

| Event | Limit | Window | Implementation |
|-------|-------|--------|----------------|
| `live:chat:send` | 5 messages | 10 seconds | Redis sliding window |
| `live:chat:typing` | 1 event | 1 second | Redis sliding window |
| `live:like` | 60 events | 1 minute | Redis sliding window |
| `live:reaction` | 30 events | 1 minute | Redis sliding window |
| `live:gift:send` | 10 gifts | 1 minute | Redis sliding window |
| `live:report` | 3 reports | 10 minutes | Redis sliding window |
| `live:join` | 10 joins | 1 minute | Redis sliding window |

### 4.2 REST API Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/live/sessions` | 3 requests | 1 hour |
| `GET /api/live/discover` | 60 requests | 1 minute |
| `GET /api/live/sessions/:id/token` | 10 requests | 1 hour |
| `POST /api/live/gifts/send` | 10 requests | 1 minute |

### 4.3 Rate Limit Implementation

```typescript
// server/src/middleware/rateLimit.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Sliding window with Redis sorted sets
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);  // Remove old entries
  pipeline.zadd(key, now, `${now}-${Math.random()}`);  // Add current request
  pipeline.zcard(key);  // Count requests in window
  pipeline.pexpire(key, windowMs);  // Set TTL
  
  const results = await pipeline.exec();
  const count = results[2][1] as number;
  
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: now + windowMs,
  };
}
```

---

## 5. Input Validation & Sanitization

### 5.1 Chat Message Validation

```typescript
// server/src/validators/live.validator.ts
import { z } from "zod";

export const chatMessageSchema = z.object({
  sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid session ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message too long")
    .refine(
      (val) => val.trim().length > 0,
      "Message cannot be only whitespace"
    ),
  replyTo: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});
```

### 5.2 XSS Prevention

All user-generated content is sanitized before storage and display:

```typescript
import DOMPurify from "isomorphic-dompurify";

function sanitizeContent(content: string): string {
  // Strip all HTML tags
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],  // No HTML allowed
    ALLOWED_ATTR: [],
  });
}

// Applied before database insertion
const sanitizedContent = sanitizeContent(userInput);
```

### 5.3 Profanity Filter

```typescript
import Filter from "bad-words";

const filter = new Filter();

function containsProfanity(content: string): { filtered: boolean; original: string } {
  if (filter.isProfane(content)) {
    return {
      filtered: true,
      original: content,
    };
  }
  return { filtered: false, original: content };
}

// Server-side: flag message but don't block (soft filter)
// Optionally replace with asterisks: filter.clean(content)
```

### 5.4 Gift Input Validation

```typescript
export const giftSendSchema = z.object({
  sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  giftType: z.string().min(1).max(50),  // Must exist in catalog
  quantity: z.number().int().min(1).max(100),
  idempotencyKey: z.string().uuid("Must be UUID v4"),
});
```

---

## 6. Anti-Bot Measures

### 6.1 Socket Connection Validation

```typescript
// Rate limit new connections per IP
const connectionLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 30,  // 30 connections per minute per IP
  message: "Too many connections",
});

io.of("/live").use(connectionLimiter);
```

### 6.2 CAPTCHA for High-Risk Actions

- **Gift sending**: Optional CAPTCHA after 10 gifts in 5 minutes
- **Report**: Optional CAPTCHA after 3 reports in 10 minutes
- **Account creation**: Existing Firebase auth (Google reCAPTCHA)

### 6.3 Behavioral Analysis

```typescript
// Detect bot-like behavior
function detectBotBehavior(userId: string, events: Event[]): boolean {
  // 1. Check for uniform message timing (bots send at exact intervals)
  const intervals = events.map((e, i) => 
    i > 0 ? e.timestamp - events[i-1].timestamp : 0
  ).slice(1);
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
  
  // Low variance = bot-like (human timing varies)
  if (variance < 100 && intervals.length > 5) return true;
  
  // 2. Check for identical messages
  const uniqueMessages = new Set(events.map(e => e.content));
  if (uniqueMessages.size === 1 && events.length > 10) return true;
  
  return false;
}
```

### 6.4 IP Reputation

```typescript
// Check IP against known bot networks
async function checkIpReputation(ip: string): Promise<boolean> {
  // Use external service (e.g., IPQualityScore, AbuseIPDB)
  // Or maintain internal blocklist in Redis
  
  const isBlocked = await redis.sismember("blocked:ips", ip);
  return !isBlocked;
}
```

---

## 7. Gift Fraud Prevention

### 7.1 Idempotency

Every gift transaction requires a client-generated UUID v4 idempotency key:

```typescript
// Client generates key before sending
const idempotencyKey = crypto.randomUUID();

// Server checks uniqueness within transaction
const existing = await LiveGift.findOne({ idempotencyKey });
if (existing) {
  // Return existing gift (idempotent response)
  return existing;
}
```

### 7.2 Balance Verification

```typescript
// Atomic balance check + debit
const senderCredit = await UserCredit.findOneAndUpdate(
  { 
    userId: senderId, 
    balance: { $gte: totalCredits }  // Balance must be sufficient
  },
  { 
    $inc: { balance: -totalCredits },
    $push: {
      transactions: {
        $each: [{
          type: "usage",
          amount: -totalCredits,
          description: `Gift: ${giftDef.name} x${quantity}`,
          createdAt: new Date(),
        }],
        $slice: -500,  // Cap transaction history
      },
    },
  },
  { new: true, session }
);

if (!senderCredit) {
  throw new ApiError(400, "Insufficient credits");
}
```

### 7.3 Double-Spend Prevention

```typescript
// MongoDB transaction ensures atomicity
await session.withTransaction(async () => {
  // 1. Check idempotency key
  // 2. Verify balance
  // 3. Debit sender
  // 4. Create gift record
  // 5. Update session counters
  // All within single transaction
});
```

### 7.4 Velocity Checks

```typescript
// Prevent rapid gift spam
async function checkGiftVelocity(userId: string): Promise<boolean> {
  const key = `gift:velocity:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);  // 1 minute window
  }
  
  // Max 10 gifts per minute per user
  if (count > 10) {
    await redis.decr(key);  // Rollback increment
    return false;
  }
  
  return true;
}
```

### 7.5 Refund Policy

- Gifts are **non-refundable** once processed
- Failed transactions are automatically refunded (status: "failed")
- Admin can manually refund via moderation panel (creates "refunded" gift record)
- All refunds are logged in `UserCredit.transactions`

---

## 8. DoS Protection

### 8.1 Connection Limits

```typescript
// Per-user connection limit
const MAX_CONNECTIONS_PER_USER = 3;

io.of("/live").use(async (socket, next) => {
  const connections = await redis.scard(`user:connections:${socket.user.id}`);
  if (connections >= MAX_CONNECTIONS_PER_USER) {
    return next(new Error("Too many connections"));
  }
  
  await redis.sadd(`user:connections:${socket.user.id}`, socket.id);
  next();
});
```

### 8.2 Message Size Limits

```typescript
// Socket.IO parser with size limit
io.of("/live", {
  maxHttpBufferSize: 1e6,  // 1MB max message size
});
```

### 8.3 Room Size Limits

```typescript
// Max viewers per session (configurable per session)
const session = await LiveSession.findById(sessionId);
if (session.viewerCount >= session.settings.maxViewers) {
  throw new ApiError(400, "Room full");
}
```

### 8.4 Graceful Degradation

```typescript
// When under high load, disable non-critical features
if (systemLoad > 0.8) {
  // Disable typing indicators
  // Disable reaction animations
  // Reduce analytics broadcast frequency
  // Show "High traffic" warning to users
}
```

---

## 9. Content Moderation

### 9.1 Automated Moderation

```typescript
// Profanity filter (soft block — flag but don't delete)
// Spam detection (5 messages per 10 seconds)
// Link detection (block external links in chat)
// Image detection (future: NSFW detection)

function moderateMessage(content: string, userId: string): ModerationResult {
  // 1. Check profanity
  if (filter.isProfane(content)) {
    return { action: "flag", reason: "profanity" };
  }
  
  // 2. Check spam
  if (isSpamming(userId)) {
    return { action: "block", reason: "spam" };
  }
  
  // 3. Check links
  if (containsLinks(content)) {
    return { action: "block", reason: "links_not_allowed" };
  }
  
  return { action: "allow" };
}
```

### 9.2 Report System

```typescript
// Users can report streams or messages
// 5 reports trigger automatic review
// Admin notified via notification service

async function reportSession(
  sessionId: string,
  userId: string,
  reason: string,
  details?: string
) {
  // Check if already reported by this user
  const existing = await LiveModeration.findOne({
    sessionId,
    action: "report",
    performedBy: userId,
  });
  
  if (existing) {
    throw new ApiError(400, "Already reported");
  }
  
  // Create report
  await LiveModeration.create({
    sessionId,
    action: "report",
    performedBy: userId,
    reason,
    metadata: { details },
  });
  
  // Increment report count
  const session = await LiveSession.findByIdAndUpdate(
    sessionId,
    { $inc: { reportCount: 1 } },
    { new: true }
  );
  
  // Auto-review threshold
  if (session.reportCount >= 5) {
    session.isUnderReview = true;
    await session.save();
    
    // Notify admins
    await notifyAdmins("Live session under review", {
      sessionId,
      reportCount: session.reportCount,
    });
  }
}
```

### 9.3 Moderation Log

All moderation actions are permanently logged:

```typescript
interface ModerationLog {
  sessionId: ObjectId;
  action: "mute" | "unmute" | "kick" | "ban" | "unban" | "delete_message" | "report";
  targetUserId?: ObjectId;
  targetMessageId?: ObjectId;
  performedBy: ObjectId;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

**Retention:** Permanent (no TTL). Used for dispute resolution and compliance.

---

## 10. Data Privacy

### 10.1 Personal Data in Chat

- Chat messages are stored with sender's display name and avatar
- Messages are deleted after 30 days (TTL index)
- Users can request deletion of their chat history (GDPR compliance)

### 10.2 Viewer Identity

- Viewer list is stored in Redis (ephemeral)
- Viewer count is public; viewer identities are private
- Only host/moderators can see viewer list

### 10.3 Gift Transactions

- Gift records are permanent (financial audit requirement)
- Sender/recipient IDs are stored (not names)
- Balance snapshots are stored for audit trail

### 10.4 Analytics

- Watch time is tracked per session (not per user across sessions)
- No personally identifiable information in analytics
- Aggregated metrics only (total viewers, total gifts, etc.)

---

## 11. Audit Logging

### 11.1 Financial Audit

```typescript
// Every gift transaction includes:
interface GiftAudit {
  giftId: ObjectId;
  sessionId: ObjectId;
  senderId: ObjectId;
  recipientId: ObjectId;
  giftType: string;
  totalCredits: number;
  senderBalanceBefore: number;
  senderBalanceAfter: number;
  idempotencyKey: string;
  status: "completed" | "failed" | "refunded";
  createdAt: Date;
}
```

### 11.2 Moderation Audit

```typescript
// Every moderation action includes:
interface ModerationAudit {
  sessionId: ObjectId;
  action: string;
  targetUserId?: ObjectId;
  targetMessageId?: ObjectId;
  performedBy: ObjectId;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

### 11.3 Admin Access Logs

```typescript
// Log all admin actions on live sessions
interface AdminLog {
  adminId: ObjectId;
  action: "end_session" | "ban_user" | "refund_gift" | "review_session";
  targetType: "session" | "user" | "gift";
  targetId: ObjectId;
  reason: string;
  createdAt: Date;
}
```

---

## 12. Security Checklist

### Pre-Launch

- [ ] JWT verification on `/live` namespace
- [ ] LiveKit tokens scoped to specific rooms
- [ ] Rate limiting on all socket events
- [ ] Input validation on all REST endpoints
- [ ] XSS sanitization on chat messages
- [ ] Profanity filter enabled
- [ ] Gift idempotency key enforcement
- [ ] Balance verification before gift debit
- [ ] Transaction atomicity for gifts
- [ ] Moderation logging
- [ ] Error messages don't leak internal details

### Post-Launch

- [ ] Monitor rate limit hits (potential attacks)
- [ ] Monitor gift velocity (potential fraud)
- [ ] Review moderation logs weekly
- [ ] Update profanity filter word list monthly
- [ ] Rotate LiveKit API keys quarterly
- [ ] Security audit quarterly

---

## 13. Incident Response

### 13.1 Gift Fraud Detected

1. Freeze affected user's gift ability
2. Review recent transactions
3. Refund legitimate victims
4. Ban fraudulent account
5. Update velocity limits if needed

### 13.2 DoS Attack Detected

1. Increase rate limits for affected endpoints
2. Block attacking IPs
3. Enable CAPTCHA for all gift sends
4. Scale server instances if needed
5. Notify infrastructure team

### 13.3 Inappropriate Content

1. Immediately end session if severe
2. Ban offending user
3. Preserve evidence (screenshots, chat logs)
4. Report to authorities if illegal
5. Notify affected viewers

---

**Next:** See `LIVE_SCALING.md` for horizontal scaling and performance optimization.

---

## Phase 3H — Safety Implementation Status

### Implemented

| Security Feature | Status | Details |
|---|---|---|
| **Mute/Unmute** | ✅ | Host/moderator can mute users. Muted users cannot send chat messages. |
| **Ban/Unban** | ✅ | Host/moderator can ban users. Banned users cannot join sessions. |
| **Delete Message** | ✅ | Host/moderator can soft-delete any message. |
| **Report Message** | ✅ | Viewers can report messages. Deduplication prevents double-reporting. |
| **Report User** | ✅ | Viewers can report users. Deduplication prevents double-reporting. |
| **Profanity Filter** | ✅ | Server-side, configurable word list, case-insensitive, replace or reject modes. |
| **Audit Log** | ✅ | All moderation actions recorded in `LiveModeration` model with moderator, target, timestamp, reason. |
| **Reaction Rate Limiting** | ✅ | 1 reaction per 500ms per user. Silently dropped when exceeded. |
| **Commerce Rate Limiting** | ✅ | All commerce socket events rate-limited per user+session. |
| **Guest Request Workflow** | ✅ | Viewers request to join, host accepts/rejects. No media streaming yet. |
| **Safety Notifications** | ✅ | Viewers receive muted/banned/message-removed notifications via socket. |

### Not Yet Implemented (Future Phases)

- Virtual gifts, coins, wallets (Phase 4+)
- Replay/recording (Phase 4+)
- AI moderation (Phase 4+)
- Multi-person video (Phase 4+)
