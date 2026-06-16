import { Router } from 'express';
import { getQueueStatus, advanceQueue, markDone } from '../controllers/queue.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/:stylistId', getQueueStatus);
router.post('/:stylistId/advance', protect, requireRole('stylist'), generalLimiter, advanceQueue);
router.post('/:stylistId/done/:entryUserId', protect, requireRole('stylist'), generalLimiter, markDone);

export default router;
