import { Router } from 'express';
import { getAreas, getCities } from '../controllers/area.controller';

const router = Router();

router.get('/', getAreas);
router.get('/cities', getCities);

export default router;
