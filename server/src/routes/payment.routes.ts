import { Router } from 'express';
import {
  initializePayment,
  verifyPayment,
  paystackWebhook,
  getPaymentStatus,
  getMyTransactions,
} from '../controllers/payment.controller';
import { protect, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/webhook', paystackWebhook);

router.use(protect);

router.post('/initialize', requireRole('client'), initializePayment);
router.get('/verify/:reference', verifyPayment);
router.get('/status/:bookingId', getPaymentStatus);
router.get('/transactions', getMyTransactions);

export default router;
