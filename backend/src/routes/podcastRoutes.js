import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validatePodcastGeneration } from '../middleware/validation.js';
import { generatePodcast, getHistory } from '../controllers/podcastController.js';

const router = Router();

router.post('/generate', requireAuth, validatePodcastGeneration, generatePodcast);
router.get('/history', requireAuth, getHistory);

export default router;


