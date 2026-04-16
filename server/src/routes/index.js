import express from 'express';
import { createUrl , getDashboardStats,getBatchStats} from '../controllers/urlController.js';
import { handleRedirect } from '../controllers/redirectController.js';
import { createUrlLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/api/urls', createUrlLimiter, express.json(), createUrl);
router.get('/api/dashboard', getDashboardStats);
router.post('/api/urls/stats', express.json(), getBatchStats);
router.get('/:code', handleRedirect);
export default router;