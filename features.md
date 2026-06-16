# GlowUp — Feature Checklist for Pre-Production QA

> Tick each box after verifying the feature works end-to-end.
> Mark `[ ]` = untested, `[x]` = passing, `[~]` = has issues (note below).

---

## 1. AUTHENTICATION & ACCOUNT

### 1.1 Registration
- [ ] `POST /api/auth/register` — email + password creates User + Client/Stylist profile
- [ ] Duplicate email returns 409
- [ ] Password strength enforced (min 8 chars, mixed case?)
- [ ] Welcome email sent (via `email.service`)
- [ ] `GET /api/auth/verify?token=...` — email verification link works

### 1.2 Login
- [ ] `POST /api/auth/login` — returns access + refresh tokens (HTTP-only cookies)
- [ ] Invalid credentials returns 401
- [ ] Unverified email cannot log in (if email verification enabled)
- [ ] Google OAuth `/api/auth/google/callback` — Firebase social login flow
- [ ] Session persists across page refresh (access token refresh on mount)

### 1.3 Token Management8
- [ ] `POST /api/auth/refresh` — refresh token rotates (new access + new refresh)
- [ ] Expired refresh returns 401
- [ ] `POST /api/auth/logout` — clears cookies, invalidates refresh token

### 1.4 Password Reset
- [ ] `POST /api/auth/forgot-password` — sends reset email
- [ ] `POST /api/auth/reset-password` — valid token resets password
- [ ] Expired/invalid token returns 400

### 1.5 Profile
- [ ] `GET /api/auth/profile` — returns current user data
- [ ] `PUT /api/auth/profile` — update name, phone, avatar
- [ ] Avatar upload works (Cloudinary when configured)

---

## 2. STYLIST PROFILES (CONSUMER VIEW)

### 2.1 Browse & Search
- [ ] `GET /api/stylists` — paginated list (default sort?)
- [ ] `GET /api/stylists/search?q=...` — search by name, category, location
- [ ] `GET /api/stylists/featured` — featured/top stylists
- [ ] `GET /api/stylists/nearby?lat=...&lng=...&radius=...` — geolocation-based
- [ ] `GET /api/stylists/top-rated` — sorted by rating/review count
- [ ] `GET /api/areas` + `GET /api/areas/search?q=...` — area autocomplete

### 2.2 Stylist Detail Page (`/app/stylist/:id`)
- [ ] Hero section — name, image, rating, location, verified badge
- [ ] Bio/category display
- [ ] Portfolio tab — masonry + grid toggle, lightbox for images
- [ ] Portfolio videos play inline with sound
- [ ] Services tab — list with prices, durations, "Popular" badge
- [ ] Reviews tab — rating stats, review cards with pagination
- [ ] Transformations tab — before/after comparison slider, video support
- [ ] Products tab — product grid, stock indicator
- [ ] Packages tab — bundle cards with buy button
- [ ] Memberships tab — subscription tier cards with subscribe button
- [ ] Connect card — Instagram, Twitter/X, TikTok, website links
- [ ] Booking card — min price, message, call, join waitlist buttons

### 2.3 Social Features
- [ ] Share button copies profile URL
- [ ] Favorite/unfavorite stylist (`POST /api/favorites`)
- [ ] Favorites list at `/app/favorites`

---

## 3. BOOKING SYSTEM

### 3.1 Create Booking (`/app/stylist/:id/book`)
- [ ] Service selection with price
- [ ] Date picker shows available slots (from `availability` service)
- [ ] Time slot picker respects stylist's working hours
- [ ] `POST /api/bookings` — creates booking, updates availability
- [ ] Booking confirmation modal with details
- [ ] Email/SMS notification sent to client and stylist

### 3.2 Manage Bookings (`/app/bookings`)
- [ ] List bookings with status (pending/confirmed/completed/cancelled)
- [ ] Booking detail page with full info
- [ ] Cancel booking (within allowed window)
- [ ] Reschedule booking

