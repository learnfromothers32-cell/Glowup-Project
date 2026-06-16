import { Router } from 'express';
import { getStylistProducts, getMyProducts, createProduct, updateProduct, deleteProduct, adjustStock } from '../controllers/products.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();
router.get('/stylist/:stylistId', getStylistProducts);
router.use(protect, requireRole('stylist'));

router.get('/', getMyProducts);
router.post('/', generalLimiter, createProduct);
router.put('/:id', generalLimiter, updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/stock', generalLimiter, adjustStock);

export default router;
