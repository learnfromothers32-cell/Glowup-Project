import { Router } from 'express';
import { createReview, getStylistReviews, deleteReview } from '../controllers/review.controller';
import { protect } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';
import { validate, createReviewSchema } from '../middleware/validate';

const router = Router();

router.get('/stylist/:stylistId', getStylistReviews);

router.use(protect);
router.post('/', generalLimiter, validate(createReviewSchema), createReview);
router.delete('/:id', deleteReview);

export default router;
