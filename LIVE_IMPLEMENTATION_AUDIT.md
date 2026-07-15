# LIVE_IMPLEMENTATION_AUDIT.md

> **Phase 1 — Discovery & Audit**  
> **Date:** July 15, 2026  
> **Scope:** Complete codebase analysis for Live Streaming Platform integration  
> **Methodology:** Full static analysis of 30 models, 28+ controllers, 7 middleware, 9 utils, socket architecture, 30+ client pages, 25 API modules, context providers, hooks, and deployment infrastructure.

---

## 1. EXISTING ARCHITECTURE

### 1.1 Tech Stack Summary

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend | React | 19.2.5 | Strict TypeScript, Vite 8 |
| State Management | Zustand + Context | 5.0.13 | AuthContext, FollowContext, ThemeContext, React-Query |
| Routing | React Router DOM | 7.14.2 | Lazy-loaded routes, role-based guards |
| Backend | Express | 4.18.2 | TypeScript 5 (strict), Mongoose 8 |
| Database | MongoDB | 8.x | Atlas (srv connection), Mongoose ODM |
| Cache/PubSub | Redis | 7.x | Upstash (cloud), `redis` package + `ioredis` for Socket.IO adapter |
| Realtime | Socket.IO | 4.6.0 | Two namespaces: `/queue`, `/conversations` |
| Queue | Bull | 4.11.0 | Redis-backed job queue (hairstyle generation) |
| Payments | Paystack | SDK | Provider-agnostic factory pattern, HMAC webhook verification |
| Auth | JWT + Firebase Admin | | Access (15m) + Refresh (7d httpOnly) |
| Storage | Cloudinary | | Image/video upload and optimization |
| Monitoring | Sentry + Clarity + Winston | | Error tracking, session replay, structured logging |
| Validation | Zod | 3.25.76 | All write endpoints |
| Deployment | Vercel (FE) + Render (BE) + MongoDB Atlas + Upstash | | Docker Compose for local |

### 1.2 Folder Structure

```
startup/
├── client/                          # React 19 SPA
│   ├── src/
│   │   ├── api/                     # 25 API modules (axios.ts, auth.ts, bookings.ts, etc.)
│   │   ├── components/              # UI primitives + layout + feature components
│   │   │   ├── layout/              # AppLayout, ConsumerLayout, StylistLayout
│   │   │   ├── sections/            # Landing page sections
│   │   │   ├── ui/                  # Button, Card, Modal, Toast, Avatar, Badge, Input, Skeleton
│   │   │   └── seo/                 # SEOHead, StructuredData
│   │   ├── config/                  # firebase.ts, images.ts
│   │   ├── context/                 # AuthContext, FollowContext, ThemeContext
│   │   ├── data/                    # Static data (beauty-tips, creditPackages)
│   │   ├── domain/                  # Domain types/adapters (booking, review, service, stylist, user)
│   │   ├── features/                # Feature modules (consumer/components/)
│   │   ├── hooks/                   # 9 custom hooks
│   │   ├── i18n/                    # 10 language locales
│   │   ├── pages/                   # 66+ pages (21 consumer, 25 stylist, 14 info, 6 auth)
│   │   ├── router/                  # AppRouter.tsx (all routes)
│   │   ├── services/                # socket.ts, analytics.ts, searchService.ts, paystack.ts
│   │   ├── types/                   # auth.ts, index.ts
│   │   └── utils/                   # 12 utility modules
│   ├── package.json
│   ├── tsconfig.app.json
│   └── vite.config.ts
│
├── server/                          # Express 4 API
│   ├── src/
│   │   ├── config/                  # app.ts, db.ts, redis.ts, firebase.ts, cloudinary.ts
│   │   ├── controllers/             # 28 controllers
│   │   ├── data/                    # Static data (hairstyleImages)
│   │   ├── middleware/              # auth, rateLimiter, csrf, validate, error, asyncHandler, correlationId
│   │   ├── migrate/                 # Database migration runner
│   │   ├── models/                  # 30 Mongoose models
│   │   ├── providers/               # AI providers (hairstyle generation, face analysis)
│   │   ├── queues/                  # hairstyleQueue.ts (Bull)
│   │   ├── routes/                  # 28 route files + index.ts
│   │   ├── scripts/                 # backup.ts
│   │   ├── seed/                    # seed.ts, notifications, hairstyles, creditPackages
│   │   ├── services/                # user, stylist, trending, email, faceAnalysis, hairstyle, payment
│   │   ├── socket/                  # index.ts (Socket.IO initialization + namespaces)
│   │   ├── types/                   # auth.ts, api.ts, express.d.ts, cdn-imports.d.ts
│   │   ├── utils/                   # token, apiError, apiResponse, logger, notify, queue, upload, firebase-verify
│   │   └── __tests__/              # 8 test suites + trending.service.test
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml               # Dev: mongo + redis + server + client
├── docker-compose.prod.yml          # Production: full stack
├── render.yaml                      # Render deployment config
├── deploy.ps1                       # Deployment script
└── .env                             # Environment variables
```

### 1.3 Server Architecture

