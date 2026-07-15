# LIVE_SCALING.md

> **GlowUp Live — Scaling & Performance**  
> Phase 2 — Architecture Design  
> Date: July 15, 2026

---

## 1. Overview

The live streaming platform must support:
- **100 concurrent hosts** (stylists streaming simultaneously)
- **10,000 viewers per stream** (single popular stream)
- **100,000 concurrent viewers** across all streams
- **Sub-100ms latency** for chat messages
- **99.9% uptime** during peak hours

This document defines the scaling strategy for each component.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOAD BALANCER                             │
│                     (NGINX / Cloudflare)                         │
└─────────────┬─────────────────────────────────────┬─────────────┘
              │                                     │
              ▼                                     ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│     SERVER INSTANCE 1   │         │     SERVER INSTANCE 2   │
│     (Express + Socket)  │         │     (Express + Socket)  │
└─────────────┬───────────┘         └─────────────┬───────────┘
              │                                   │
              ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REDIS CLUSTER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Pub/Sub     │  │  Cache       │  │  Rate Limit  │          │
│  │  (Adapter)   │  │  (Sessions)  │  │  (Sliding    │          │
│  │              │  │              │  │   Window)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MONGODB ATLAS                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  liveSessions│  │liveChatMsgs  │  │  liveGifts   │          │
│  │  (primary)   │  │ (TTL index)  │  │  (financial) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LIVEKIT CLOUD                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  SFU Nodes   │  │  Recording   │  │  Egress      │          │
│  │  (Video)     │  │  (Replay)    │  │  (RTMP)      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Socket.IO Scaling

### 3.1 Redis Adapter

Socket.IO uses Redis adapter for cross-instance communication:

```typescript
// server/src/socket/index.ts
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**How it works:**
- Each Socket.IO instance connects to Redis
- When a socket emits to a room, the event is published to Redis
- All instances subscribed to that room receive the event
- This allows scaling to multiple server instances

### 3.2 Room Management

```typescript
// Room state stored in Redis for cross-instance access
const ROOM_KEY = "live:room:{sessionId}";
const VIEWER_SET_KEY = "live:viewers:{sessionId}";
const BANNED_SET_KEY = "live:banned:{sessionId}";
const MUTED_SET_KEY = "live:muted:{sessionId}";

// Example: Check if user is banned (works across instances)
async function isUserBanned(sessionId: string, userId: string): Promise<boolean> {
  return redis.sismember(`live:banned:${sessionId}`, userId);
}
```

### 3.3 Connection Scaling

**Target:** 10,000 concurrent connections per server instance

**Optimizations:**
1. **Disable unnecessary events**: Only emit events that subscribers need
2. **Batch updates**: Analytics updates every 5 seconds, not per-event
3. **Lazy broadcasting**: Only broadcast to rooms with active subscribers
4. **Connection pooling**: Reuse Redis connections across instances

**Capacity Planning:**
| Component | Per Instance | Total (3 instances) |
|-----------|--------------|---------------------|
| Socket connections | 10,000 | 30,000 |
| Redis connections | 10 | 30 |
| MongoDB connections | 10 | 30 |

---

## 4. Redis Scaling

### 4.1 Redis Cluster Setup

For production, use Redis Cluster for horizontal scaling:

```typescript
// server/src/config/redis.ts
import Redis from "ioredis";

