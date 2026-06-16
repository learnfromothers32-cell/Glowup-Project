import { Router } from 'express';
import { getStylistTiers, getMyTiers, createTier, updateTier, deleteTier, getMySubscribers, subscribeToTier } from '../controllers/memberships.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();
router.get('/stylist/:stylistId/tiers', getStylistTiers);
router.post('/subscribe', protect, generalLimiter, subscribeToTier);

router.use(protect, requireRole('stylist'));
router.get('/tiers', getMyTiers);
router.post('/tiers', generalLimiter, createTier);
router.put('/tiers/:id', generalLimiter, updateTier);
router.delete('/tiers/:id', deleteTier);
router.get('/subscribers', getMySubscribers);

export default router;
