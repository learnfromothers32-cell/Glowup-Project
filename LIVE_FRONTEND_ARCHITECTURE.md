# LIVE_FRONTEND_ARCHITECTURE.md

> **GlowUp Live — Frontend Architecture**  
> Phase 3H — Safety, Engagement & Validation  
> Date: July 15, 2026

---

## 1. Overview

The live streaming frontend is implemented as a **distributed feature module** integrated across existing codebase conventions. It does NOT live under a single `live/` directory but instead follows the established patterns: domain types in `domain/`, feature components in `features/`, pages in `pages/`, services in `services/`, and API in `api/`.

### Design Principles

1. **Convention-First** — Files follow existing directory patterns (`domain/`, `features/`, `pages/`)
2. **Reuse** — Existing UI primitives (`Button`, `Card`, `Avatar`, `Badge`, `Skeleton`, `Toast`), `cn()` utility, `framer-motion` animations, `lucide-react` icons
3. **Performance** — Zustand with selectors for high-frequency updates, TanStack Query for server data, lazy loading for route-level code splitting
4. **Isolation** — No existing files modified except `AppRouter.tsx` (routes added)

---

## 2. Directory Structure (Implemented)

```
client/src/
├── api/
│   └── live.ts                           # REST API: sessions, CRUD, start/end
│
├── services/
│   └── liveSocket.ts                     # /live namespace socket singleton (incl. commerce events)
│
├── domain/live/
│   ├── live.types.ts                     # TypeScript interfaces
│   ├── live.hooks.ts                     # TanStack Query hooks
│   └── stores/
│       ├── mediaStore.ts                 # Camera/mic state
│       ├── connectionStore.ts            # Socket connection state
│       ├── chatStore.ts                  # Chat messages + pending + history
│       ├── viewerStore.ts                # Viewer count + presence
│       ├── hostStore.ts                  # Host controls state
│       └── commerceStore.ts             # Pinned service, availability, shelf, services list
│
├── features/live/
│   ├── components/
│   │   ├── LiveBadge.tsx                 # LIVE badge + ViewerCount + StreamInfo
│   │   ├── DiscoverCard.tsx              # Discovery feed card
│   │   ├── LivePlayer.tsx                # LiveKit video player
│   │   ├── ChatPanel.tsx                 # Chat panel + ChatBubble
│   │   ├── HostControls.tsx              # Host + viewer control bars
│   │   ├── ConnectionBanner.tsx          # Connection status banner
│   │   ├── LiveSkeleton.tsx              # Loading skeletons
│   │   ├── ServiceCard.tsx               # ServiceCard + ServiceShowcase
│   │   ├── StylistInfoPanel.tsx          # Stylist profile + availability
│   │   ├── BookingOverlay.tsx            # Multi-phase booking flow
│   │   ├── QueueWidget.tsx               # Queue status + join
│   │   ├── LiveAvailability.tsx          # Availability indicator + ProductShelf
│   │   └── HostCommerceControls.tsx      # Host commerce pin/shelf/availability
│   └── hooks/
│       ├── useLiveMedia.ts               # LiveKit room connection
│       ├── useLiveSocket.ts              # Socket lifecycle + heartbeat
│       └── useLiveChat.ts                # Chat send/receive/history
│
└── pages/
    ├── consumer/
    │   ├── LiveDiscoverPage.tsx           # Discovery browse page
    │   └── LiveRoomPage.tsx              # Live room (video + chat)
    └── stylist/
        └── GoLivePage.tsx                # Host go-live page
```

---

## 3. Routes

Added to `AppRouter.tsx`:

| Path | Component | Layout | Auth |
|------|-----------|--------|------|
| `/app/live` | `LiveDiscoverPage` | `ConsumerLayout` | client |
| `/app/live/:id` | `LiveRoomPage` | None (fullscreen) | client |
| `/stylist/go-live` | `GoLivePage` | `StylistLayout` | stylist |

All three pages are lazy-loaded via `React.lazy()`.

---

## 4. State Management

### 4.1 Zustand Stores (5 separate stores)

**mediaStore** — Camera/mic toggle state:
```ts
useMediaStore((s) => s.cameraEnabled)
useMediaStore((s) => s.micEnabled)
```

**connectionStore** — Socket connection lifecycle:
```ts
useConnectionStore((s) => s.status) // disconnected|connecting|connected|reconnecting|failed
useConnectionStore((s) => s.sessionId)
```

**chatStore** — Chat messages + pagination + pending:
```ts
useChatStore((s) => s.messages)
useChatStore((s) => s.pendingMessageIds)
useChatStore((s) => s.hasMoreHistory)
```

**viewerStore** — Viewer count + presence:
```ts
useViewerStore((s) => s.viewerCount)
useViewerStore((s) => s.presence)
```

**hostStore** — Host controls state:
```ts
useHostStore((s) => s.isHost)
useHostStore((s) => s.status)
```

