import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validatePodcastGeneration } from '../middleware/validation.js';
import { generatePodcast, getHistory, generateScript } from '../controllers/podcastController.js';

const router = Router();

// GET /api/podcasts - Get user's podcast history
router.get('/', requireAuth, getHistory);

// POST /api/podcasts/generate - Generate new podcast
router.post('/generate', requireAuth, validatePodcastGeneration, generatePodcast);

// POST /api/podcasts/script - Generate script only
router.post('/script', requireAuth, generateScript);

// Keep the old endpoint for backward compatibility
router.get('/history', requireAuth, getHistory);

export default router;


