import { Router } from 'express';
import {
  cancelBooking,
  createBooking,
  getMyBookings,
  getStylistBookings,
  getBookingById,
  rescheduleBooking,
  updateBookingStatus,
  getAvailableSlots
} from '../controllers/booking.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';
import { validate, validateQuery, createBookingSchema, getAvailableSlotsSchema, updateBookingStatusSchema, rescheduleBookingSchema } from '../middleware/validate';

const router = Router();

router.use(protect);

router.post('/', generalLimiter, requireRole('client'), validate(createBookingSchema), createBooking);
router.get('/my', requireRole('client'), getMyBookings);
router.get('/stylist', requireRole('stylist'), getStylistBookings);
router.get('/stylists/:stylistId/available-slots', requireRole('client', 'stylist'), validateQuery(getAvailableSlotsSchema), getAvailableSlots);
router.get('/:id', getBookingById);
router.patch('/:id/status', requireRole('stylist', 'admin'), validate(updateBookingStatusSchema), updateBookingStatus);
router.patch('/:id/cancel', requireRole('client', 'stylist', 'admin'), generalLimiter, cancelBooking);
router.patch('/:id/reschedule', requireRole('client'), validate(rescheduleBookingSchema), rescheduleBooking);

export default router;
