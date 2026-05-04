import express from 'express';
import { getMediaDetails, getAISummary, addToCollection, getMediaByInternalId, getAISummaryByInternalId } from '../controllers/mediaController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Internal DB routes (no external API calls - for collection detail panels)
router.get('/internal/:id', getMediaByInternalId);
router.get('/internal/:id/ai-summary', getAISummaryByInternalId);

router.get('/:imdbId', getMediaDetails);
router.get('/:imdbId/ai-summary', getAISummary);
router.post('/:imdbId/collect', protect, addToCollection);

export default router;
