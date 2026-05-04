import express from 'express';
import { getCollections, createCollection } from '../controllers/collectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCollections)
  .post(protect, createCollection);

export default router;
