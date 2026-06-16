import { Router } from 'express';
import {
  startLive, stopLive, getLiveSession, getLiveMessages,
  getTrendingStreams, getLiveCategories, getLiveFeed,
  reportStream, reportComment,
  scheduleLive, getUpcomingSessions, getPastSessions,
} from '../controllers/live.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';
import { validate, reportStreamSchema, reportCommentSchema } from '../middleware/validate';

const router = Router();

// Public endpoints
router.get('/session/:stylistId', getLiveSession);
router.get('/messages/:sessionId', getLiveMessages);
router.get('/trending', getTrendingStreams);
router.get('/categories', getLiveCategories);
router.get('/feed', getLiveFeed);
router.get('/upcoming', getUpcomingSessions);
router.get('/past', getPastSessions);

// Protected endpoints (stylist only)
router.post('/start', protect, requireRole('stylist'), generalLimiter, startLive);
router.post('/stop', protect, requireRole('stylist'), generalLimiter, stopLive);
router.post('/schedule', protect, requireRole('stylist'), generalLimiter, scheduleLive);

// Protected endpoints (any authenticated user)
router.post('/report', protect, generalLimiter, validate(reportStreamSchema), reportStream);
router.post('/report/comment', protect, generalLimiter, validate(reportCommentSchema), reportComment);

export default router;
