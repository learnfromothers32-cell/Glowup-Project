import { Router } from 'express';
import { getMyForms, createForm, updateForm, deleteForm, getFormResponses, submitFormResponse } from '../controllers/consultations.controller';
import { protect, requireRole } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

// Client-facing: submit a consultation form response
router.post('/forms/:formId/submit', protect, generalLimiter, submitFormResponse);

// Stylist-only routes
router.use(protect, requireRole('stylist'));
router.get('/forms', getMyForms);
router.post('/forms', generalLimiter, createForm);
router.put('/forms/:id', generalLimiter, updateForm);
router.delete('/forms/:id', deleteForm);
router.get('/forms/:formId/responses', getFormResponses);

export default router;