**Entry Point:** `server/src/server.ts`
- Creates HTTP server from Express app
- Connects MongoDB → runs migrations → connects Redis → initializes Firebase → initializes Socket.IO
- Cron jobs: `syncRedisEngagementToMongo` (every 5 min), `runDatabaseBackup` (daily 3AM)
- Graceful shutdown with 10s force-kill timeout

**Express App:** `server/src/app.ts`
- Middleware chain: correlationId → helmet → cors → generalLimiter → compression → morgan → cookieParser → mongoSanitize → csrfProtect
- Route mounting: `/api/config/*` and `/api/*` (all business routes)
- Error handling: notFound → Sentry → errorHandler

**Socket.IO:** `server/src/socket/index.ts`
- Single HTTP server shared between Express and Socket.IO
- Two namespaces: `/queue` and `/conversations`
- Redis adapter via `@socket.io/redis-adapter` (ioredis pub/sub)
- JWT authentication middleware on both namespaces
- In-memory user socket tracking (`userSockets` Map)
- Per-room rate limiting for queue operations

### 1.4 Database Models (30 Models)

**Core Models:**
| Model | Fields | Indexes | Notes |
|-------|--------|---------|-------|
| `User` | name, email, passwordHash, role (client/stylist/admin), avatar, phone, location, points, actionCounts, badges, favorites, refreshTokenHash, emailVerified | email (unique) | Pre-save bcrypt hook, comparePassword method |
| `Stylist` | userId, name, bio, phone, social links, category, location (area/lat/lng), rating, reviewCount, isVerified, portfolioImages, beforeAfter, followerCount | text (name/bio/category/area), compound (isVerified/rating/createdAt/_id) | Portfolio + before/after items |
| `Booking` | clientId, stylistId, serviceId, startTime, endTime, status, totalPrice, notes, paymentId, paymentStatus, paymentMethod, cancellationReason, rescheduleCount | compound (stylistId/startTime/endTime), partial unique (stylistId/startTime for non-cancelled) | Atomic duplicate prevention |
| `Queue` | stylistId, entries[] (userId/position/joinedAt/estimatedServiceMins/estimatedWaitMins/status/bookingId), currentPosition, predictedWaitMins, avgServiceDuration | stylistId (unique) | `recalculate()` method |
| `Service` | stylistId, name, category, price, duration, isActive, popular | stylistId | Referenced by Booking |
| `Product` | stylistId, name, description, price, costPrice, sku, stock, lowStockThreshold, category, images, isActive, taxable | stylistId/isActive, stylistId/stock | POS system |
| `Transaction` | bookingId, clientId, stylistId, amount, platformFee, stylistPayout, currency, status, paymentProvider, paymentRef, providerMetadata, paymentMethod | paymentRef (unique), bookingId/createdAt, paymentRef/status | Paystack integration |
| `Notification` | userId, type (booking/stylist/badge/promo/reminder/follow/waitlist), title, message, link, read, metadata | userId/read/createdAt | Real-time push via Socket.IO |
| `Conversation` | stylistId, clientId, bookingId, subject, lastMessage, unreadStylist, unreadClient, archived | stylistId/clientId (unique) | Per-pair conversation |
| `Message` | conversationId, senderId, senderRole, content, attachments, read, readAt | conversationId/createdAt | Embedded in conversations |
| `UserCredit` | userId, balance, lifetimeCredits, transactions[] (type/amount/description/reference/createdAt) | userId (unique) | Credit system with transaction history |
| `CreditPackage` | name, credits, price, currency, popular, active | active | Purchasable credit packages |
| `Availability` | stylistId, timezone, schedule (Map), dateOverrides[], bufferMinutes, maxClientsPerSlot | stylistId | Complex working hours |

**Other Models:** Area, Article, Hairstyle, HairstyleJob, Membership, Package, PosTransaction, PromoCode, StylistSettings, Waitlist, TrendingEngagement, TransformationReport, TransformationComment, UserEngagement, UserFavorites, UserHairstyleResult

### 1.5 Authentication Flow

1. **Registration:** POST `/api/auth/register` → bcrypt hash → save User → sign access + refresh tokens → set refresh token as httpOnly cookie → return accessToken + user
2. **Login:** POST `/api/auth/login` → find User → comparePassword → sign tokens → set cookie → return
3. **Social Login:** Firebase Admin `verifyIdToken` → find-or-create User → sign tokens
4. **Token Refresh:** POST `/api/auth/refresh` → verify refresh token from cookie → verify hash matches DB → rotate refresh token → return new accessToken
5. **Protected Routes:** Bearer token in Authorization header → `protect` middleware → verifyAccessToken → attach req.user
6. **Socket Auth:** Token in `socket.handshake.auth.token` → verifyAccessToken → attach `socket.user`

**Key types:**
- `UserRole`: `'client' | 'stylist' | 'admin'`
- `AuthUser`: `{ id: string; role: UserRole }`
- Access token: 15min, HS256, payload = `{ id, role }`
- Refresh token: 7 days, httpOnly cookie, hash stored in DB

### 1.6 Socket Architecture

**Current namespaces:**
```
/ (default)       — unused beyond auth middleware
/queue            — queue operations + notifications + booking status events
/conversations    — direct messaging between client/stylist
```

