import { Router } from 'express';
import { getMyWaitlist, createWaitlistEntry, notifyWaitlistEntry, removeWaitlistEntry } from '../controllers/waitlist.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

// Client-facing: join waitlist (any authenticated user)
router.post('/', protect, generalLimiter, createWaitlistEntry);

// Stylist-only routes
router.use(protect, requireRole('stylist'));
router.get('/', getMyWaitlist);
router.post('/:id/notify', generalLimiter, notifyWaitlistEntry);
router.delete('/:id', removeWaitlistEntry);

export default router;
