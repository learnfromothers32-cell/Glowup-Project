# LIVE_DEPLOYMENT.md

> **GlowUp Live — Deployment Guide**  
> Phase 2 — Architecture Design  
> Date: July 15, 2026

---

## 1. Overview

This document covers deploying the GlowUp Live streaming module to production. The existing stack uses **Render** for backend and **Vercel** for frontend, with **MongoDB Atlas** and **Upstash Redis**.

---

## 2. Prerequisites

### 2.1 Account Requirements

| Service | Account Type | Purpose |
|---------|--------------|---------|
| LiveKit Cloud | Pro plan | WebRTC SFU (video routing) |
| MongoDB Atlas | M10+ | Database |
| Upstash Redis | Pro plan | Caching, pub/sub, rate limiting |
| Render | Standard plan | Backend hosting |
| Vercel | Pro plan | Frontend hosting |
| Cloudinary | Plus plan | Media storage (replays, thumbnails) |

### 2.2 API Keys Needed

```env
# LiveKit
LIVEKIT_API_KEY=API_xxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_WS_URL=wss://your-project.livekit.cloud

# Existing (already configured)
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...
CLOUDINARY_URL=cloudinary://...
```

---

## 3. Environment Variables

### 3.1 Server Environment Variables

Add to Render dashboard or `.env`:

```env
# ── LiveKit Configuration ──
LIVE_PROVIDER=livekit                     # "mock" for dev, "livekit" for production
LIVEKIT_URL=http://localhost:7880         # Self-hosted: http://your-server:7880 | Cloud: wss://project.livekit.cloud
LIVEKIT_API_KEY=API_xxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── TURN Server (for NAT traversal) ──
TURN_SERVER_URL=turn:your-server:3478
TURN_USERNAME=your-username
TURN_PASSWORD=your-password

# ── Live Streaming Settings ──
LIVE_MAX_VIEWERS_PER_STREAM=10000
LIVE_CHAT_SLOW_MODE_DEFAULT_MS=0
LIVE_GIFT_CATALOG_VERSION=1
LIVE_REPLAY_RETENTION_DAYS=365
LIVE_CHAT_RETENTION_DAYS=30

# ── Moderation ──
LIVE_PROFANITY_FILTER_ENABLED=true
LIVE_SPAM_THRESHOLD_MESSAGES=5
LIVE_SPAM_THRESHOLD_SECONDS=10
LIVE_REPORT_AUTO_REVIEW_THRESHOLD=5

# ── Worker Pool ──
LIVE_WORKER_CONCURRENCY_END_SESSION=5
LIVE_WORKER_CONCURRENCY_PROCESS_REPLAY=2
LIVE_WORKER_CONCURRENCY_ANALYTICS=1

# ── Socket.IO (Live Namespace) ──
# Redis is REQUIRED for the /live namespace (presence, viewer count, rate limiting)
# Without Redis, the live namespace will not initialize
# Redis is also used for ChatBroadcaster (cross-instance event delivery)
```

### 3.2 Socket.IO Configuration

The `/live` namespace requires Redis for:
- **Presence tracking** — `LivePresence` class (`server/src/live/socket/presence.ts`)
- **Viewer count synchronization** — `LiveViewerCount` class (`server/src/live/socket/viewerCount.ts`)
- **Rate limiting** — `LiveRateLimiter` class (`server/src/live/socket/rateLimit.ts`)

Without Redis, `initLiveNamespace()` logs a warning and the namespace does not initialize.

Socket.IO settings (in `socket/index.ts`):
- `pingInterval: 25000` (25 seconds)
- `pingTimeout: 20000` (20 seconds)
- `connectTimeout: 10000` (10 seconds)

**Heartbeat protocol:**
- Client sends `live:heartbeat` every 30 seconds
- Server responds with `live:pong` and updates Redis presence
- Redis keys have TTLs: presence hash (300s), heartbeat key (120s)
- Stale connections auto-cleaned via TTL expiry

**Rate limiting defaults:**
| Action | Window | Max Requests |
|--------|--------|:------------:|
| `live:join` | 10s | 10 |
| `live:leave` | 10s | 20 |
| `live:heartbeat` | 5s | 10 |
| `live:connect` | 60s | 30 |

### 3.2 Client Environment Variables

Add to Vercel dashboard or `.env`:

```env
# ── LiveKit Client ──
VITE_LIVEKIT_WS_URL=wss://your-project.livekit.cloud

# ── Feature Flags ──
VITE_LIVE_ENABLED=true
VITE_LIVE_GIFTS_ENABLED=true
VITE_LIVE_RECORDING_ENABLED=true
```

---

## 4. LiveKit Provisioning