**Events (queue namespace):**
- `queue:join` → `queue:joined`, `queue:update`, `queue:error`
- `queue:leave` → `queue:left`, `queue:update`
- `queue:status` → `queue:status`, `queue:error`
- `queue:subscribe` → `queue:update`
- `queue:unsubscribe`
- `notification:new` (server → client)
- `booking:status-changed` (server → client)

**Events (conversations namespace):**
- `conversation:join`, `conversation:leave`
- `conversation:typing` → `conversation:typing`
- `conversation:error`

**Redis adapter:** `@socket.io/redis-adapter` with ioredis pub/sub for horizontal scaling

### 1.7 Booking Flow

1. Client selects stylist → service → time slot
2. POST `/api/bookings` with stylistId, serviceId, startTime
3. Server validates: slot availability (working hours/breaks/overrides), buffer conflicts, capacity, lead time, max future window
4. Create Booking (atomic via unique partial index)
5. Create/update Client record (CRM)
6. Create Conversation if first booking
7. Send notifications (stylist + client)
8. Auto-join Queue with `$pull` + `$push` (transactional)
9. Return booking + queuePosition + estimatedWaitMinutes

### 1.8 Queue Flow

1. Socket `queue:join` with stylistId → transactional `$pull` + `$push` → `recalculate()` → emit `queue:update`
2. Stylist advances queue via REST: POST `/api/queue/:stylistId/advance`
3. Mark done, skip entries → recalculate → emit updates
4. Queue positions, wait times recalculated on every mutation

### 1.9 Notification Flow

1. `createNotification()` → save to MongoDB → emit via Socket.IO `/queue` namespace to `user:${userId}`
2. Notification types: booking, stylist, badge, promo, reminder, follow, waitlist
3. Client polls REST every 30s + listens for real-time `notification:new` socket event
4. `useNotifications` hook manages state with optimistic updates

### 1.10 Redis Usage

| Pattern | Key | TTL | Purpose |
|---------|-----|-----|---------|
| Trending scores | `trending:transformations` | None (sorted set) | ZINCRBY for engagement tracking |
| Post engagement | `trending:post:{postId}` | None (hash) | likes, views, comments, shares, bookmarks |
| Trending cache | `trending:cache` | 60s | Cached trending feed |
| Socket.IO adapter | Socket.IO internal | None | Cross-instance message broadcasting |
| Bull queue | `bull:hairstyle-generation:*` | None | Job processing |

### 1.11 Credit System (Reusable for Gifts)

- `CreditPackage`: purchasable packages (name, credits, price, popular, active)
- `UserCredit`: per-user balance + lifetimeCredits + transaction history
- Transaction types: `purchase | usage | bonus | refund | expiration`
- Purchase flow: verify Paystack reference → increment balance → append transaction
- Already integrated with hairstyle generation (debit on use, refund on failure)

### 1.12 Payment System

- Provider-agnostic factory: `CardPaymentProvider` interface → `PaystackProvider` implementation
- HMAC-SHA512 webhook verification with timing-safe comparison
- `initializePayment` → Paystack → callback URL → `verifyPayment` → update Transaction + Booking
- Platform fee calculation via `platform-fee.ts` utility

### 1.13 Deployment Architecture

```
Frontend (Vercel)          Backend (Render)           Database (Atlas)
─────────────────          ─────────────────          ────────────────
React 19 SPA       →      Express 4 API       →      MongoDB 8
Vite 8 build              Socket.IO                  Upstash Redis
                          Bull Queue                 (caching + pub/sub)
                          Firebase Admin             Cloudinary (media)
                          Cloudinary
                          Sentry
```

- Vercel rewrites: `/api/*` → Render backend
- Render: Node.js web service, health check at `/api/hello`
- Docker Compose available for local + production

---

## 2. INTEGRATION POINTS

### 2.1 Backend Files to MODIFY

| File | Change | Risk |
|------|--------|------|
| `server/src/routes/index.ts` | Add live routes | Low — additive |
| `server/src/socket/index.ts` | Add `/live` namespace | Medium — existing file is critical path |
| `server/src/config/app.ts` | Add LiveKit/env config | Low — additive |
| `server/src/models/Notification.ts` | Add `'live'` to type enum | Low — additive |
| `server/src/utils/notify.ts` | Add live notification helpers | Low — additive |
| `server/src/types/auth.ts` | No change needed | None |
| `server/package.json` | Add livekit-server-sdk, bad-words | Low |

### 2.2 Backend Files to CREATE

| File | Purpose |
|------|---------|
| `server/src/models/LiveSession.ts` | Live session state, metadata, analytics |
| `server/src/models/LiveChatMessage.ts` | Chat message persistence |
| `server/src/models/LiveGift.ts` | Gift transactions |
| `server/src/models/LiveReplay.ts` | Replay metadata |
| `server/src/models/LiveModeration.ts` | Moderation actions log |
| `server/src/controllers/live.controller.ts` | REST API handlers |
| `server/src/routes/live.routes.ts` | REST API routes |
| `server/src/services/live.service.ts` | Core business logic |
| `server/src/services/livekit.service.ts` | LiveKit API wrapper |
| `server/src/services/live-chat.service.ts` | Chat + moderation logic |
| `server/src/services/live-gift.service.ts` | Gift/wallet logic |
| `server/src/services/live-analytics.service.ts` | Analytics tracking |
| `server/src/services/live-moderation.service.ts` | Moderation logic |
| `server/src/validators/live.validator.ts` | Zod schemas |
| `server/src/socket/live.ts` | `/live` namespace handlers |
| `server/src/workers/live-replay.worker.ts` | Post-stream replay generation |

