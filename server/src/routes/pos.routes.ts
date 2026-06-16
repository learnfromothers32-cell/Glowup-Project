import { Router } from 'express';
import { getMyPosTransactions, createPosTransaction, voidPosTransaction } from '../controllers/pos.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(protect, requireRole('stylist'));

router.get('/', getMyPosTransactions);
router.post('/', generalLimiter, createPosTransaction);
router.patch('/:id/void', generalLimiter, voidPosTransaction);

export default router;
