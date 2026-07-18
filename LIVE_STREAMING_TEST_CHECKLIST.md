# Live Streaming Feature - Manual Test Checklist

## Environment Setup
- [ ] LiveKit Cloud account created (free tier)
- [ ] Environment variables configured:
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`  
  - `LIVEKIT_WS_URL`
- [ ] Webhook endpoint configured in LiveKit dashboard: `/api/live/webhook`

## Test Scenarios

### 1. Broadcaster (Stylist) Tests

#### Session Creation
- [ ] Navigate to `/stylist/live`
- [ ] Fill in stream title (100 char max)
- [ ] Select category from grid
- [ ] Click "Go Live"
- [ ] Verify camera/mic permissions requested
- [ ] Verify session created in database (status: `pending`)
- [ ] Verify redirect to live studio view

#### Going Live
- [ ] Click "Go Live" button
- [ ] Verify camera feed displays
- [ ] Verify "LIVE" badge appears
- [ ] Verify timer starts counting
- [ ] Verify viewer count shows (initially 0)
- [ ] Verify toast notification "You are now live!"

#### Live Controls
- [ ] Toggle camera off → video stops, button turns red
- [ ] Toggle camera on → video resumes
- [ ] Toggle mic off → audio stops, button turns red
- [ ] Toggle mic on → audio resumes
- [ ] Click end stream button → confirmation prompt

#### Ending Stream
- [ ] Click end stream button
- [ ] Verify session status changes to `ended`
- [ ] Verify toast shows "Stream ended" with duration
- [ ] Verify redirect to setup screen
- [ ] Verify "Live Now" rail updates (stream removed)

### 2. Viewer Tests

#### Discovering Streams
- [ ] Home page shows "Live Now" rail when streams active
- [ ] Rail shows stream thumbnail, title, stylist name, viewer count
- [ ] Click stream card → navigate to `/app/live/:sessionId`

#### Joining Stream
- [ ] Verify join overlay shows stream info
- [ ] Click "Join Stream"
- [ ] Verify camera feed loads
- [ ] Verify "LIVE" badge appears
- [ ] Verify viewer count increments

#### Interacting
- [ ] Send comment → appears in comment feed
- [ ] Click heart button → floating heart animation
- [ ] Comment feed auto-scrolls
- [ ] Comments limited to 50 (older removed)

#### Leaving Stream
- [ ] Click back arrow → disconnects and navigates back
- [ ] Verify viewer count decrements
- [ ] Verify "Live Now" rail updates

### 3. Real-time Updates

#### Socket.IO Events
- [ ] Start stream → "Live Now" rail updates for other users
- [ ] End stream → "Live Now" rail updates for other users
- [ ] Multiple viewers see each other's comments in real-time

#### Reconnection
- [ ] Simulate network loss (airplane mode)
- [ ] Verify "Reconnecting..." indicator appears
- [ ] Restore network → verify reconnection
- [ ] Verify comments/hearts resume

### 4. Edge Cases

#### Session Limits
- [ ] Stylist tries to create second active session → error
- [ ] Try to join ended session → error message
- [ ] Try to join non-existent session → 404 error

#### Viewer Limits
- [ ] Test with 10+ concurrent viewers (LiveKit free tier: 100)

#### Stale Sessions
- [ ] Broadcaster closes browser without ending stream
- [ ] Wait 4+ hours (or adjust timeout for testing)
- [ ] Verify session auto-ended by cleanup job

### 5. Mobile Responsiveness

- [ ] Live Studio works on mobile (camera preview, controls)
- [ ] Live Stream viewer works on mobile
- [ ] Comments/hearts display properly
- [ ] Touch interactions work (heart button, comment input)

## API Endpoint Tests

```bash
# Create session (stylist auth required)
curl -X POST /api/live \
  -H "Authorization: Bearer <stylist_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Stream", "category": "Braids"}'

# Start session
curl -X POST /api/live/:id/start \
  -H "Authorization: Bearer <stylist_token>"

# Get active sessions
curl -X GET /api/live/active

# Join session (viewer auth required)
curl -X POST /api/live/:id/join \
  -H "Authorization: Bearer <viewer_token>"

# End session
curl -X POST /api/live/:id/end \
  -H "Authorization: Bearer <stylist_token>"

# Cleanup stale sessions (admin only)
curl -X POST /api/live/cleanup \
  -H "Authorization: Bearer <admin_token>"
```

## Database Verification

```javascript
// Check session status
db.liveSessions.find({ status: 'live' })

// Check ended sessions
db.liveSessions.find({ status: 'ended' }).sort({ endedAt: -1 })

// Verify viewer counts
db.liveSessions.find({ _id: ObjectId("...") }).viewerCount
```

## Known Issues / TODO

- [ ] Webhook signature verification not implemented (LiveKit docs recommend HMAC)
- [ ] Token refresh for long-running streams (>24 hours)
- [ ] Rate limiting on comment/reaction sending
- [ ] Moderation: ability to ban users from stream
- [ ] Stream recording (requires LiveKit Cloud paid plan or self-hosted)

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Session creation | ⬜ | |
| Going live | ⬜ | |
| Camera/mic toggle | ⬜ | |
| Viewer join | ⬜ | |
| Comments | ⬜ | |
| Reactions | ⬜ | |
| Reconnection | ⬜ | |
| Stale cleanup | ⬜ | |
| Mobile | ⬜ | |
