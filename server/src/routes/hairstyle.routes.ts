import { Router } from 'express';
import {
  getAllHairstyles,
  getHairstyle,
  generateHairstyle,
  getUserResults,
  getResult,
  saveFavorite,
  getFavoriteResults,
  deleteResult
} from '../controllers/hairstyle.controller';
import { protect } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';
import { upload } from '../utils/upload';

const router = Router();

router.get('/', getAllHairstyles);
router.get('/results', protect, getUserResults);
router.get('/results/:id', protect, getResult);
router.delete('/results/:id', protect, deleteResult);
router.post('/favorites', protect, saveFavorite);
router.get('/favorites', protect, getFavoriteResults);
router.post('/generate', protect, generalLimiter, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mask', maxCount: 1 }]), generateHairstyle);
router.get('/:id', getHairstyle);

export default router;
