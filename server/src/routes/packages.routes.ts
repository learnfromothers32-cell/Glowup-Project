import { Router } from 'express';
import { getStylistPackages, getMyPackages, createPackage, updatePackage, deletePackage, getPackagePurchases, purchasePackage } from '../controllers/packages.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();
router.get('/stylist/:stylistId', getStylistPackages);
router.post('/purchase', protect, generalLimiter, purchasePackage);

router.use(protect, requireRole('stylist'));
router.get('/', getMyPackages);
router.post('/', generalLimiter, createPackage);
router.put('/:id', generalLimiter, updatePackage);
router.delete('/:id', deletePackage);
router.get('/purchases', getPackagePurchases);

export default router;
