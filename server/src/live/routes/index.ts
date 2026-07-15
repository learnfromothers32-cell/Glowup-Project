import { Router, Request, Response } from 'express';
import { protect, requireRole } from '../../middleware/auth.middleware';
import { validate, validateQuery } from '../../middleware/validate';
import { generalLimiter, readLimiter } from '../../middleware/rateLimiter';
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  startSession,
  endSession,
  pauseSession,
  resumeSession,
  getSessionStatus,
  getFeaturedSessions,
  joinSession,
} from '../controllers';
import {
  createLiveSessionSchema,
  updateLiveSessionSchema,
  sessionIdParamSchema,
  discoverSessionsQuerySchema,
  featuredSessionsQuerySchema,
} from '../validators';
import { getMediaProvider } from '../providers/factory';

const router = Router();

// ── Health Check (Internal) ──

// GET /api/live/health - Provider health check (internal monitoring)
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const provider = getMediaProvider();
    const health = await provider.healthCheck();
    const status = health.healthy ? 200 : 503;
    res.status(status).json({
      success: health.healthy,
      data: health,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        healthy: false,
        provider: 'unknown',
        latencyMs: 0,
        details: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date(),
      },
    });
  }
});

// ── Public Routes ──

// GET /api/live/featured - Featured sessions (public)
router.get(
  '/featured',
  readLimiter,
  validateQuery(featuredSessionsQuerySchema),
  getFeaturedSessions
);

// GET /api/live - Discovery feed (public)
router.get(
  '/',
  readLimiter,
  validateQuery(discoverSessionsQuerySchema),
  getSessions
);

// GET /api/live/:id - Session details (public, soft auth)
router.get(
  '/:id',
  readLimiter,
  getSessionById
);

// GET /api/live/:id/status - Session status (public)
router.get(
  '/:id/status',
  readLimiter,
  getSessionStatus
);

// ── Protected Routes (Stylist Only) ──

// POST /api/live - Create session
router.post(
  '/',
  protect,
  requireRole('stylist'),
  generalLimiter,
  validate(createLiveSessionSchema),
  createSession
);

// PATCH /api/live/:id - Update session
router.patch(
  '/:id',
  protect,
  requireRole('stylist'),
  generalLimiter,
  validate(updateLiveSessionSchema),
  updateSession
);

// DELETE /api/live/:id - Delete session
router.delete(
  '/:id',
  protect,
  requireRole('stylist'),
  generalLimiter,
  deleteSession
);

// POST /api/live/:id/start - Start session
router.post(
  '/:id/start',
  protect,
  requireRole('stylist'),
  generalLimiter,
  startSession
);

// POST /api/live/:id/join - Join session as viewer (returns LiveKit token)
router.post(
  '/:id/join',
  protect,
  generalLimiter,
  joinSession
);

// POST /api/live/:id/end - End session
router.post(
  '/:id/end',
  protect,
  requireRole('stylist'),
  generalLimiter,
  endSession
);

// POST /api/live/:id/pause - Pause session
router.post(
  '/:id/pause',
  protect,
  requireRole('stylist'),
  generalLimiter,
  pauseSession
);

// POST /api/live/:id/resume - Resume session
router.post(
  '/:id/resume',
  protect,
  requireRole('stylist'),
  generalLimiter,
  resumeSession
);

export default router;
