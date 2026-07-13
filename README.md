<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-8-47A248?style=flat-square&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis" alt="Redis">
  <img src="https://img.shields.io/badge/Docker-25-2496ED?style=flat-square&logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/License-Private-red" alt="License">
</p>

<h1 align="center">GlowUp OS</h1>

<p align="center">
  <strong>The operating system for beauty professionals.</strong><br>
  A full-stack platform combining real-time booking, live streaming, AI-powered style previews, POS, and integrated payments — built for barbers, stylists, and beauty studios.
</p>

<p align="center">
  <a href="#-live-demo">Live Demo</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## Live Demo

| Platform | URL |
|----------|-----|
| **Frontend** (Vercel) | [glowup-one.vercel.app](https://glowup-one.vercel.app) |
| **Backend API** (Render) | [glowup-backend-jcos.onrender.com](https://glowup-backend-jcos.onrender.com) |

> First-time Render spins may take 30–60 seconds to wake up.

---

## Features

### Consumer Experience
| Feature | Description |
|---------|-------------|
| **Smart Booking** | Browse stylists, filter by service/price/rating/location, book appointments with real-time slot availability |
| **AI Hairstyle Previews** | Upload a selfie → HuggingFace FLUX model generates hairstyle previews in real time |
| **Live Streaming** | Join stylist live rooms via WebRTC; real-time chat, reactions, follow, and in-stream booking |
| **Service Catalog** | Searchable catalog with categories, price ranges, duration, and photo galleries |
| **Saved & Favorites** | Bookmark stylists and services for quick rebooking |
| **Style Feed** | Social-style feed of stylist work, filtered by service type |
| **Maps & Discovery** | Leaflet maps with clustering to discover nearby stylists |
| **Multi-language** | Full i18n across 10 locales (en, es, fr, de, pt, zh, ja, ko, ar, hi) |
| **Dark/Light Mode** | System-aware theme with manual toggle |
| **Payment Integration** | Secure Paystack checkout with card tokenization, webhooks, and payment history |

### Business/Stylist Dashboard
| Feature | Description |
|---------|-------------|
| **POS (Point of Sale)** | Accept walk-ins, scan barcodes, manage inventory with real-time stock deduction |
| **Booking Management** | Accept/decline/reject appointments, manage schedule with recurring availability |
| **Service & Pricing Control** | Create/edit/delete services with categories, duration, pricing, and photo uploads |
| **Analytics Dashboard** | Revenue charts, booking trends, top services, stylist performance metrics |
| **Financial Overview** | Transaction history, EOD reports, earnings breakdown, export to CSV |
| **Product Catalog** | Manage products with images, stock levels, cost prices, barcode generation |
| **Customer Management** | CRM with loyalty points, spending history, customer analytics |
| **Loyalty System** | Configurable points-per-naira rules, redemption thresholds, customer tiers |
| **Live Streaming Studio** | Go live with real-time viewer count, chat, reactions, and booking links |
| **Profile & Branding** | Portfolio gallery, bio, social links, working hours management |

### Platform & Administration
| Feature | Description |
|---------|-------------|
| **Role-based Access** | Consumer, Stylist, and Admin roles with granular permissions |
| **Admin Dashboard** | Platform-wide analytics, user management, flagged content |
| **Onboarding Flows** | Multi-step wizards for both consumers and stylists |
| **Referral System** | Referral code generation, tracking, and reward distribution |
| **Real-time Notifications** | Socket.io-powered instant notifications across the platform |
| **Comprehensive Search** | Unified search across stylists, services, and products |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19)                        │
│  Vite 8 · TypeScript 6 · Tailwind CSS · Framer Motion · i18n   │
│  Zustand 5 · Leaflet Maps · Socket.IO Client · Paystack SDK    │
└───────────────┬─────────────────────────┬───────────────────────┘
                │ REST API                │ WebSocket
                ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   REVERSE PROXY (Nginx)                         │
│              /api/* → :5000  /socket.io → :5000                 │
└───────────────┬─────────────────────────┬───────────────────────┘
                │                         │
                ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SERVER (Express 4 + TypeScript 5)              │
│  29 Route Groups · 28 Controllers · 33 Mongoose Models         │
│  Zod Validation · RBAC Middleware · Rate Limiting               │
└──────┬──────────┬──────────┬──────────┬─────────────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
   ┌───────┐ ┌───────┐ ┌────────┐ ┌──────────┐
   │MongoDB│ │ Redis │ │Paystack│ │HuggingFace│
   │  8.0  │ │  7.0  │ │  API   │ │  FLUX     │
   └───────┘ └───────┘ └────────┘ └──────────┘
```

### Data Flow — Booking
```
Consumer selects time slot
  → POST /api/bookings (Zod validated)
  → BookingController.createBooking
    → Locks slot (atomic findOneAndUpdate with date + stylistId)
    → Creates booking (status: pending)
    → Sends Socket.IO notification to stylist
    → Returns booking to consumer
Stylist accepts via dashboard
  → PATCH /api/bookings/:id/accept
    → Updates status → confirmed
    → Notifies consumer via Socket.IO
```

### Data Flow — Payment
```
Consumer clicks "Pay Now"
  → POST /api/payments/charge (dynamic provider lookup)
  → PaymentController.chargeCard
    → PaystackProvider.initTransaction(amount, email, metadata)
    → Returns authorization_url to client
  → Consumer completes payment on Paystack
  → Paystack sends webhook → POST /api/payments/webhook/paystack
    → HMAC-SHA512 signature verified
    → Transaction updated atomically (session)
    → Booking status → confirmed
    → Stock deducted if applicable
```

---

## Tech Stack

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 19 | UI rendering with concurrent features |
| **Language** | TypeScript 6 | End-to-end type safety |
| **Build** | Vite 8 | HMR, code splitting, production bundling |
| **Styling** | Tailwind CSS 4 | Utility-first responsive design |
| **State** | Zustand 5 | Lightweight global state management |
| **Routing** | React Router DOM 7 | Client-side navigation with lazy loading |
| **Animation** | Framer Motion 12 | Page transitions, micro-interactions |
| **Maps** | React-Leaflet | Interactive maps with marker clustering |
| **Forms** | React Hook Form 7 + Zod 3 | Performant forms with schema validation |
| **Real-time** | Socket.IO Client 4 | Live notifications, chat, streaming |
| **i18n** | i18next + react-i18next | 10-language internationalization |
| **HTTP** | Axios 1.12 | API client with interceptors |
| **Auth** | Firebase Auth 12 | Google/Apple social login |
| **Storage** | Cloudinary | Image/video uploads and optimization |
| **Analytics** | Microsoft Clarity | Session replays, heatmaps |
| **Errors** | Sentry | Client-side error tracking |

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 22 | JavaScript execution |
| **Framework** | Express 4 | HTTP routing and middleware |
| **Language** | TypeScript 5 | Type safety on server |
| **Database** | MongoDB 8 + Mongoose 8 | Document storage with ODM |
| **Cache** | Redis 7 | Session cache, Socket.IO adapter, trending cache |
| **Validation** | Zod 3 | Runtime request schema validation |
| **Auth** | JWT (access + refresh) + bcrypt | Token-based authentication |
| **Social Auth** | Firebase Admin 13 | Server-side token verification |
| **Payments** | Paystack (provider-agnostic abstraction) | Secure payment processing |
| **AI** | HuggingFace Inference | Hairstyle generation (FLUX model) |
| **Email** | Nodemailer 7 | Transactional email sending |
| **Errors** | Sentry | Server-side error tracking |
| **Logging** | Winston 3 | Structured logging |
| **Streaming** | Socket.IO 4 + WebRTC signaling | Real-time communication |
| **File Upload** | Multer 2 + Cloudinary | File handling and cloud storage |

### Infrastructure
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker + Docker Compose | Consistent dev/prod environments |
| **Reverse Proxy** | Nginx | Static file serving, API proxying, rate limiting |
| **CI/CD** | GitHub Actions | Automated testing, linting, type checking |
| **Hosting** | Render (backend) + Vercel (frontend) | Production deployment |
| **Database** | MongoDB Atlas | Managed MongoDB hosting |
| **Cache** | Upstash | Managed Redis hosting |

---

## System Design

### Payment Architecture

The payment layer is **fully provider-agnostic** — currently wired to Paystack, ready for Stripe/MoMo/M-Pesa by implementing one interface.

```typescript
// server/src/services/payment/types.ts
interface CardPaymentProvider {
  initializeTransaction(amount: number, email: string, metadata: Record<string, string>): Promise<PaymentInitResult>;
  verifyTransaction(reference: string): Promise<PaymentVerificationResult>;
}
```

**Webhook flow** is provider-aware via dynamic routes:
```
POST /api/payments/webhook/:provider
```

All multi-write operations (transaction + booking + inventory) run inside **Mongoose sessions** for atomicity. Amount validation ensures webhook amounts match expected booking amounts.

### Authentication Flow
```
1. User logs in → POST /api/auth/login
2. Server validates credentials → bcrypt compare
3. Issues JWT access token (15min) + refresh token (7d, httpOnly cookie)
4. Client stores access token in memory only
5. Every request: Authorization: Bearer <token>
6. On 401 → client uses refresh token to rotate
7. Social login: Firebase token → Firebase Admin verify → issue JWT
```

### Real-time Architecture
```
Socket.IO connected
  → Redis adapter (multi-instance pub/sub)
  → Namespaces: /notifications, /chat, /streaming
  → Room-based broadcasting for live streams
  → WebRTC signaling via Socket.IO for peer connections
```

### Rate Limiting
| Scope | Window | Limit | Strategy |
|-------|--------|-------|----------|
| Auth endpoints | 15 min | 50 req/IP | Sliding window |
| Write endpoints | 15 min | 100 req/user | Token bucket |
| General API | 15 min | 100 req/user | Standard |

---

## Project Structure

```
glowup-backend-/
├── client/                          # React 19 SPA
│   ├── src/
│   │   ├── api/                     # API client modules (29 files)
│   │   │   ├── auth.ts, bookings.ts, stylists.ts, payments.ts ...
│   │   ├── components/              # Shared UI components
│   │   │   ├── Layout.tsx           # Main layout with sidebar
│   │   │   ├── ProtectedRoute.tsx   # Auth route guard
│   │   │   └── ui/                  # Button, Input, Modal, etc.
│   │   ├── context/                 # React contexts
│   │   │   └── ThemeContext.tsx      # Dark/light mode
│   │   ├── features/                # Feature-based modules
│   │   │   ├── consumer/            # Consumer dashboard
│   │   │   ├── stylist/             # Stylist dashboard
│   │   │   ├── admin/               # Admin dashboard
│   │   │   ├── auth/                # Login, register, forgot password
│   │   │   ├── booking/             # Booking flow + management
│   │   │   ├── payments/            # Payment forms, callbacks
│   │   │   ├── live/                # Live streaming + chat
│   │   │   └── onboarding/          # User/stylist onboarding
│   │   ├── hooks/                   # Custom React hooks (11+)
│   │   ├── i18n/                    # Internationalization
│   │   │   ├── index.ts             # i18next config
│   │   │   └── locales/             # 10 language files
│   │   ├── pages/                   # Route page components (70+)
│   │   │   ├── Landing.tsx          # Public landing page
│   │   │   ├── consumer/            # Consumer pages (27)
│   │   │   ├── stylist/             # Stylist pages (14)
│   │   │   └── admin/               # Admin pages (6)
│   │   ├── services/                # Business logic services
│   │   │   └── analytics/           # Microsoft Clarity integration
│   │   ├── store/                   # Zustand stores
│   │   ├── types/                   # TypeScript type definitions
│   │   │   ├── index.ts             # Core types
│   │   │   └── api.ts               # API response types
│   │   └── utils/                   # Utility functions
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── server/                          # Express 4 API
│   ├── src/
│   │   ├── config/                  # App configuration
│   │   │   ├── index.ts             # Environment variables
│   │   │   ├── database.ts          # MongoDB connection
│   │   │   └── redis.ts             # Redis connection
│   │   ├── controllers/             # Route handlers (28 files)
│   │   │   ├── auth.controller.ts
│   │   │   ├── booking.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── stylist.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   └── ... (23 more)
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.middleware.ts    # JWT verification
│   │   │   ├── validate.ts          # Zod schema validation
│   │   │   ├── rateLimiter.ts       # Rate limiting
│   │   │   └── errorHandler.ts      # Global error handler
│   │   ├── models/                  # Mongoose models (33 schemas)
│   │   │   ├── User.ts, Stylist.ts, Booking.ts, Service.ts
│   │   │   ├── Transaction.ts, Product.ts, Inventory.ts
│   │   │   ├── LiveRoom.ts, ChatMessage.ts, Notification.ts
│   │   │   └── ... (22 more)
│   │   ├── providers/               # External service providers
│   │   │   └── ai.ts               # HuggingFace FLUX integration
│   │   ├── routes/                  # Express route definitions (29 files)
│   │   ├── services/                # Business logic layer
│   │   │   ├── payment/             # Payment abstraction layer
│   │   │   │   ├── types.ts         # Provider interface
│   │   │   │   ├── factory.ts       # Dynamic provider registry
│   │   │   │   ├── paystack.ts      # Paystack implementation
│   │   │   │   ├── platform-fee.ts  # Fee calculation
│   │   │   │   ├── webhook.ts       # Webhook verification
│   │   │   │   └── verify-payment.ts # Shared verification
│   │   │   ├── trending.service.ts  # Trending calculation
│   │   │   ├── loyalty.service.ts   # Loyalty points logic
│   │   │   └── email.service.ts     # Email sending
│   │   ├── socket/                  # Socket.IO handlers
│   │   │   ├── index.ts             # Socket server setup
│   │   │   ├── notifications.ts     # Notification events
│   │   │   ├── chat.ts              # Chat messaging
│   │   │   └── liveStreaming.ts     # Live room management
│   │   ├── utils/                   # Utility functions
│   │   ├── __tests__/               # Jest test suites (164 tests)
│   │   │   ├── token.test.ts
│   │   │   ├── auth.middleware.test.ts
│   │   │   ├── validate.test.ts
│   │   │   ├── auth.controller.test.ts
│   │   │   ├── booking.controller.test.ts
│   │   │   ├── payment.controller.test.ts
│   │   │   └── ... (4 more)
│   │   └── index.ts                 # Server entry point
│   ├── seed/                        # Database seed scripts
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── Dockerfile.prod              # Multi-stage production build
│
├── nginx/                           # Nginx reverse proxy config
│   ├── nginx.conf                   # Main config
│   └── sites/                       # Site-specific configs
├── docker-compose.yml               # Development containers
├── docker-compose.prod.yml          # Production containers
├── render.yaml                      # Render deployment manifest
├── .github/workflows/ci.yml         # CI pipeline (lint + typecheck)
├── .env.example                     # Environment template
└── .dockerignore
```

---

## Engineering Decisions

### Why Provider-Agnostic Payments?
MTN MoMo and M-Pesa operate through Paystack's aggregated channels. Rather than maintaining separate integrations, we built a `CardPaymentProvider` interface with a factory pattern. Adding a new provider (Stripe, direct MoMo API) requires implementing **one interface** — no controller or route changes.

### Why Mongoose Sessions for Payments?
A single payment webhook triggers 3–4 database writes (transaction update, booking confirmation, inventory deduction, loyalty points). Without sessions, a failure mid-write leaves inconsistent data. Sessions ensure all-or-nothing atomicity.

### Why Socket.IO Over Native WebSocket?
Socket.IO provides automatic reconnection, room-based broadcasting, namespace isolation, and a Redis adapter for horizontal scaling — all critical for live streaming and real-time chat without building it from scratch.

### Why Zustand Over Redux?
For a marketplace app with many independent UI states (booking flow, chat, POS, streaming), Zustand's minimal API and slice pattern avoids the boilerplate overhead of Redux while keeping state predictable.

### Why i18next Over a Lighter Solution?
Ten languages with pluralization, interpolation, and namespace splitting. i18next's ecosystem handles this at scale where lighter solutions would require custom code.

---

## Security

| Layer | Measure |
|-------|---------|
| **Auth** | JWT access tokens (15min) stored in memory only; refresh tokens in httpOnly cookies |
| **Password** | bcrypt hashing with salting (pre-save hook on User model) |
| **CSRF** | Double-submit cookie pattern on all state-changing requests |
| **CORS** | Restricted to `CLIENT_URL` origin (not `*`) |
| **Headers** | Helmet security headers + CSP via Nginx in production |
| **Rate Limiting** | Sliding window on auth endpoints, token bucket on writes |
| **Payments** | Paystack webhook HMAC-SHA512 timing-safe signature verification |
| **Validation** | Zod schemas on every write endpoint — rejects malformed input at the edge |
| **RBAC** | Role-based middleware guards (consumer, stylist, admin) |
| **Secrets** | Production secrets in Render environment variables, never committed |
| **Files** | Multer with file type/size validation before Cloudinary upload |

---

## Performance

| Optimization | Implementation |
|-------------|----------------|
| **Code Splitting** | React.lazy + Suspense on all route pages |
| **Image Optimization** | Cloudinary auto-format, width/quality params on all `<img>` tags |
| **Caching** | Redis for trending data, Socket.IO adapter, session store |
| **DB Indexes** | Compound indexes on Booking (stylist + date + status), Transaction (userId + status) |
| **Lazy Loading** | Intersection Observer on image-heavy pages |
| **Bundle Analysis** | Vite rollup visualizer available via `npm run build -- --mode analyze` |
| **Compression** | Nginx gzip on all text/json responses |
| **Connection Pooling** | Mongoose default connection pool (10 sockets) |

---

## Getting Started

### Prerequisites
- **Node.js** >= 22
- **MongoDB** >= 6.0 (or MongoDB Atlas)
- **Redis** >= 7.0 (optional — falls back to in-memory cache)
- **Docker & Docker Compose** (for production-like dev)

### 1. Clone & Install
```bash
git clone https://github.com/learnfromothers32-cell/glowup-backend-.git
cd glowup-backend-

# Install all dependencies
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Environment Variables
```bash
# Server
cp server/.env.example server/.env
# Fill in: MONGODB_URI, JWT secrets, PAYSTACK keys, Firebase credentials

# Client
cp client/.env.example client/.env
# Fill in: VITE_FIREBASE_*, VITE_PAYSTACK_PUBLIC_KEY, VITE_API_BASE_URL
```

See `.env.example` for the full variable reference.

### 3. Run in Development
```bash
# Terminal 1 — API server (port 5000)
cd server && npm run dev

# Terminal 2 — Vite dev server (port 5173)
cd client && npm run dev
```

### 4. Seed Demo Data
```bash
cd server && npm run seed
```
Creates sample users, stylists, services, and products.

### 5. Run Tests
```bash
cd server && npm test
# 164 tests across 9 suites
```

---

## Deployment

### Production (Docker Compose)
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Spins up: **Nginx** (port 80/443) → **Client** (port 3000) + **Server** (port 5000) → **MongoDB** + **Redis**

### Render + Vercel (Current Production)
- **Backend**: Render Web Service (`Dockerfile.prod`)
- **Frontend**: Vercel (auto-deployed from `main` branch)
- **Database**: MongoDB Atlas
- **Cache**: Upstash Redis

Environment variables are configured in Render Dashboard and Vercel Project Settings.

### Required Production Environment Variables
| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Upstash Redis URL |
| `JWT_SECRET` | Strong random string for token signing |
| `JWT_REFRESH_SECRET` | Strong random string for refresh tokens |
| `PAYSTACK_SECRET_KEY` | Paystack live secret key |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack webhook HMAC secret |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLIENT_URL` | Production frontend origin |
| `SENTRY_DSN` | Sentry error tracking DSN |
| `CLARITY_ID` | Microsoft Clarity project ID |

---

## Production Readiness

| Category | Status |
|----------|--------|
| TypeScript strict mode | ✅ Enabled on both client and server |
| Input validation | ✅ Zod schemas on all write endpoints |
| Authentication | ✅ JWT + refresh rotation + Firebase social |
| Authorization | ✅ RBAC middleware (consumer/stylist/admin) |
| Rate limiting | ✅ Auth + write endpoints |
| Error handling | ✅ Global handler + Sentry integration |
| Logging | ✅ Winston structured logging |
| Database migrations | ✅ Mongoose schemas with indexes |
| Containerization | ✅ Multi-stage Dockerfile + docker-compose |
| CI/CD | ✅ GitHub Actions (lint + typecheck) |
| Payment security | ✅ HMAC verification + amount validation + atomic writes |
| Webhook reliability | ✅ Provider-agnostic with signature verification |
| Analytics | ✅ Microsoft Clarity session tracking |
| Internationalization | ✅ 10 languages via i18next |
| Tests | ✅ 164 tests, 9 suites, 100% passing |

---

## Roadmap

- [ ] **Stripe integration** — expand payment abstraction with direct Stripe provider
- [ ] **Push notifications** — Firebase Cloud Messaging for mobile
- [ ] **Video calls** — WebRTC peer-to-peer consultations
- [ ] **AI style recommendations** — collaborative filtering based on preferences
- [ ] **Multi-image hairstyle preview** — batch generation with style variations
- [ ] **Stylist subscription plans** — tiered feature access (basic/pro/enterprise)
- [ ] **Advanced analytics** — cohort analysis, LTV prediction, churn detection
- [ ] **Mobile app** — React Native wrapper or PWA with service worker
- [ ] **E-signatures** — digital consent forms for service agreements
- [ ] **Inventory API** — barcode scanning SDK integration

---

## License

Private — All rights reserved.

---

<p align="center">
  Built with care for beauty professionals who deserve better tools.
</p>
