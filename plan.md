# GlowUp — Beauty Experience OS

**Current State | June 2026**

## Architecture

```
startup_client (Vite/React 18 + Tailwind) ──proxy── startup_server (Express + ts-node-dev)
                                                           ├── startup_mongo (MongoDB)
                                                           └── startup_redis (Redis)
```

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, React Router v6, Socket.IO Client
- **Backend**: Express, Mongoose, JWT auth, Paystack, Socket.IO, Redis
- **Infrastructure**: Docker Compose (4 containers), Vite proxy for same-origin cookies

## ✅ What Exists (Live & Working)

### Auth System
- Email/password registration & login with bcrypt + JWT
- Google/Apple/Instagram social auth via Firebase
- JWT access tokens (15min) + httpOnly refresh token cookies (7d)
- Token refresh interceptor on axios (queues pending requests during refresh)
- Role-based access (`client` | `stylist` | `admin`)
- Protected routes with redirect logic per role

### Consumer App (`/app/*`)
- **Home**: Nearby/recommended stylists, live stylist strip, recently viewed, favorites, trending preview, beauty tips
- **Stylist Detail**: Portfolio, services with pricing/duration, before/after gallery, booking CTA
- **Booking Modal**: Service selection → date/time picker → confirmation
- **My Bookings**: List of bookings with status, filters (upcoming/past/cancelled)
- **Favorites**: Full CRUD via API — add/remove/toggle stylist favorites
- **Profile**: User info, glow score, level, XP, achievements, booking history
- **Settings**: Notifications toggles, privacy, appearance theme (light/dark/system), password change, delete account
- **Search**: Global search modal (⌘K), search results with filters
- **Live Room**: Full-screen live stream UI with comments, likes, follow, gift, book button (protected by auth)
- **Vibe Match**: Mood card selection flow, AI-style matching UI
- **Rewards**: XP progress, level badges, streak counter, referral system
- **Trending Feed**: Full-screen TikTok-style feed with like/bookmark
- **Service Page / Service Detail**: Browse services by category

### Stylist App (`/stylist/*`)
- **Dashboard**: Stats (bookings, revenue, rating), upcoming appointments, recent activity
- **Services**: CRUD for services (name, price, duration, category, active toggle)
- **Portfolio**: Upload & manage portfolio images
- **Calendar**: Month view with booking highlights
- **Bookings**: Incoming bookings with accept/cancel/reschedule
- **Clients**: Client history with booking records
- **Earnings**: Revenue breakdown, payout history
- **Analytics**: Booking trends, popular services, peak hours
- **Availability**: Day-by-day slot management with time ranges
- **Messages**: Inbox with conversation threads
- **Live**: Go live, manage stream
- **Settings**: Profile editing, business info
- **Onboarding**: Multi-step wizard (profile → services → schedule)

### Real-Time Queue (Socket.IO)
- Join/leave queue per stylist
- Position tracking with real-time updates
- Estimated wait time display
- Socket.IO with Redis adapter for horizontal scaling

### Notifications System
- **Backend**: Notification model (MongoDB), 5 notification types (booking/stylist/badge/promo/reminder), CRUD API, helper utilities (`notifyBookingConfirmed`, `notifyBadgeEarned`, etc.)
- **Frontend**: React hook with 30-second polling, optimistic mark-as-read, unread count badge in navbar, dropdown with relative timestamps
- **Seeded**: 6 demo notifications for the demo client user

### Beauty Tips System
- **15 articles** across 6 categories (Hair, Barber, Skin, Nails, Lashes, Braids) with full body content
- **Listing page** (`/blog/beauty`): Search, category filters, bookmark filter, responsive grid
- **Article pages** (`/blog/beauty/:slug`): Formatted content, pro-tip callouts, related tips, share/save buttons
- **Home section**: Category filter tabs, horizontal scroll, bookmarking via localStorage
- **Bookmarking**: Save/unsave tips, saved-count banner, bookmarked-only filter

### Info / Support / Legal Pages (12)
| Route | Page |
|---|---|
| `/about` | About GlowUp |
| `/blog` | Company blog (Product/Engineering/Design posts) |
| `/careers` | Careers |
| `/press-kit` | Press Kit |
| `/help` | Help Center with categorized articles |
| `/faq` | FAQ accordion |
| `/contact` | Contact form |
| `/report` | Report a problem |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/cookies` | Cookie Policy |
| `/refunds` | Refund Policy |

### Database (Seeded)
- **5 stylists**: Ama Stylez (Braids), Nails by Efua, Kwame's Barber Shop, Glow by Adwoa (Skin), Lashes by Maame
- **15 services**: 3 per stylist with prices ($20-$110) and durations
- **2 demo users**: `client@example.com` / `stylist@example.com` (password: `password123`)
- **3 sample bookings** on the good seed stylists
- **6 demo notifications** for the client user
- **Seed script** is idempotent (skips existing entries)

### Payments
- Paystack SDK integrated
- Payment initialization endpoint
- Webhook handler for payment confirmation
- Booking payment status tracking

### Reviews
- Booking-gated reviews (only after completed booking)
- Star rating with comment
- Average rating computed on each new review

### Gamification
- XP system (awarded on booking, review, share)
- Level thresholds with badges
- Glow Score (composite of XP + rating + booking frequency)
- Streak tracking (30-day window)
- Referral system with reward codes

## Tech Details

### Frontend Patterns
- **Auth**: `useAuth()` hook from `AuthContext` — exposes `user`, `isAuthenticated`, `isLoading`, `login`, `register`, `socialLogin`, `logout`
- **API**: Centralized axios instance with JWT interceptor + auto-refresh
- **Storage**: localStorage for `auth_user`, `access_token`; httpOnly cookie for refresh token
- **Hooks**: `useFavorites`, `useRecentlyViewed`, `useNotifications`, `useGamification`, `useReferral`, `useTheme`
- **Mock data**: Removed — all data flows through real API (except LiveRoom comments which are simulated)

### Backend Patterns
- **Response format**: `{ success: true, message, data }` via `sendSuccess()` utility
- **Error handling**: `ApiError` class with status codes, caught by `asyncHandler`
- **Auth middleware**: `protect` (verifies JWT) + `requireRole(...roles)` for role gating
- **Routing**: Express Router with controllers, mounted in `routes/index.ts`

## 🔜 Not Yet Built
- React Native mobile app
- AI Vibe Match engine (server-side matching logic)
- AI Beauty Agent (chat-based recommendation)
- Social feed algorithm (trending/content ranking)
- Admin dashboard
- Push notification service worker
- Advanced analytics/forecasting for stylists

## How to Run

```bash
# Start all services
docker compose up -d

# Seed database (only if first time or after clean)
docker exec startup_server npx ts-node src/seed/seed.ts

# Seed demo notifications
docker exec startup_server npx ts-node src/seed/notifications.ts

# Access
# Client: http://localhost:5173
# Server: http://localhost:5000
```

## Demo Credentials
- **Consumer**: `client@example.com` / `password123`
- **Stylist**: `stylist@example.com` / `password123`
