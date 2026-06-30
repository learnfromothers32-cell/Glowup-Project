import { Router } from 'express';
import {
  getStylistById,
  getStylistServices,
  getStylists,
  getMyStylistProfile,
  getMyTrendingStats,
  saveOnboarding,
  updateMyProfile,
  addMyService,
  updateMyService,
  deleteMyService,
  uploadPortfolioImage,
  uploadProfileImage,
  removePortfolioImage,
  addBeforeAfter,
  removeBeforeAfter,
  uploadStylistVideo,
  savePortfolioMedia
} from '../controllers/stylist.controller';
import { softAuth, protect, requireRole } from '../middleware/auth.middleware';
import { upload } from '../utils/upload';
import { generalLimiter, readLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', softAuth, readLimiter, getStylists);
router.get('/me', protect, requireRole('stylist'), getMyStylistProfile);
router.put('/me', protect, requireRole('stylist'), generalLimiter, updateMyProfile);
router.get('/me/trending', protect, requireRole('stylist'), getMyTrendingStats);
router.post('/onboarding', protect, requireRole('stylist'), generalLimiter, saveOnboarding);
router.post('/services', protect, requireRole('stylist'), generalLimiter, addMyService);
router.put('/services/:id', protect, requireRole('stylist'), generalLimiter, updateMyService);
router.delete('/services/:id', protect, requireRole('stylist'), deleteMyService);
router.post('/portfolio', protect, requireRole('stylist'), generalLimiter, upload.single('image'), uploadPortfolioImage);
router.delete('/portfolio', protect, requireRole('stylist'), removePortfolioImage);
router.post('/me/image', protect, requireRole('stylist'), generalLimiter, upload.single('image'), uploadProfileImage);
router.post('/before-after', protect, requireRole('stylist'), generalLimiter, upload.single('image'), addBeforeAfter);
router.delete('/before-after/:id', protect, requireRole('stylist'), removeBeforeAfter);
router.post('/video', protect, requireRole('stylist'), generalLimiter, upload.single('video'), uploadStylistVideo);
router.post('/portfolio/batch', protect, requireRole('stylist'), generalLimiter, upload.array('media', 20), savePortfolioMedia);
router.get('/:id/services', getStylistServices);
router.get('/:id', softAuth, getStylistById);

export default router;
