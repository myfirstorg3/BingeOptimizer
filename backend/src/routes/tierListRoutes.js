import express from 'express';
import {
  getTierLists, getTierList, createTierList,
  updateTierList, deleteTierList, saveTierItems, addItemToTierList
} from '../controllers/tierListController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',              protect, getTierLists);
router.post('/',             protect, createTierList);
router.get('/:id',           protect, getTierList);
router.patch('/:id',         protect, updateTierList);
router.delete('/:id',        protect, deleteTierList);
router.post('/:id/items/add', protect, addItemToTierList);
router.put('/:id/items',     protect, saveTierItems);

export default router;
