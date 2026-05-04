import express from 'express';
import { getMediaDetails, getAISummary, addToCollection } from '../controllers/mediaController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:imdbId', getMediaDetails);
router.get('/:imdbId/ai-summary', getAISummary);
router.post('/:imdbId/collect', protect, addToCollection);

export default router;