### 2.3 Frontend Files to MODIFY

| File | Change | Risk |
|------|--------|------|
| `client/src/App.tsx` | Add LiveProvider context | Low |
| `client/src/router/AppRouter.tsx` | Add live routes | Low — additive |
| `client/src/services/socket.ts` | Add live socket utilities | Low — additive |
| `client/src/api/axios.ts` | No change needed | None |
| `client/src/context/AuthContext.tsx` | No change needed | None |

### 2.4 Frontend Files to CREATE

| File | Purpose |
|------|---------|
| `client/src/live/types/index.ts` | Live streaming types |
| `client/src/live/store/liveStore.ts` | Zustand store for live state |
| `client/src/live/hooks/useLiveSession.ts` | LiveKit room connection hook |
| `client/src/live/hooks/useLiveChat.ts` | Chat hook |
| `client/src/live/hooks/useLiveGifts.ts` | Gift sending/receiving hook |
| `client/src/live/hooks/useLiveAnalytics.ts` | Analytics hook |
| `client/src/live/hooks/useLiveModeration.ts` | Moderation hook |
| `client/src/live/hooks/useLiveDiscovery.ts` | Discovery feed hook |
| `client/src/live/services/liveApi.ts` | REST API client |
| `client/src/live/services/liveSocket.ts` | Socket event handlers |
| `client/src/live/components/LivePlayer.tsx` | WebRTC video player |
| `client/src/live/components/LiveChat.tsx` | Chat panel |
| `client/src/live/components/LiveGiftAnimation.tsx` | Gift animations |
| `client/src/live/components/LiveViewerBar.tsx` | Viewer count, likes, share |
| `client/src/live/components/LiveHostControls.tsx` | Host control panel |
| `client/src/live/components/LiveProductCard.tsx` | Pinned product overlay |
| `client/src/live/components/LiveBookingCTA.tsx` | Book Now overlay |
| `client/src/live/components/LiveReportModal.tsx` | Report stream/user |
| `client/src/live/components/LiveModerationPanel.tsx` | Mod tools |
| `client/src/live/components/LiveReplayPlayer.tsx` | Replay video player |
| `client/src/live/components/LiveDiscoveryFeed.tsx` | TikTok-style discovery |
| `client/src/live/components/LiveSkeleton.tsx` | Loading skeletons |
| `client/src/live/pages/LiveHostPage.tsx` | Host streaming page |
| `client/src/live/pages/LiveViewerPage.tsx` | Viewer page |
| `client/src/live/pages/LiveDiscoveryPage.tsx` | Discovery/explore page |
| `client/src/live/pages/LiveReplayPage.tsx` | Replay page |

### 2.5 Files That Must NEVER Be Modified

| File | Reason |
|------|--------|
| `server/src/controllers/payment.controller.ts` | Payment webhook handling — critical path |
| `server/src/controllers/auth.controller.ts` | Authentication — critical path |
| `server/src/middleware/auth.middleware.ts` | Auth guards — critical path |
| `server/src/utils/token.ts` | JWT signing/verification — critical path |
| `server/src/utils/firebase-verify.ts` | Firebase token verification — critical path |
| `server/src/config/db.ts` | Database connection — critical path |
| `server/src/config/firebase.ts` | Firebase initialization — critical path |
| `client/src/api/axios.ts` | Axios instance + interceptors — critical path |
| `client/src/context/AuthContext.tsx` | Auth state management — critical path |
| `client/src/config/firebase.ts` | Firebase client config — critical path |

---

## 3. REUSABLE COMPONENTS & INFRASTRUCTURE

### 3.1 Directly Reusable (No Modification)

