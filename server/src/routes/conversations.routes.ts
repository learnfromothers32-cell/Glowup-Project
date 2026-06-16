import { Router } from 'express';
import {
  getMyConversations,
  getConversationMessages,
  sendMessage,
  createConversation,
  archiveConversation,
  getUnreadCounts
} from '../controllers/conversations.controller';
import { protect } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';
import { validate, createConversationSchema, sendMessageSchema } from '../middleware/validate';

const router = Router();
router.use(protect);

router.get('/', getMyConversations);
router.get('/unread-count', getUnreadCounts);
router.post('/', generalLimiter, validate(createConversationSchema), createConversation);
router.get('/:id/messages', getConversationMessages);
router.post('/:id/messages', generalLimiter, validate(sendMessageSchema), sendMessage);
router.patch('/:id/archive', archiveConversation);

export default router;