const cluster = new Redis.Cluster(
  [
    { host: "redis-node-1", port: 6379 },
    { host: "redis-node-2", port: 6379 },
    { host: "redis-node-3", port: 6379 },
  ],
  {
    redisOptions: {
      password: process.env.REDIS_PASSWORD,
    },
    scaleReads: "slave",  // Read from replicas
  }
);
```

### 4.2 Data Distribution

| Data Type | Key Pattern | TTL | Replication |
|-----------|-------------|-----|-------------|
| Viewer set | `live:viewers:{sessionId}` | Session duration | Primary + Replicas |
| Banned set | `live:banned:{sessionId}` | 24 hours | Primary + Replicas |
| Muted set | `live:muted:{sessionId}` | Session duration | Primary + Replicas |
| Rate limits | `ratelimit:{key}` | Window duration | Primary only |
| Session cache | `live:session:{sessionId}` | 5 minutes | Primary + Replicas |
| Pub/Sub | `live:{sessionId}:chat` | N/A | All nodes |

### 4.3 Memory Management

**Estimated Redis memory per session:**
```
Viewer set: ~10,000 users × 50 bytes = 500 KB
Banned set: ~100 users × 50 bytes = 5 KB
Muted set: ~500 users × 50 bytes = 25 KB
Session cache: ~1 KB
Rate limits: ~10 KB
Total: ~541 KB per session
```

**For 100 concurrent sessions:**
```
541 KB × 100 = 54.1 MB
+ Pub/Sub overhead: ~10 MB
+ Rate limit overhead: ~5 MB
Total: ~70 MB
```

**Recommendation:** 256 MB Redis instance for initial scale, scale to 1 GB for 500+ concurrent sessions.

---

## 5. MongoDB Scaling

### 5.1 Collection Growth Projections

| Collection | Documents/Year | Size/Document | Total Size |
|------------|----------------|---------------|------------|
| liveSessions | 10,000 | 2 KB | 20 MB |
| liveChatMessages | 1,000,000 | 0.5 KB | 500 MB |
| liveGifts | 100,000 | 0.3 KB | 30 MB |
| liveReplays | 10,000 | 0.2 KB | 20 MB |
| liveModerations | 10,000 | 0.3 KB | 30 MB |

### 5.2 Index Optimization

**Critical indexes for performance:**

```typescript
// LiveSession: Discovery feed query (most frequent)
db.liveSessions.createIndex({ status: 1, category: 1, startedAt: -1 });

// LiveChatMessage: Chat history (high volume)
db.liveChatMessages.createIndex({ sessionId: 1, createdAt: -1 });

// LiveGift: Financial audit (permanent)
db.liveGifts.createIndex({ idempotencyKey: 1 }, { unique: true });
```

### 5.3 Read/Write Patterns

| Operation | Collection | Pattern | Frequency |
|-----------|------------|---------|-----------|
| Chat send | liveChatMessages | Write | 100/min/session |
| Chat history | liveChatMessages | Read (paginated) | On join |
| Gift send | liveGifts | Write (transaction) | 10/min/session |
| Gift balance | UserCredit | Read-Modify-Write | Per gift |
| Session metrics | liveSessions | Read-Modify-Write | Every 5s |
| Discovery feed | liveSessions | Read (indexed) | Every 30s |

### 5.4 Connection Pooling

```typescript
// server/src/config/db.ts
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 20,        // Max connections per instance
  minPoolSize: 5,         // Keep 5 connections ready
  socketTimeoutMS: 45000, // Close idle sockets after 45s
  serverSelectionTimeoutMS: 5000, // Fail fast if can't connect
});
```

---

## 6. LiveKit Scaling

### 6.1 LiveKit Cloud Configuration

LiveKit Cloud handles SFU scaling automatically:

```typescript
// server/src/config/livekit.ts
export const livekitConfig = {
  apiKey: process.env.LIVEKIT_API_KEY,
  apiSecret: process.env.LIVEKIT_API_SECRET,
  wsUrl: process.env.LIVEKIT_WS_URL,  // wss://your-project.livekit.cloud
  
  // Egress (recording)
  egressUrl: process.env.LIVEKIT_EGRESS_URL,
  
  // Recording settings
  recording: {
    enabled: true,
    outputFormat: "mp4",
    storage: "cloudinary",  // or "s3"
  },
};
```

### 6.2 Room Configuration

```typescript
// Optimize for 10,000 viewers
const roomOptions = {
  maxParticipants: 10000,
  emptyTimeout: 60,  // End room after 60s empty
  metadata: {
    maxBitrate: 2500000,  // 2.5 Mbps max per participant
    videoCodec: "vp8",    // Better for high participant counts
    audioCodec: "opus",
  },
};
```

### 6.3 Egress Scaling

LiveKit Egress handles recording at scale:

```typescript
// Start recording when session starts
const egressClient = new EgressClient(livekitConfig.wsUrl, livekitConfig.apiKey, livekitConfig.apiSecret);

const roomComposite = await egressClient.startRoomCompositeEgress(
  roomName,
  {
    file: {
      filepath: "recordings/{room_name}_{time}",
      outputFormat: "mp4",
    },
  }
);
```

---

## 7. Worker Pool Scaling

### 7.1 Bull Queue Configuration

```typescript
// server/src/workers/liveWorker.ts
import Bull from "bull";

