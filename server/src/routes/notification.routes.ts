import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(protect);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', generalLimiter, markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
