import { Router } from 'express';
import { getMyAvailability, updateAvailability } from '../controllers/availability.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(protect, requireRole('stylist'));

router.get('/', getMyAvailability);
router.put('/', generalLimiter, updateAvailability);

export default router;
