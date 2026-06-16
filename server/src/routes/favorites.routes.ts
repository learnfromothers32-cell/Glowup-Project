import { Router } from 'express';
import {
  getFavorites,
  checkFavorite,
  addFavorite,
  removeFavorite,
} from '../controllers/favorites.controller';
import { protect, softAuth } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/check/:stylistId', softAuth, checkFavorite);
router.use(protect);

router.get('/', getFavorites);
router.post('/', generalLimiter, addFavorite);
router.delete('/:stylistId', removeFavorite);

export default router;