| Component | Location | Reuse For |
|-----------|----------|-----------|
| `protect` middleware | `server/src/middleware/auth.middleware.ts` | Live API auth |
| `requireRole` middleware | `server/src/middleware/auth.middleware.ts` | Role-based live access |
| `softAuth` middleware | `server/src/middleware/auth.middleware.ts` | Optional auth on discovery |
| `validate` + `validateQuery` | `server/src/middleware/validate.ts` | Live endpoint validation |
| `authLimiter` / `generalLimiter` | `server/src/middleware/rateLimiter.ts` | Live API rate limiting |
| `asyncHandler` | `server/src/middleware/asyncHandler.ts` | Async error handling |
| `ApiError` | `server/src/utils/apiError.ts` | Error responses |
| `sendSuccess` / `sendPaginated` | `server/src/utils/apiResponse.ts` | API responses |
| `logger` (Winston) | `server/src/utils/logger.ts` | Structured logging |
| `verifyAccessToken` | `server/src/utils/token.ts` | Socket.IO auth |
| `createNotification` + helpers | `server/src/utils/notify.ts` | Live notifications |
| `getIO` | `server/src/socket/index.ts` | Emit socket events |
| `redisClient` | `server/src/config/redis.ts` | Caching, pub/sub |
| `appConfig` | `server/src/config/app.ts` | Configuration |
| `getSocketUrl` / socket utilities | `client/src/services/socket.ts` | Live socket connection |
| `api` (axios instance) | `client/src/api/axios.ts` | Live API calls |
| `useAuth` | `client/src/context/authUtils.ts` | Auth state in live components |
| `useFollow` | `client/src/context/FollowContext.tsx` | Follow/unfollow from live |
| `QueryClient` | `client/src/App.tsx` | TanStack Query for live data |
| `AuthUser` / `UserRole` types | `server/src/types/auth.ts` | Type reuse |
| `sendSuccess` / `sendPaginated` patterns | `server/src/utils/apiResponse.ts` | Response format consistency |
| `User` model | `server/src/models/User.ts` | User lookup for live features |
| `Stylist` model | `server/src/models/Stylist.ts` | Stylist lookup for hosts |
| `Product` model | `server/src/models/Product.ts` | Pinned products during live |
| `Service` model | `server/src/models/Service.ts` | Pinned services during live |
| `Booking` model | `server/src/models/Booking.ts` | In-stream booking creation |
| `Queue` model | `server/src/models/Queue.ts` | Queue integration from live |
| `UserCredit` model | `server/src/models/UserCredit.ts` | Gift wallet |
| `CreditPackage` model | `server/src/models/CreditPackage.ts` | Gift credit packages |
| `Conversation` / `Message` models | `server/src/models/Conversation.ts` | In-stream messaging |
| `FollowContext` | `client/src/context/FollowContext.tsx` | Follow from live |

### 3.2 Extensible (Minor Modifications)

| Component | Modification | Reason |
|-----------|-------------|--------|
| `Notification` model | Add `'live'` to type enum | Live-specific notifications |
| `notify.ts` | Add `notifyLiveStarted`, `notifyGiftReceived` helpers | Live notifications |
| Socket.IO index | Add `/live` namespace with auth | Live realtime events |
| `routes/index.ts` | Add `liveRoutes` import + mount | API routing |
| `appConfig` | Add LiveKit credentials | Configuration |

---

## 4. RISKS & MITIGATIONS

### 4.1 HIGH Risk

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Socket.IO hot-path dynamic imports** | 50ms+ latency per event | Use static imports only in `/live` namespace |
| **LiveKit TURN costs** | Unexpected billing | Set usage alerts, implement viewer caps |
| **Large viewer rooms** | Socket.IO fan-out bottleneck | Use LiveKit for video, Redis pub/sub for chat, limit chat message broadcast rate |
| **Memory leaks from uncleaned rooms** | Server OOM | TTL-based cleanup, heartbeat monitoring |
| **Gift fraud** | Financial loss | Idempotency keys, rate limiting, server-side validation |
| **Chat spam/abuse** | UX degradation | Rate limiting, profanity filter, slow mode |
| **Payment integration during live** | Double charges | Idempotent booking creation, existing atomic guarantees |

### 4.2 MEDIUM Risk

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **LiveKit API key management** | Service disruption | Environment variable validation at startup |
| **Concurrent stream starts** | Race conditions | MongoDB unique partial index on active sessions per stylist |
| **Replay generation load** | CPU spike | Bull queue with rate limiting, offload to worker |
| **Cross-instance room state** | Split brain | Redis-backed state via existing Redis client |
| **Mobile camera/mic permissions** | Failed joins | Graceful error handling, fallback UI |

### 4.3 LOW Risk

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **i18n for live strings** | Missing translations | English first, add translations incrementally |
| **PWA caching of live pages** | Stale code | Cache-busting on live routes |
| **Dark mode in live UI** | Visual glitches | Use Tailwind dark: variants consistently |

---

## 5. CONFLICTS & CONSIDERATIONS

### 5.1 Potential Conflicts

| Area | Conflict | Resolution |
|------|----------|-----------|
| Socket.IO namespace limit | Existing `/queue` namespace handles notifications | Keep `/queue` for existing features, create `/live` for live streaming |
| Redis connection | Existing `redisClient` + `ioredis` for Socket.IO adapter | Use existing `redisClient` for live state, LiveKit manages its own Redis |
| Bull queue | Only `hairstyle-generation` queue exists | Add `live-replay` queue in same Bull instance |
| Rate limiting | Per-process in-memory | Accept for single-instance; document Redis-backed upgrade path |
| CSRF protection | Applied to all `/api` routes | Live API routes under `/api` will automatically get CSRF protection |

### 5.2 Naming Conventions to Follow

- **Server:** `camelCase` for variables/functions, `PascalCase` for models/classes, `kebab-case` for route files
- **Client:** `PascalCase` for components, `camelCase` for hooks/utils, `kebab-case` for files
- **Socket events:** `namespace:action` pattern (e.g., `live:start`, `live:chat:send`)
- **API routes:** RESTful with `/api/live/*` prefix
- **Database:** `camelCase` for fields, `PascalCase` for model names

### 5.3 Code Style Requirements