### 4.2 TanStack Query (Server State)

Key constants: `"live-sessions"`, `["live-sessions", id]`, `["live-sessions", "featured"]`

| Hook | Query | staleTime |
|------|-------|-----------|
| `useLiveSessions(params)` | GET /api/live | 15s |
| `useFeaturedSessions(limit)` | GET /api/live/featured | 30s |
| `useLiveSession(id)` | GET /api/live/:id | 10s |
| `useSessionStatus(id)` | GET /api/live/:id/status | 5s (polling 10s) |
| `useCreateLiveSession()` | POST /api/live | mutation |
| `useStartLiveSession()` | POST /api/live/:id/start | mutation |
| `useEndLiveSession()` | POST /api/live/:id/end | mutation |

---

## 5. Socket.IO /live Namespace

Client singleton in `services/liveSocket.ts` (follows `services/socket.ts` pattern).

### Client → Server Events
| Event | Payload |
|-------|---------|
| `live:join` | `{ sessionId, role, displayName? }` |
| `live:leave` | `{ sessionId }` |
| `live:heartbeat` | `{ sessionId }` |
| `live:chat:send` | `{ sessionId, content, messageId, replyTo? }` |
| `live:chat:history` | `{ sessionId, cursor?, limit? }` |
| `live:chat:delete` | `{ messageId, sessionId, reason? }` |
| `live:chat:pin` | `{ messageId, sessionId }` |

### Server → Client Events
| Event | Handler |
|-------|---------|
| `live:joined` | Sets sessionId, presence, viewerCount |
| `live:presence` | Adds/removes presence entry |
| `live:viewer-count` | Updates viewer count |
| `live:status` | Updates session status |
| `live:pong` | Heartbeat response |
| `live:host-online` | Host came online |
| `live:host-offline` | Host went offline |
| `live:chat:message` | New chat message |
| `live:chat:ack` | Message confirmation |
| `live:chat:history` | History page |
| `live:chat:deleted` | Message deleted |
| `live:chat:pinned` | Message pinned |
| `live:chat:error` | Chat error |
| `live:error` | General error |

---

## 6. LiveKit Integration

Installed: `livekit-client` (client-side SDK)

### useLiveMedia Hook
- Connects to LiveKit room with URL + JWT token
- Publishes camera + microphone tracks
- Handles adaptive stream + dynacast
- Returns `room`, `connect()`, `disconnect()`, `toggleCamera()`, `toggleMic()`

### LivePlayer Component
- Renders remote participant video/audio tracks
- For hosts: renders local preview via `LocalPreview`
- Handles track subscribe/unsubscribe lifecycle

---

## 7. Component Hierarchy

### LiveDiscoverPage
```
LiveDiscoverPage
├── SearchBar (input)
├── Category pills (scrollable)
├── Sort toggle (trending/newest/popular)
├── Featured section (if no search)
│   └── DiscoverCard[]
├── All Sessions section
│   ├── DiscoverSkeleton (loading)
│   ├── DiscoverCard[] (results)
│   └── EmptyState (no results)
```

### LiveRoomPage
```
LiveRoomPage
├── Header bar (back, StreamInfo, LiveBadge, ViewerCount, share)
├── ConnectionBanner (when not connected)
├── Main content (flex-1)
│   ├── LivePlayer (video, flex-1)
│   └── Desktop sidebar (w-320, lg+):
│       ├── StylistInfoPanel (profile, availability, Book/Join Queue/Follow)
│       ├── ServiceShowcase (service cards, pinned state)
│       ├── QueueWidget (queue length, wait, join)
│       ├── ProductShelf (placeholder, when shelf visible)
│       ├── HostCommerceControls (host only: pin service, shelf toggle, availability)
│       └── ChatPanel (flex-1)
├── Mobile commerce drawer (sm:hidden)
│   ├── StylistInfoPanel + ServiceShowcase + QueueWidget + ProductShelf
│   └── HostCommerceControls (host only)
└── Controls bar
    ├── HostControls (mic, camera, end)
    └── ViewerControls (leave)
```

### GoLivePage
```
GoLivePage
├── Create Session form (title, description, category)
│   ├── "Go Live Now" button (create + start)
│   └── Error display
├── Active Session card (if live)
│   ├── LiveBadge + stats
│   ├── "Go to Stream" button
│   └── "End" button
└── Past Sessions list
```

---

## 8. File Dependencies