### 3.3 Stylist Booking Management (`/app/stylist/bookings`)
- [ ] Calendar view of all bookings
- [ ] Accept/decline pending bookings
- [ ] Mark as completed
- [ ] Cancel booking with reason
zx  
---

## 4. REVIEW SYSTEM

### 4.1 Create Review
- [ ] `POST /api/reviews` — only after completed booking
- [ ] Star rating (1-5)
- [ ] Text review + optional images
- [ ] Tags (e.g., "clean", "friendly", "skilled")
- [ ] `GET /api/reviews/stats/:stylistId` — rating distribution

### 4.2 Browse Reviews
- [ ] Reviews tab on stylist profile
- [ ] Pagination or infinite scroll
- [ ] "Helpful" count / mark as helpful
- [ ] User can edit/delete own review within time limit

---

## 5. PORTFOLIO & TRANSFORMATIONS (STYLIST)

### 5.1 Portfolio Management (`/app/stylist/gallery` OR `Portfolio.tsx`)
- [ ] Upload images — drag & drop or file picker
- [ ] Upload videos — separate video input
- [ ] Pending preview bar with type toggle (image/video) per item
- [ ] Batch "Save to Portfolio" button
- [ ] Gallery display — masonry view + grid view toggle
- [ ] Delete items from gallery
- [ ] Lightbox for images

### 5.2 Transformations (Before/After)
- [ ] Upload single images/videos (no before/after pairing)
- [ ] Preview bar + batch save (same flow as portfolio)
- [ ] Gallery display as single media grid
- [ ] Items appear in trending feed
- [ ] Trending stats (likes, views, comments) shown on each item
- [ ] Delete transformation

---

## 6. TRENDING FEED (`/app/trending`)

- [ ] Vertical swipe feed (full-screen cards)
- [ ] Video plays with sound (user must interact first for autoplay)
- [ ] Image displays with before/after style
- [ ] Like/unlike (heart tap)
- [ ] View count tracking
- [ ] Bookmark transformation
- [ ] Comment sheet opens on comment tap
- [ ] Share button
- [ ] Trending/Active status badge
- [ ] Cursor-based pagination (load more on scroll)
- [ ] `GET /api/trending/transformations` — paginated
- [ ] `POST /api/engagement/like` etc. — engagement tracking

---

## 7. AI HAIRSTYLE STUDIO

### 7.1 Virtual Try-On (`/app/virtual-tryon` or `/app/ai-hairstyle`)
- [ ] Upload a selfie (front-facing)
- [ ] Select a hairstyle from 117 options
- [ ] AI generation via DiffusionHairstyleProvider (HuggingFace)
- [ ] Fallback: TemplateOverlayProvider when HF is unavailable
- [ ] Result shown in BeforeAfterSlider comparison
- [ ] "Try another style" re-generates
- [ ] Save result to user gallery
- [ ] Share result

### 7.2 Face Shape Detection
- [ ] `POST /api/face-analysis/detect` — returns face shape (oval/round/square/heart/diamond/oblong)
- [ ] Hairstyle recommendations filtered by compatible face shapes
- [ ] MediaPipe client-side detection also available

---

## 8. CONVERSATIONS / MESSAGING

### 8.1 List & Create
- [ ] `GET /api/conversations` — list user's conversations
- [ ] `POST /api/conversations` — start new conversation with stylist
- [ ] `GET /api/conversations/:id` — get conversation with messages

### 8.2 Messages
- [ ] `POST /api/conversations/:id/messages` — send text message
- [ ] Real-time via Socket.IO `/conversations` namespace
- [ ] Mark as read (`PUT /api/conversations/:id/read`)
- [ ] Typing indicator
- [ ] `DELETE /api/conversations/:id` — delete conversation

---

## 9. NOTIFICATIONS