- **TypeScript strict mode** on both client and server
- **No comments** unless explicitly requested
- **Zod validation** on all write endpoints
- **AsyncHandler** wrapper on all route handlers
- **ApiError** for all error responses
- **sendSuccess/sendPaginated** for all success responses
- **Winston logger** for all logging (no console.log in production code)
- **Tailwind CSS** for all styling (no inline styles)

---

## 6. LIVE MODULE ARCHITECTURE (Recommended)

### 6.1 Backend Module Structure

```
server/src/
├── models/
│   ├── LiveSession.ts          # Session state, metadata, settings
│   ├── LiveChatMessage.ts      # Chat persistence with TTL
│   ├── LiveGift.ts             # Gift transactions with idempotency
│   ├── LiveReplay.ts           # Replay metadata
│   ├── LiveModeration.ts       # Moderation action log
│   └── LivePoll.ts             # Live polls
├── controllers/
│   └── live.controller.ts      # REST API handlers
├── routes/
│   └── live.routes.ts          # REST routes
├── services/
│   ├── live.service.ts         # Core session management
│   ├── livekit.service.ts      # LiveKit token generation + room management
│   ├── live-chat.service.ts    # Chat + moderation
│   ├── live-gift.service.ts    # Gift/wallet/transactions
│   ├── live-analytics.service.ts # Analytics tracking
│   └── live-moderation.service.ts # Moderation logic
├── validators/
│   └── live.validator.ts       # Zod schemas
├── socket/
│   └── live.ts                 # /live namespace handlers
└── workers/
    └── live-replay.worker.ts   # Post-stream processing
```

### 6.2 Frontend Module Structure

```
client/src/
├── live/
│   ├── types/
│   │   └── index.ts            # All live-related types
│   ├── store/
│   │   └── liveStore.ts        # Zustand store
│   ├── hooks/
│   │   ├── useLiveRoom.ts      # LiveKit room connection
│   │   ├── useLiveChat.ts      # Chat messaging
│   │   ├── useLiveGifts.ts     # Gift operations
│   │   ├── useLiveAnalytics.ts # Real-time stats
│   │   ├── useLiveModeration.ts# Mod tools
│   │   └── useLiveDiscovery.ts # Discovery feed
│   ├── services/
│   │   ├── liveApi.ts          # REST API calls
│   │   └── liveSocket.ts       # Socket event handlers
│   ├── components/
│   │   ├── LivePlayer.tsx       # WebRTC video (LiveKit)
│   │   ├── LiveChat.tsx         # Chat panel
│   │   ├── LiveGiftAnimation.tsx# Gift animations
│   │   ├── LiveViewerBar.tsx    # Viewer count/likes/share
│   │   ├── LiveHostControls.tsx # Host controls
│   │   ├── LiveProductCard.tsx  # Pinned product overlay
│   │   ├── LiveBookingCTA.tsx   # Book Now CTA
│   │   ├── LiveReportModal.tsx  # Report dialog
│   │   ├── LiveModerationPanel.tsx # Mod panel
│   │   ├── LiveReplayPlayer.tsx # Replay player
│   │   ├── LiveDiscoveryFeed.tsx# Discovery feed
│   │   └── LiveSkeleton.tsx     # Loading states
│   └── pages/
│       ├── LiveHostPage.tsx     # Host streaming
│       ├── LiveViewerPage.tsx   # Viewer experience
│       ├── LiveDiscoveryPage.tsx# Discovery/browse
│       └── LiveReplayPage.tsx   # Replay viewing
```

### 6.3 Database Schema Design (Preview)

**LiveSession:**
```typescript
{
  stylistId: ObjectId (ref: Stylist, required, indexed),
  hostUserId: ObjectId (ref: User, required),
  title: string,
  description?: string,
  status: 'scheduled' | 'live' | 'paused' | 'ended',
  roomName: string (unique, LiveKit room ID),
  viewerCount: number (default: 0),
  peakViewerCount: number (default: 0),
  totalViews: number (default: 0),
  likeCount: number (default: 0),
  chatMessageCount: number (default: 0),
  giftCount: number (default: 0),
  totalGiftValue: number (default: 0),
  bookingCount: number (default: 0),
  settings: {
    chatEnabled: boolean (default: true),
    slowModeMs: number (default: 0),
    followersOnly: boolean (default: false),
    giftsEnabled: boolean (default: true),
    recordingEnabled: boolean (default: true),
  },
  pinnedProducts: [{ productId: ObjectId, pinnedAt: Date }],
  pinnedServices: [{ serviceId: ObjectId, pinnedAt: Date }],
  startedAt?: Date,
  endedAt?: Date,
  duration?: number,
  replayUrl?: string,
  thumbnailUrl?: string,
  tags: string[],
  category: string,
  // Analytics
  averageWatchTimeMs: number,
  uniqueViewerCount: number,
}
```

**LiveChatMessage:**
```typescript
{
  sessionId: ObjectId (ref: LiveSession, required, indexed),
  senderId: ObjectId (ref: User, required),
  senderName: string,
  senderAvatar?: string,
  senderRole: 'host' | 'moderator' | 'viewer',
  content: string (required, maxLength: 500),
  type: 'text' | 'emoji' | 'gift' | 'system' | 'pinned',
  replyTo?: ObjectId,
  isDeleted: boolean (default: false),
  deletedBy?: ObjectId,
  deletedReason?: string,
  createdAt: Date (TTL: 30 days)
}
```

