import express from 'express';
import { createBingeSession, getBingeSession, getBingeSessions } from '../controllers/bingeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',    protect, getBingeSessions);
router.post('/',   protect, createBingeSession);
router.get('/:id', protect, getBingeSession);

export default router;