### 4.1 Self-Hosted LiveKit Server (Recommended for Startups)

GlowUp uses self-hosted LiveKit to avoid vendor lock-in and costs.

#### Quick Start with Docker

```bash
# Pull and run LiveKit Server
docker run --rm -p 7880:7880 -p 7881:7881 \
  -e LIVEKIT_API_KEY=devkey \
  -e LIVEKIT_API_SECRET=devsecret \
  livekit/livekit-server \
  --config /etc/livekit.yaml
```

#### Configuration File (`livekit.yaml`)

```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  tcp_port: 7881
keys:
  devkey: devsecret
logging:
  level: info
```

#### Environment Variables for Self-Hosted

```env
LIVE_PROVIDER=livekit
LIVEKIT_URL=http://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
```

### 4.2 LiveKit Cloud (Future Migration)

When ready to scale, migrate to LiveKit Cloud:

1. Create account at https://cloud.livekit.io
2. Create project: `glowup-live`
3. Update environment variables:

```env
LIVE_PROVIDER=livekit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=API_xxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

No code changes required — the `LiveKitMediaProvider` works with both.

---

## 5. Deployment Steps

### 5.1 Backend Deployment (Render)

#### Step 1: Update `render.yaml`

```yaml
services:
  - type: web
    name: glowup-api
    env: node
    buildCommand: cd server && npm install && npm run build
    startCommand: cd server && node dist/index.js
    envVars:
      # Existing vars...
      
      # LiveKit (add these)
      - key: LIVEKIT_API_KEY
        sync: false
      - key: LIVEKIT_API_SECRET
        sync: false
      - key: LIVEKIT_WS_URL
        sync: false
      - key: LIVE_MAX_VIEWERS_PER_STREAM
        value: 10000
```

#### Step 2: Install Dependencies

```bash
cd server
npm install livekit-server-sdk bad-words
```

#### Step 3: Add Live Routes

```typescript
// server/src/routes/index.ts
import liveRoutes from "./live.routes";

// Mount before existing routes
router.use("/api/live", liveRoutes);
```

#### Step 4: Initialize Live Socket Namespace

Already wired in `server/src/socket/index.ts`:

```typescript
// server/src/socket/index.ts
import { initLiveNamespace } from '../live/socket';

// After existing namespace initialization
const redisUrl = process.env.REDIS_URL;
initLiveNamespace(io, redisUrl);
```

The `/live` namespace requires Redis for presence, viewer count, and rate limiting.
If `REDIS_URL` is not set, the namespace will not initialize and the server logs a warning.

#### Step 5: Deploy

```bash
git add .
git commit -m "feat: add live streaming backend"
git push origin main
```

Render auto-deploys on push to `main`.

### 5.2 Frontend Deployment (Vercel)

#### Step 1: Install Dependencies

```bash
cd client
npm install @livekit/components-react livekit-client
```

#### Step 2: Add Live Module

Copy the `client/src/live/` directory from implementation.

#### Step 3: Update Router

```typescript
// client/src/router/AppRouter.tsx
// Add lazy routes for live pages
```

#### Step 4: Update Socket Service

```typescript
// client/src/services/socket.ts
// Add getLiveSocket() function
```

#### Step 5: Deploy

```bash
git add .
git commit -m "feat: add live streaming frontend"
git push origin main
```

Vercel auto-deploys on push to `main`.

---

## 6. Post-Deployment Verification

### 6.1 Health Check Endpoints

```typescript
// Add to server/src/routes/live.routes.ts
router.get("/health/live", async (req, res) => {
  // Check LiveKit connectivity
  const livekit = new LiveKitClient(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    process.env.LIVEKIT_WS_URL
  );
  
  // Check Redis connectivity
  await redis.ping();
  
  // Check MongoDB connectivity
  await mongoose.connection.db.admin().ping();
  
  res.json({
    status: "healthy",
    livekit: "connected",
    redis: "connected",
    mongodb: "connected",
    timestamp: new Date().toISOString(),
  });
});
```

### 6.2 Smoke Tests

Run these after deployment:

```bash
# 1. Health check
curl https://your-server.com/api/live/health/live

# 2. Discovery feed (public endpoint)
curl https://your-server.com/api/live/discover

# 3. Gift catalog
curl https://your-server.com/api/live/gifts/catalog

# 4. Authenticated endpoints (with JWT)
curl -H "Authorization: Bearer <token>" \
  https://your-server.com/api/live/sessions