- [ ] `GET /api/notifications` — paginated list
- [ ] `GET /api/notifications/unread-count` — badge count
- [ ] `PUT /api/notifications/:id/read` — mark single as read
- [ ] `PUT /api/notifications/read-all` — mark all as read
- [ ] `DELETE /api/notifications/:id` — delete notification
- [ ] Types: booking_confirmed, appointment_reminder, badge_earned, promo, etc.

---

## 10. QUEUE MANAGEMENT (STYLIST)

- [ ] `GET /api/queue/:stylistId` — current queue status
- [ ] `POST /api/queue/:stylistId/join` — client joins queue
- [ ] `POST /api/queue/:stylistId/leave` — client leaves queue
- [ ] `GET /api/queue/:stylistId/position` — client's position
- [ ] Real-time updates via Socket.IO `/queue` namespace
- [ ] `GET /api/queue/:stylistId/history` — past queue data
- [ ] `GET /api/queue/:stylistId/today-count` — today's total
- [ ] Subscribe/unsubscribe for notifications

---

## 11. LIVE STREAMING

### 11.1 Sessions
- [ ] `POST /api/live/start` — stylist starts a session
- [ ] `POST /api/live/stop` — stylist stops a session
- [ ] `GET /api/live` — list active sessions
- [ ] `GET /api/live/:sessionId` — session details
- [ ] Live indicator on stylist profile

### 11.2 Watch & Interact (`/app/live/:sessionId`)
- [ ] Video stream (WebRTC via Socket.IO signaling)
- [ ] Live chat (`/live` socket namespace)
- [ ] Send gifts (stickers/animations)
- [ ] Reactions (hearts, etc.)
- [ ] Viewer count
- [ ] Report session (inappropriate content)

### 11.3 Schedule
- [ ] `GET /api/live/schedule` — upcoming scheduled streams
- [ ] `LiveScheduleList` component

---

## 12. CREDITS & PAYMENTS

### 12.1 Credits
- [ ] `GET /api/credits/balance` — current balance
- [ ] `POST /api/credits/top-up` — buy credits (Paystack integration)
- [ ] `GET /api/credits/history` — transaction log
- [ ] Credit packages available for purchase

### 12.2 Payments (Paystack)
- [ ] `POST /api/payments/initiate` — start payment flow
- [ ] `GET /api/payments/verify?reference=...` — verify after redirect
- [ ] `POST /api/payments/webhook` — Paystack webhook handler
- [ ] `GET /api/payments/methods` — supported payment methods
- [ ] `GET /api/payments/history` — past payments

---

## 13. PRODUCTS (STYLIST SHOP)

### 13.1 Stylist Product Management (`/app/stylist/products`)
- [ ] CRUD products (name, description, price, category, stock, image)
- [ ] Product grid view on stylist profile (consumer)

### 13.2 Consumer Purchase
- [ ] Browse products on stylist profile
- [ ] Buy via credits or Paystack
- [ ] Stock management (decrement on purchase)

---

## 14. PACKAGES (SERVICE BUNDLES)

### 14.1 Stylist Management (`/app/stylist/marketing`)
- [ ] CRUD packages (multiple services, total price, expiry days)
- [ ] Package cards on stylist profile (consumer)

### 14.2 Consumer Purchase
- [ ] Browse packages
- [ ] Purchase package (via Paystack)
- [ ] Track remaining sessions

---

## 15. MEMBERSHIPS (SUBSCRIPTION TIERS)

- [ ] `POST /api/memberships/subscribe` — subscribe to a plan
- [ ] `POST /api/memberships/cancel` — cancel auto-renew
- [ ] `GET /api/memberships/status` — current plan details
- [ ] `GET /api/memberships/history` — past subscriptions
- [ ] Tier benefits (discount on services, exclusive access, etc.)

---

## 16. STYLIST SETTINGS

- [ ] `GET /api/settings` — get all settings
- [ ] `PUT /api/settings` — update general settings
- [ ] `PUT /api/settings/bank-info` — bank account for payouts
- [ ] `PUT /api/settings/notifications` — notification preferences
- [ ] `PUT /api/settings/privacy` — privacy settings
- [ ] `PUT /api/settings/theme` — theme preference

