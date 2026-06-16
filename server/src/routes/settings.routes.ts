import { Router } from 'express';
import { getMySettings, updateSettings } from '../controllers/settings.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(protect, requireRole('stylist'));

router.get('/', getMySettings);
router.put('/', generalLimiter, updateSettings);

export default router;