const liveQueue = new Bull("live", process.env.REDIS_URL, {
  redis: {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

// Process jobs
liveQueue.process("end-session", 5, async (job) => {
  // 5 concurrent workers for session end
  const { sessionId } = job.data;
  await endSession(sessionId);
});

liveQueue.process("process-replay", 2, async (job) => {
  // 2 concurrent workers for replay processing
  const { sessionId, recordingUrl } = job.data;
  await processReplay(sessionId, recordingUrl);
});
```

### 7.2 Worker Scaling

| Job Type | Concurrency | Timeout | Retry |
|----------|-------------|---------|-------|
| end-session | 5 | 30s | 3 attempts |
| process-replay | 2 | 5min | 3 attempts |
| analytics-rollup | 1 | 10min | 2 attempts |
| moderation-cleanup | 1 | 5min | 2 attempts |

**Scale workers independently:**
- Add more `end-session` workers during peak hours
- Add more `process-replay` workers after streams end
- Monitor queue length to auto-scale

---

## 8. Backpressure Management

### 8.1 Chat Message Throttling

```typescript
// Server-side: Throttle chat messages under high load
async function handleChatMessage(sessionId: string, message: string) {
  // Check system load
  const load = await getSystemLoad();
  
  if (load > 0.9) {
    // High load: reject non-essential messages
    throw new ApiError(429, "System busy, please try again");
  }
  
  if (load > 0.7) {
    // Medium load: increase slow mode
    const session = await LiveSession.findById(sessionId);
    session.settings.slowModeMs = Math.min(session.settings.slowModeMs + 1000, 10000);
    await session.save();
  }
  
  // Process message normally
  await persistChatMessage(sessionId, message);
}
```

### 8.2 Viewer Join Throttling

```typescript
// When viewer count approaches limit
async function handleViewerJoin(sessionId: string, userId: string) {
  const session = await LiveSession.findById(sessionId);
  
  if (session.viewerCount >= session.settings.maxViewers * 0.95) {
    // 95% capacity: start throttling joins
    await redis.set(`live:throttle:${sessionId}`, "1", "EX", 30); // 30s throttle
  }
  
  if (session.viewerCount >= session.settings.maxViewers) {
    throw new ApiError(400, "Room full");
  }
  
  // Allow join
  await redis.sadd(`live:viewers:${sessionId}`, userId);
  await LiveSession.findByIdAndUpdate(sessionId, { $inc: { viewerCount: 1 } });
}
```

### 8.3 Gift Throttling

```typescript
// Prevent gift flood
async function handleGiftSend(sessionId: string, userId: string) {
  const key = `gift:throttle:${sessionId}:${userId}`;
  const exists = await redis.exists(key);
  
  if (exists) {
    throw new ApiError(429, "Gift too fast, wait a moment");
  }
  
  // Set 1-second throttle
  await redis.set(key, "1", "EX", 1);
  
  // Process gift
  await processGiftTransaction(sessionId, userId);
}
```

---

## 9. Performance Monitoring

### 9.1 Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Socket connection time | < 100ms | > 500ms |
| Chat message latency | < 100ms | > 200ms |
| Gift transaction time | < 500ms | > 1000ms |
| Discovery feed load | < 500ms | > 1000ms |
| Redis memory usage | < 70% | > 80% |
| MongoDB connection pool | < 80% | > 90% |
| Queue length | < 100 | > 500 |

### 9.2 Monitoring Stack

```typescript
// server/src/utils/metrics.ts
import { Counter, Histogram, Gauge } from "prom-client";

// Socket metrics
export const socketConnections = new Gauge({
  name: "live_socket_connections_total",
  help: "Total active socket connections",
  labelNames: ["namespace"],
});

export const chatMessageLatency = new Histogram({
  name: "live_chat_message_latency_seconds",
  help: "Chat message processing latency",
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1],
});

// Gift metrics
export const giftTransactions = new Counter({
  name: "live_gift_transactions_total",
  help: "Total gift transactions",
  labelNames: ["status", "gift_type"],
});

// System metrics
export const activeSessions = new Gauge({
  name: "live_active_sessions",
  help: "Number of active live sessions",
});

export const totalViewers = new Gauge({
  name: "live_total_viewers",
  help: "Total viewers across all sessions",
});
```

### 9.3 Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: live-streaming
    rules:
      - alert: HighChatLatency
        expr: histogram_quantile(0.95, live_chat_message_latency_seconds) > 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Chat message latency is high"
      
      - alert: TooManyConnections
        expr: live_socket_connections_total > 50000
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Socket connections exceeding capacity"
      
      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage is high"
```

---

## 10. Capacity Planning

### 10.1 Initial Scale (Launch)

| Component | Specification | Cost/Month |
|-----------|---------------|------------|
| Server | 2× t3.large (2 vCPU, 8 GB) | $120 |
| Redis | 1× ElastiCache t3.medium (2 GB) | $60 |
| MongoDB | Atlas M10 (10 GB) | $57 |
| LiveKit | Cloud Pro (100 concurrent rooms) | $200 |
| Load Balancer | ALB | $20 |
| **Total** | | **$457** |

**Capacity:** 100 hosts, 10,000 viewers per stream, 50,000 concurrent viewers.

### 10.2 Growth Scale (6 months)

| Component | Specification | Cost/Month |
|-----------|---------------|------------|
| Server | 4× t3.large (2 vCPU, 8 GB) | $240 |
| Redis | 1× ElastiCache r5.large (13 GB) | $200 |
| MongoDB | Atlas M20 (20 GB) | $114 |
| LiveKit | Cloud Pro (500 concurrent rooms) | $500 |
| Load Balancer | ALB | $30 |
| **Total** | | **$1,084** |

**Capacity:** 500 hosts, 10,000 viewers per stream, 100,000 concurrent viewers.

### 10.3 Scale Scale (1 year)

| Component | Specification | Cost/Month |
|-----------|---------------|------------|
| Server | 8× t3.xlarge (4 vCPU, 16 GB) | $960 |
| Redis | 1× ElastiCache r5.xlarge (26 GB) | $400 |
| MongoDB | Atlas M30 (40 GB) | $228 |
| LiveKit | Cloud Enterprise (1000 concurrent rooms) | $1,000 |
| Load Balancer | ALB + CloudFront | $100 |
| **Total** | | **$2,688** |

**Capacity:** 1000 hosts, 10,000 viewers per stream, 200,000 concurrent viewers.

---

## 11. Auto-Scaling Strategy

### 11.1 Server Auto-Scaling

```yaml
# AWS Auto Scaling Group
auto_scaling_group:
  min_size: 2
  max_size: 10
  desired_capacity: 2
  scaling_policies:
    - name: "cpu-high"
      metric: "CPUUtilization"
      threshold: 70
      action: "Add 2 instances"
    - name: "cpu-low"
      metric: "CPUUtilization"
      threshold: 30
      action: "Remove 1 instance"
```

### 11.2 Redis Auto-Scaling

ElastiCache supports online resharding:
- Monitor memory usage
- Scale up instance type when > 70% memory
- Scale out to cluster mode when > 100 GB data

### 11.3 MongoDB Auto-Scaling

Atlas supports auto-scaling:
- Enable auto-scaling for storage
- Monitor IOPS usage
- Scale up tier when IOPS consistently > 80%

---

## 12. Performance Optimization Checklist

### Server

- [ ] Enable gzip compression for REST responses
- [ ] Use HTTP/2 for faster multiplexing
- [ ] Enable keep-alive for MongoDB connections
- [ ] Use Redis pipeline for batch operations
- [ ] Implement connection pooling for Redis

### Client

- [ ] Lazy-load LiveKit SDK only when needed
- [ ] Virtualize chat message list
- [ ] Debounce/throttle high-frequency events
- [ ] Use Zustand selectors to minimize re-renders
- [ ] Implement infinite scroll for discovery feed

### Database

- [ ] Create compound indexes for common queries
- [ ] Use projection to return only needed fields
- [ ] Enable MongoDB compression (snappy)
- [ ] Archive old chat messages (TTL index)
- [ ] Monitor slow queries (> 100ms)

### Redis

- [ ] Use pipelining for batch operations
- [ ] Set TTL on all keys to prevent memory leaks
- [ ] Use Redis Cluster for horizontal scaling
- [ ] Monitor key expiration patterns
- [ ] Use appropriate data structures (sets vs lists)

---

**Next:** See `LIVE_DEPLOYMENT.md` for deployment instructions and runbook.
