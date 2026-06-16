import { Router } from 'express';
import {
  getMyPromoCodes, createPromoCode, updatePromoCode, deletePromoCode,
  getMyGiftCards, createGiftCard
} from '../controllers/marketing.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(protect, requireRole('stylist'));

router.get('/promos', getMyPromoCodes);
router.post('/promos', generalLimiter, createPromoCode);
router.put('/promos/:id', generalLimiter, updatePromoCode);
router.delete('/promos/:id', deletePromoCode);

router.get('/gift-cards', getMyGiftCards);
router.post('/gift-cards', generalLimiter, createGiftCard);

export default router;