---

## 17. AVAILABILITY (STYLIST)

- [ ] `POST /api/availability` — set weekly schedule
- [ ] `GET /api/availability/:stylistId` — get stylist's availability
- [ ] `GET /api/availability/:stylistId/date?date=...` — slots for specific date
- [ ] `PUT /api/availability/:id` — update a slot
- [ ] `DELETE /api/availability/:id` — remove a slot
- [ ] Recurring vs date-specific templates

---

## 18. STYLIST DASHBOARD (`/app/stylist/dashboard`)

- [ ] Stats cards: total bookings, revenue, rating, client count
- [ ] Recent bookings list
- [ ] Upcoming schedule
- [ ] Trending/performance metrics

---

## 19. STYLIST ANALYTICS (`/app/stylist/analytics`)

- [ ] Revenue over time chart
- [ ] Booking trends
- [ ] Popular services ranking
- [ ] Client demographics
- [ ] Conversion rates

---

## 20. STYLIST POS (`/app/stylist/pos`)

- [ ] Create walk-in transaction with items
- [ ] Multiple payment methods (cash, mobile money, card)
- [ ] Transaction history
- [ ] Refund processing
- [ ] Daily summary report

---

## 21. MARKETING (STYLIST PROMOS)

- [ ] `POST /api/marketing/promos` — create promo code
- [ ] `GET /api/marketing/promos` — list active promos
- [ ] `POST /api/marketing/validate` — validate a promo code at checkout
- [ ] Promo types: percentage off, fixed amount off
- [ ] Usage limits, expiry dates, minimum amount

---

## 22. CONSULTATIONS

- [ ] `POST /api/consultations` — client requests consultation
- [ ] `GET /api/consultations` — list consultations (user/stylist scoped)
- [ ] `PUT /api/consultations/:id/status` — stylist accepts/declines
- [ ] Schedule consultation (date/time)
- [ ] Cancel consultation

---

## 23. WAITLIST

- [ ] `POST /api/waitlist/join` — join stylist's waitlist
- [ ] `GET /api/waitlist/status` — check waitlist status
- [ ] `GET /api/waitlist/position` — position in queue
- [ ] `POST /api/waitlist/cancel` — leave waitlist

---

## 24. VIBE MATCH

- [ ] `VibeMatcher` component — questionnaire UI
- [ ] `useVibeMatch` hook — matches client preferences to stylists
- [ ] Results show compatible stylists with match score

---

## 25. EXPLORE PAGE (`/app/explore`)

- [ ] Stylist grid with filters (category, location, rating, price)
- [ ] Hairstyle gallery with face-shape filter
- [ ] Trending transformations preview
- [ ] Beauty tips carousel
- [ ] Search bar

---

## 26. HAIRSTYLES BROWSER (`/app/hairstyles`)

- [ ] Grid of 117 hairstyles with images
- [ ] Filter by category (men's, women's, unisex)
- [ ] Filter by gender
- [ ] Filter by face shape
- [ ] Detail page per hairstyle (`/app/hairstyle/:slug`)
- [ ] Optimization tips per style

---

## 27. BEAUTY TIPS (`/app/tips`)

- [ ] List of beauty/haircare articles
- [ ] Tip detail page (`/app/tips/:slug`)
- [ ] Categorized tips

---

## 28. CREDITS / TOP-UP PAGE (`/app/credits`)

- [ ] Balance display
- [ ] Credit package options (Starter, Popular, Pro, Premium)
- [ ] Purchase flow via Paystack
- [ ] Transaction history

---

## 29. MEMBERSHIP PAGE (`/app/membership`)

- [ ] Current plan display
- [ ] Available tier cards
- [ ] Subscribe/cancel flow
- [ ] Benefits breakdown

---

## 30. PACKAGES PAGE (`/app/packages`)

- [ ] Available package bundles
- [ ] Purchase flow
- [ ] Remaining sessions tracking

---