| New File | Imports From |
|----------|-------------|
| `api/live.ts` | `api/axios`, `domain/live/live.types` |
| `services/liveSocket.ts` | `socket.io-client`, `api/axios`, `services/socket`, `domain/live/live.types` |
| `domain/live/live.types.ts` | None |
| `domain/live/live.hooks.ts` | `@tanstack/react-query`, `api/live` |
| `domain/live/stores/*.ts` | `zustand`, `domain/live/live.types` |
| `domain/live/stores/commerceStore.ts` | `zustand` |
| `features/live/hooks/*.ts` | `livekit-client`, `services/liveSocket`, `domain/live/stores/*` |
| `features/live/components/*.tsx` | `@/utils/cn`, `@/components/ui/*`, `lucide-react`, `framer-motion`, `domain/live/stores/*` |
| `features/live/components/ServiceCard.tsx` | `@/utils/cn`, `domain/live/live.types` |
| `features/live/components/StylistInfoPanel.tsx` | `@/utils/cn`, `@/components/ui/Avatar`, `@/components/ui/Badge`, `lucide-react` |
| `features/live/components/BookingOverlay.tsx` | `@/api/bookings`, `@/api/stylists`, `domain/booking/booking.hooks`, `lucide-react` |
| `features/live/components/QueueWidget.tsx` | `@/api/queue`, `@/services/socket`, `@/components/ui/Button`, `lucide-react` |
| `features/live/components/LiveAvailability.tsx` | `lucide-react`, `@/utils/cn` |
| `features/live/components/HostCommerceControls.tsx` | `@/utils/cn`, `@/components/ui/Button`, `domain/live/stores/commerceStore`, `lucide-react` |
| `pages/consumer/Live*.tsx` | `domain/live/live.hooks`, `features/live/hooks/*`, `features/live/components/*`, `services/liveSocket`, `domain/live/stores/*`, `api/stylists`, `api/favorites` |
| `pages/stylist/GoLivePage.tsx` | `domain/live/live.hooks`, `features/live/components/*` |
| `router/AppRouter.tsx` | Pages (lazy imports) |

---

## 9. Performance

| Optimization | Implementation |
|-------------|----------------|
| Lazy loading | All 3 pages via `React.lazy()` in `AppRouter.tsx` |
| Chat message limit | Max 200 messages in store (FIFO) |
| Chat auto-scroll | Only auto-scrolls when near bottom (80px threshold) |
| History pagination | Load on scroll-to-top, cursor-based |
| Session polling | `useSessionStatus` refetches every 10s |
| Zustand selectors | Components subscribe to specific slices only |

---

## 10. Responsive Design

| Breakpoint | Discover | Room |
|------------|----------|------|
| Mobile (< 640px) | 2-column grid | Full-width video, chat in tab, commerce in bottom drawer |
| Tablet (640-1024px) | 3-column grid | Video + chat side-by-side, commerce in chat header |
| Desktop (> 1024px) | 4-column grid | Video + sidebar (w-320): commerce panel + chat |

---

## 11. What Was NOT Implemented (Phase 3E Scope)

Per requirements, these features are explicitly excluded:
- Gifts, reactions, polls
- Replay pages
- Analytics dashboard
- AI moderation
- Live shopping (product purchase, not beauty commerce)
- Virtualized chat (not needed at current scale)

Phase 3F implemented:
- Commerce integration (StylistInfoPanel, ServiceShowcase, BookingOverlay, QueueWidget, HostCommerceControls)
- Pinned service + availability + product shelf socket events
- Zustand `commerceStore` for commerce state

Phase 3G implemented:
- Connection resilience: exponential backoff reconnection (2s base, 30s max, 10 attempts), manual retry button
- Error recovery: BookingOverlay errors (API failure, slots unavailability, permission denied), QueueWidget errors, graceful fallback on all edge cases
- Accessibility: ARIA labels, roles (`role="dialog"`, `role="log"`, `role="toolbar"`, `role="alert"`), `aria-live` regions, `aria-pressed` toggles, screen-reader labels, keyboard navigation
- UX polish: Empty state for ChatPanel ("No messages yet"), error states with retry/dismiss, disabled button visual feedback, `role="status"` on loading states
- Security: Rate limiting on all commerce socket events (pin, unpin, availability, shelf toggle)
- Code quality: Removed 13 unused imports across 6 files, zero dead code

Phase 3H implemented:
- Chat moderation: mute/unmute, ban/unban, delete message, report message/user
- Live reactions: ❤️🔥👏😍✨ animated overlays with rate limiting and aggregated counts
- Guest request workflow: viewer request to join, host accept/reject, real-time status updates
- Host safety dashboard: pending reports, guest requests, muted/banned users, reaction counts
- Safety notifications: muted/banned/message-removed/report-confirmed alerts
- Viewer safety: request-to-join button with status feedback
- Profanity filter: server-side configurable word list, case-insensitive, replace or reject
- Analytics: in-memory counters for reactions, guest requests, service pins, reports
- Audit log: all moderation actions recorded with moderator ID, target, timestamp, reason
- New stores: `moderationStore`, `reactionStore`, `guestRequestStore`
- New components: `ReactionOverlay`, `ReactionBar`, `ModerationPanel`, `GuestRequestPanel`, `SafetyNotification`, `HostSafetyDashboard`

---

**See also:** `LIVE_ARCHITECTURE.md` for backend architecture, `LIVE_SOCKET_EVENTS.md` for event reference.
