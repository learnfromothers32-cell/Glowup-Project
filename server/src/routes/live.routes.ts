import { Router } from 'express';
import {
  createLiveSession,
  startLiveSession,
  endLiveSession,
  getActiveLiveSessions,
  getLiveSession,
  joinLiveSession,
  liveSessionWebhook,
  cleanupStaleSessions,
  likeLiveSession,
} from '../controllers/live.controller';
import { protect, softAuth, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/webhook', liveSessionWebhook);

router.get('/active', softAuth, getActiveLiveSessions);

router.post('/cleanup', protect, requireRole('admin'), cleanupStaleSessions);

router.post('/', protect, requireRole('stylist'), generalLimiter, createLiveSession);

router.get('/:id', softAuth, getLiveSession);

router.post('/:id/start', protect, requireRole('stylist'), startLiveSession);

router.post('/:id/end', protect, requireRole('stylist'), endLiveSession);

router.post('/:id/join', protect, joinLiveSession);

router.post('/:id/like', protect, likeLiveSession);

export default router;