```

### 6.3 Live Stream Test

1. **Host Test:**
   - Login as stylist
   - Navigate to `/stylist/live`
   - Click "Start Stream"
   - Verify video appears
   - Verify chat works

2. **Viewer Test:**
   - Login as client
   - Navigate to `/live`
   - Click on active stream
   - Verify video plays
   - Send chat message
   - Send gift (test with small amount)

3. **Moderation Test:**
   - Host mutes viewer
   - Verify viewer sees muted state
   - Host bans user
   - Verify user cannot rejoin

---

## 7. Monitoring Setup

### 7.1 Sentry Integration

```typescript
// server/src/utils/sentry.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express(),
  ],
  tracesSampleRate: 0.1,  // 10% of transactions
});
```

### 7.2 Logging

```typescript
// server/src/utils/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/live.log" }),
  ],
});

// Structured logging for live events
logger.info("Live session started", {
  sessionId,
  stylistId,
  category,
  timestamp: new Date().toISOString(),
});
```

### 7.3 Metrics Collection

```typescript
// server/src/metrics/live.ts
import { Registry, Counter, Histogram, Gauge } from "prom-client";

const register = new Registry();

// Active sessions
export const activeSessions = new Gauge({
  name: "glowup_live_active_sessions",
  help: "Number of active live sessions",
  registers: [register],
});

// Viewer count
export const totalViewers = new Gauge({
  name: "glowup_live_total_viewers",
  help: "Total viewers across all sessions",
  registers: [register],
});

// Chat message latency
export const chatLatency = new Histogram({
  name: "glowup_live_chat_latency_seconds",
  help: "Chat message processing latency",
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1],
  registers: [register],
});

// Gift transactions
export const giftTransactions = new Counter({
  name: "glowup_live_gift_transactions_total",
  help: "Total gift transactions",
  labelNames: ["status", "gift_type"],
  registers: [register],
});

// Expose metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
```

---

## 8. Runbook

### 8.1 Common Issues

#### Issue: LiveKit Connection Failed

**Symptoms:** Viewers cannot see video, host cannot start stream

**Diagnosis:**
```bash
# Check LiveKit status
curl https://cloud.livekit.io/api/v1/health

# Check environment variables
echo $LIVEKIT_API_KEY
echo $LIVEKIT_API_SECRET
echo $LIVEKIT_WS_URL
```

**Resolution:**
1. Verify API keys are correct
2. Check LiveKit Cloud status page
3. Verify WebSocket URL is accessible
4. Check firewall rules (ports 443, 8443)

---

#### Issue: Chat Messages Not Delivering

**Symptoms:** Messages sent but not received by other users

**Diagnosis:**
```bash
# Check Redis connectivity
redis-cli ping

# Check Redis memory
redis-cli info memory

# Check Socket.IO connections
curl https://your-server.com/socket.io/?EIO=4&transport=polling
```

**Resolution:**
1. Restart Redis connection pool
2. Check Redis memory (scale if > 80%)
3. Verify Socket.IO namespace is initialized
4. Check server logs for errors

---

#### Issue: Gift Transactions Failing

**Symptoms:** "Insufficient credits" error even with balance

**Diagnosis:**
```bash
# Check user balance
db.usercredits.findOne({ userId: "user_id" })

# Check for stuck transactions
db.livegifts.find({ status: "pending" })

# Check Redis rate limits
redis-cli keys "gift:velocity:*"
```

**Resolution:**
1. Verify MongoDB transaction is not stuck
2. Check for duplicate idempotency keys
3. Clear rate limit keys if legitimate
4. Manually complete stuck transactions

---

#### Issue: High Latency

**Symptoms:** Chat messages delayed > 200ms

**Diagnosis:**
```bash
# Check server CPU/memory
top -p $(pgrep -f "node dist/index.js")

# Check MongoDB slow queries
db.setProfilingLevel(1, { slowms: 100 })

# Check Redis latency
redis-cli --latency
```

**Resolution:**
1. Scale server instances (add more)
2. Optimize slow MongoDB queries
3. Check Redis network latency
4. Enable Redis cluster mode

---

### 8.2 Emergency Procedures

#### End Session Immediately

```bash
# Force end a session
curl -X POST https://your-server.com/api/live/sessions/{sessionId}/end \
  -H "Authorization: Bearer <admin-token>"
```

#### Ban User Globally

```bash
# Ban user from all sessions
curl -X POST https://your-server.com/api/admin/users/{userId}/ban \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"reason": "Violation", "duration": "permanent"}'
```

#### Disable Gifts Globally

```bash
# Disable gifts on all sessions
redis-cli set live:gifts:disabled "1" EX 3600
```

#### Scale Down

```bash
# Reduce max viewers per session
redis-cli set live:maxviewers:override 1000
```

---

## 9. Backup & Recovery

### 9.1 Database Backups

MongoDB Atlas handles automatic backups:
- **Continuous backups** (point-in-time recovery)
- **Daily snapshots** retained for 30 days
- **Monthly snapshots** retained for 12 months

### 9.2 Redis Backups

```bash
# Manual Redis snapshot
redis-cli BGSAVE

