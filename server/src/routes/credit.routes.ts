import { Router } from 'express';
import { getCreditPackages, getMyCredits, purchaseCredits } from '../controllers/credit.controller';
import { protect } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/packages', getCreditPackages);
router.get('/my', protect, getMyCredits);
router.post('/purchase', protect, generalLimiter, purchaseCredits);

export default router;