**LiveGift:**
```typescript
{
  sessionId: ObjectId (ref: LiveSession, required, indexed),
  senderId: ObjectId (ref: User, required),
  recipientId: ObjectId (ref: User, required),
  giftType: string (required),
  giftValue: number (required),
  quantity: number (default: 1),
  idempotencyKey: string (unique, required),
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  createdAt: Date
}
```

### 6.4 LiveKit Integration

**Why LiveKit:**
- Production-ready SFU (Selective Forwarding Unit)
- Built-in simulcast, adaptive bitrate, ICE restart, TURN/STUN
- Server-side room management with tokens
- Recording support (Egress API)
- Simulcast quality layers (auto, high, medium, low)
- SDKs for React, iOS, Android
- Free tier: 50 participants, 50GB/month bandwidth
- Self-hostable or cloud-hosted

**Token Generation:**
```typescript
// Server-side: Generate JWT for LiveKit
import { AccessToken } from 'livekit-server-sdk';

function generateLiveKitToken(roomName: string, participantIdentity: string, role: 'host' | 'viewer') {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
  });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: role === 'host',
    canSubscribe: true,
    canPublishData: true,
  });
  return at.toJwt();
}
```

---

## 7. SOCKET EVENTS DESIGN (Preview)

### 7.1 `/live` Namespace Events

**Client → Server:**
| Event | Payload | Auth | Rate Limit |
|-------|---------|------|-----------|
| `live:join` | `{ sessionId }` | Required | 10/min |
| `live:leave` | `{ sessionId }` | Required | 10/min |
| `live:chat:send` | `{ sessionId, content, replyTo? }` | Required | 30/min |
| `live:chat:typing` | `{ sessionId, isTyping }` | Required | — |
| `live:like` | `{ sessionId }` | Required | 60/min |
| `live:reaction` | `{ sessionId, emoji }` | Required | 30/min |
| `live:gift:send` | `{ sessionId, giftType, quantity }` | Required | 10/min |
| `live:pin:product` | `{ sessionId, productId }` | Host only | 5/min |
| `live:pin:service` | `{ sessionId, serviceId }` | Host only | 5/min |
| `live:pin:message` | `{ sessionId, messageId }` | Host/Mod | 5/min |
| `live:mod:mute` | `{ sessionId, userId }` | Host/Mod | — |
| `live:mod:kick` | `{ sessionId, userId }` | Host only | — |
| `live:mod:ban` | `{ sessionId, userId }` | Host only | — |
| `live:chat:delete` | `{ sessionId, messageId }` | Host/Mod | — |
| `live:report` | `{ sessionId, reason }` | Required | 3/min |
| `live:book` | `{ sessionId, serviceId }` | Required | — |
| `live:queue:join` | `{ sessionId }` | Required | — |

**Server → Client:**
| Event | Payload | Target |
|-------|---------|--------|
| `live:viewer:join` | `{ userId, name, avatar }` | Room |
| `live:viewer:leave` | `{ userId }` | Room |
| `live:viewer:list` | `{ viewers: [...] }` | Requester |
| `live:chat:message` | `{ message }` | Room |
| `live:chat:delete` | `{ messageId }` | Room |
| `live:like` | `{ likeCount }` | Room |
| `live:reaction` | `{ emoji, userId }` | Room |
| `live:gift:received` | `{ gift }` | Room |
| `live:gift:animation` | `{ giftType, senderName }` | Room |
| `live:pin:product` | `{ product }` | Room |
| `live:pin:service` | `{ service }` | Room |
| `live:pin:message` | `{ message }` | Room |
| `live:mod:muted` | `{ userId }` | Room |
| `live:mod:kicked` | `{ userId }` | Target |
| `live:mod:banned` | `{ userId }` | Room |
| `live:analytics:update` | `{ viewerCount, likeCount, ... }` | Room |
| `live:host:started` | `{ sessionId }` | Subscribers |
| `live:host:ended` | `{ sessionId }` | Subscribers |
| `live:status` | `{ status }` | Requester |

---

## 8. REST API DESIGN (Preview)

### 8.1 Live Session Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/live/sessions` | Stylist | Create session (scheduled or immediate) |
| PATCH | `/api/live/sessions/:id/start` | Stylist | Start live stream |
| PATCH | `/api/live/sessions/:id/pause` | Stylist | Pause stream |
| PATCH | `/api/live/sessions/:id/resume` | Stylist | Resume stream |
| PATCH | `/api/live/sessions/:id/end` | Stylist | End stream |
| GET | `/api/live/sessions/:id` | Soft | Get session details |
| GET | `/api/live/sessions/:id/token` | Auth | Generate LiveKit join token |
| GET | `/api/live/featured` | Public | Featured/trending live sessions |
| GET | `/api/live/discover` | Public | Discovery feed (paginated) |
| GET | `/api/live/following` | Auth | Following live sessions |
| GET | `/api/live/nearby` | Auth | Nearby live sessions |
| GET | `/api/live/replays` | Public | Replay list |
| GET | `/api/live/replays/:id` | Public | Single replay |
| GET | `/api/live/sessions/:id/analytics` | Stylist | Session analytics |