## 31. SETTINGS PAGE (CONSUMER) (`/app/settings`)

- [ ] Update profile info
- [ ] Change password
- [ ] Notification preferences
- [ ] Privacy settings
- [ ] Theme toggle
- [ ] Language selection (10 locales)

---

## 32. CLIENT MANAGEMENT (STYLIST) (`/app/stylist/clients`)

- [ ] List of clients with visit history
- [ ] Total spent, last visit date
- [ ] Add notes per client
- [ ] Favorite clients

---

## 33. STYLIST REVIEWS MANAGEMENT (`/app/stylist/reviews`)

- [ ] List all reviews received
- [ ] Reply to reviews
- [ ] Report inappropriate reviews

---

## 34. STYLIST SERVICES MANAGEMENT (`/app/stylist/services`)

- [ ] CRUD services
- [ ] Categories, prices, durations
- [ ] Mark as active/inactive
- [ ] Set "popular" flag

---

## 35. STYLIST CONSULTATIONS MANAGEMENT (`/app/stylist/consultations`)

- [ ] List incoming consultation requests
- [ ] Accept/decline with message
- [ ] Schedule consultation

---

## 36. STYLIST MARKETING (`/app/stylist/marketing`)

- [ ] Create promo codes
- [ ] Promo performance stats (redemptions, revenue)
- [ ] Create packages
- [ ] Package performance

---

## 37. INTERNATIONALIZATION (i18n)

- [ ] English (en)
- [ ] Traditional Chinese (zh-TW)
- [ ] Simplified Chinese (zh-CN)
- [ ] Japanese (ja)
- [ ] Korean (ko)
- [ ] French (fr)
- [ ] German (de)
- [ ] Spanish (es)
- [ ] Portuguese (pt)
- [ ] Arabic (ar)
- [ ] Language switcher works and persists
- [ ] No missing translation keys

---

## 38. RESPONSIVE & UI

- [ ] All pages work on mobile (320px+)
- [ ] All pages work on tablet (768px)
- [ ] All pages work on desktop (1280px+)
- [ ] All pages work on ultra-wide (1920px+)
- [ ] Touch interactions work (swipe, tap, pinch)
- [ ] Loading states (skeletons) shown during data fetch
- [ ] Empty states shown when no data
- [ ] Error states with retry option
- [ ] Toast/snackbar for success/error feedback
- [ ] Modals close on backdrop click and Escape key
- [ ] Lightbox navigation (arrow keys + click)

---

## 39. PERFORMANCE

- [ ] Page load < 3s on 3G (production build)
- [ ] Images lazy-loaded
- [ ] Route-based code splitting (lazy-loaded pages)
- [ ] API response caching (React Query)
- [ ] Socket.IO reconnection on network loss
- [ ] No memory leaks on page navigation

---

## 40. SECURITY

- [ ] JWT access tokens expire after 15 minutes
- [ ] Refresh tokens expire after 7 days
- [ ] Rate limiting on auth endpoints
- [ ] Input validation via Zod on all API endpoints
- [ ] No sensitive data in client bundle (.env only)
- [ ] CSRF protection (double-submit cookie or SameSite)
- [ ] MongoDB injection prevention (mongoose sanitization)
- [ ] File upload validation (type, size limits)
- [ ] Cloudinary URL cleaning on delete
- [ ] Role-based access control (client vs stylist vs admin)

---

## 41. SEED DATA VERIFICATION

- [ ] 5 demo stylists exist with services, products, packages, promos
- [ ] 117 hairstyles populated with images and prompts
- [ ] 4 credit packages available
- [ ] 6 notification templates seeded
- [ ] Areas (Accra, Kumasi, etc.) populated
- [ ] Demo accounts: `client@example.com` / `stylist@example.com` work

---

## Known Issues / Notes

- _Add any failing tests here_
- _Add edge cases or flaky features here_

---

> **Last updated:** 2026-06-12
> Run `npm run dev` on both server and client, then tick through every section above.
