import { Router } from 'express';
import { getMyClients, getClientDetail, updateClient } from '../controllers/clients.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(protect, requireRole('stylist'));

router.get('/', getMyClients);
router.get('/:id', getClientDetail);
router.put('/:id', generalLimiter, updateClient);

export default router;
