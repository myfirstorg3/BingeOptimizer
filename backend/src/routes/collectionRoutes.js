import express from 'express';
import { getCollections, createCollection, addItemToCollection } from '../controllers/collectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCollections)
  .post(protect, createCollection);

router.post('/:collectionId/items', protect, addItemToCollection);

export default router;
