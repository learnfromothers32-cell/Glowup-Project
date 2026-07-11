import { Router } from 'express';
import { appConfig } from '../config/app';

const router = Router();

router.get('/public', (_req, res) => {
  res.json({
    success: true,
    data: { maxUploadSizeMB: appConfig.maxUploadSizeMB }
  });
});

export default router;