# Verify backup
redis-cli LASTSAVE
```

### 9.3 Recovery Procedures

#### Restore MongoDB from Backup

```bash
# Atlas CLI
atlas clusters restore --clusterName glowup --projectId <project-id>
```

#### Restore Redis from Snapshot

```bash
# Copy snapshot to Redis directory
cp dump.rdb /var/lib/redis/dump.rdb

# Restart Redis
sudo systemctl restart redis
```

---

## 10. Rollback Procedures

### 10.1 Backend Rollback

```bash
# Render: Rollback to previous deployment
# Dashboard → Environment → Deployments → Rollback to previous

# Or via CLI
render rollback glowup-api
```

### 10.2 Frontend Rollback

```bash
# Vercel: Rollback to previous deployment
# Dashboard → Projects → glowup → Deployments → Promote to Production

# Or via CLI
vercel rollback
```

### 10.3 Database Rollback

If schema changes are involved:

```bash
# 1. Revert code changes
git revert <commit-hash>
git push origin main

# 2. Wait for deployment to complete

# 3. Verify functionality
curl https://your-server.com/api/live/health/live
```

---

## 11. CI/CD Pipeline

### 11.1 GitHub Actions

```yaml
# .github/workflows/live-deploy.yml
name: Deploy Live Streaming

on:
  push:
    branches: [main]
    paths:
      - 'server/src/live/**'
      - 'client/src/live/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd server && npm install
          cd ../client && npm install
      
      - name: Run tests
        run: |
          cd server && npm test
          cd ../client && npm test
      
      - name: Build
        run: |
          cd server && npm run build
          cd ../client && npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        uses: johnbeyren/render-deploy-action@v1
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 12. Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables (not in code)
- [ ] LiveKit API keys rotated from defaults
- [ ] Redis password set and secure
- [ ] MongoDB IP whitelist configured
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled on all endpoints
- [ ] Input validation on all REST endpoints
- [ ] XSS sanitization on chat messages
- [ ] Profanity filter enabled
- [ ] Gift idempotency enforced
- [ ] Transaction atomicity for gifts
- [ ] Moderation logging enabled
- [ ] Error messages don't leak internals
- [ ] HTTPS enforced everywhere
- [ ] Secure WebSocket (wss://) only

### Post-Deployment

- [ ] Health check endpoint responding
- [ ] Discovery feed loading
- [ ] Host can start stream
- [ ] Viewer can join stream
- [ ] Chat messages delivering
- [ ] Gift transactions working
- [ ] Moderation actions functioning
- [ ] Replays processing
- [ ] Monitoring dashboards showing data
- [ ] Alerts configured and tested
- [ ] Runbook accessible to team

---

**End of Phase 2 Architecture Design**

All 8 documents are complete:
1. ✅ LIVE_ARCHITECTURE.md
2. ✅ LIVE_DATABASE.md
3. ✅ LIVE_SOCKET_EVENTS.md
4. ✅ LIVE_API.md
5. ✅ LIVE_FRONTEND_ARCHITECTURE.md
6. ✅ LIVE_SECURITY.md
7. ✅ LIVE_SCALING.md
8. ✅ LIVE_DEPLOYMENT.md

**Ready for Phase 3: Backend Foundation**

---

## Phase 3G — Production Hardening Update

**Date:** July 15, 2026

### What's new

- **Rate limiting on commerce events**: All host-only commerce socket events (`live:service:pin`, `live:service:unpin`, `live:availability:update`, `live:shelf:toggle`) now use the `LiveRateLimiter` with per-user+session keys. Rate limit configuration in `LiveRateLimiter` should be tuned for production (default: `maxTokens: 20`, `refillRate: 2/s`).
- **Connection resilience**: Client implements exponential backoff reconnection (2s base, 30s max, 10 attempts). The `ConnectionBanner` component provides a manual retry button. No server-side changes needed.
- **Accessibility**: All live components have ARIA labels, roles, and screen-reader support. No deployment changes needed.
- **Integration tests**: 2 new test files added (25 tests): `commerce-handlers.test.ts` (pin/unpin, availability, shelf) and `session-lifecycle.test.ts` (join/leave, disconnect, heartbeat, chat).

### No deployment changes required

Phase 3G is purely a hardening pass — no new environment variables, no new infrastructure, no new endpoints. Deploy as normal.

### Test verification

```bash
# Backend: 408 tests
cd server && npm test

# Frontend: TypeScript clean + Vite build
cd client && npx tsc --noEmit && npx vite build
```
