import express from 'express';
import {
  getCollections, createCollection, addItemToCollection,
  updateItemStatus, removeItemFromCollection
} from '../controllers/collectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',  protect, getCollections);
router.post('/', protect, createCollection);

router.post('/:collectionId/items',           protect, addItemToCollection);
router.patch('/:collectionId/items/:mediaId/status', protect, updateItemStatus);
router.delete('/:collectionId/items/:mediaId',        protect, removeItemFromCollection);

export default router;
