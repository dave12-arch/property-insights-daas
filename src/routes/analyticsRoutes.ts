import { Router } from 'express';
import { getNeighborhoodMetrics } from '../controllers/analyticsController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Protect this route with our JWT middleware
router.get('/neighborhoods/:id', requireAuth, getNeighborhoodMetrics);

export default router;