### 8.2 Chat Endpoints (REST fallback)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/live/sessions/:id/messages` | Auth | Get chat history (paginated) |
| DELETE | `/api/live/sessions/:id/messages/:msgId` | Host/Mod | Delete message |

### 8.3 Gift Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/live/gifts/catalog` | Public | Available gifts |
| GET | `/api/live/gifts/balance` | Auth | User credit balance |
| GET | `/api/live/sessions/:id/leaderboard` | Public | Gift leaderboard |
| GET | `/api/live/gifts/history` | Auth | Gift history |

### 8.4 Moderation Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/live/sessions/:id/report` | Auth | Report stream |
| POST | `/api/live/sessions/:id/messages/:msgId/report` | Auth | Report message |
| GET | `/api/live/sessions/:id/moderation-log` | Host/Mod | Moderation audit log |

### 8.5 Product/Service Integration

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/live/sessions/:id/pin/product` | Stylist | Pin product |
| POST | `/api/live/sessions/:id/pin/service` | Stylist | Pin service |
| DELETE | `/api/live/sessions/:id/pin/product/:productId` | Stylist | Unpin product |
| DELETE | `/api/live/sessions/:id/pin/service/:serviceId` | Stylist | Unpin service |
| GET | `/api/live/sessions/:id/pinned` | Public | Get pinned items |

---

## 9. DATABASE INDEXES (Preview)

```typescript
// LiveSession
LiveSession.index({ status: 1, category: 1, startedAt: -1 });      // Discovery feed
LiveSession.index({ stylistId: 1, status: 1 });                     // Stylist's sessions
LiveSession.index({ status: 1, peakViewerCount: -1 });              // Trending
LiveSession.index({ status: 1, startedAt: -1 });                    // Newest
LiveSession.index({ 'tags': 1, status: 1 });                        // Category/tag filter

// LiveChatMessage
LiveChatMessage.index({ sessionId: 1, createdAt: -1 });             // Chat history
LiveChatMessage.index({ sessionId: 1, createdAt: 1 }, { expireAfterSeconds: 2592000 }); // TTL: 30 days

// LiveGift
LiveGift.index({ sessionId: 1, createdAt: -1 });                    // Session gifts
LiveGift.index({ senderId: 1, createdAt: -1 });                     // User gift history
LiveGift.index({ idempotencyKey: 1 }, { unique: true });            // Idempotency

// LiveModeration
LiveModeration.index({ sessionId: 1, createdAt: -1 });              // Audit log
```

---

## 10. PERFORMANCE TARGETS

| Metric | Target | Strategy |
|--------|--------|----------|
| Join time (click to video) | < 2s | Pre-fetch token, LiveKit optimized ICE |
| Video latency | < 500ms | LiveKit SFU with simulcast |
| Chat message latency | < 150ms | Socket.IO direct emit |
| Discovery page load | < 1s | Redis-cached feeds, pagination |
| Concurrent viewers | 10,000+ | LiveKit SFU handles video; Socket.IO Redis adapter for chat |
| Reconnection | < 3s | LiveKit auto-reconnect + ICE restart |

---

## 11. BUILD STATUS CHECKLIST

After Phase 1 (this audit):
- [x] All existing files read and understood
- [x] Integration points identified
- [x] Risks documented
- [x] Reusable components cataloged
- [x] Architecture designed
- [ ] No code changes made (Phase 1 is read-only)

---

## 12. SUMMARY

**What Exists:**
- Production-grade Express + MongoDB + Redis + Socket.IO backend
- React 19 + TypeScript strict frontend with 66+ pages
- Robust booking, queue, payment, notification, and credit systems
- Socket.IO with Redis adapter for horizontal scaling
- Bull queue for async job processing
- Comprehensive auth (JWT + Firebase)
- Cloudinary for media storage
- Sentry + Winston for observability

**What Needs to Be Built:**
- LiveKit integration (SFU for WebRTC video)
- Live session management (CRUD, lifecycle)
- Real-time chat with moderation
- Gift system with wallet/transactions/ledger
- In-stream booking + product integration
- Discovery feed (TikTok-quality vertical scroll)
- Replay system
- Analytics dashboard
- Comprehensive security (rate limiting, anti-spam, input validation)

**Key Decisions:**
1. Use **LiveKit** (not custom WebRTC) — production-ready SFU with adaptive bitrate, simulcast, ICE restart
2. Create **dedicated `/live` socket namespace** — isolate live traffic from existing queue/conversation namespaces
3. **Reuse existing models** — User, Stylist, Product, Service, Booking, Queue, UserCredit, Notification
4. **Create new models** — LiveSession, LiveChatMessage, LiveGift, LiveReplay, LiveModeration
5. **Zustand** for client-side live state management (not Context — needs performance for real-time updates)
6. **Redis-backed** moderation state (not in-memory) to avoid split-brain

---

*End of Phase 1 Audit. Ready for Phase 2 — Architecture Design.*
