import express from 'express';
import {
  getProfile, updateProfile, uploadAvatar, serveAvatar,
  changePassword, searchProfiles, getUserById, getUserPublicData,
  sendFriendRequest, respondFriendRequest, removeFriend, getFriends,
  upload
} from '../controllers/userController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Profile
router.get('/me',           protect, getProfile);
router.patch('/me',         protect, updateProfile);
router.post('/me/avatar',   protect, upload.single('avatar'), uploadAvatar);
router.post('/me/password', protect, changePassword);

// Avatar serving (public)
router.get('/avatar/:avatarId', serveAvatar);

// Search & public profiles
router.get('/search',               optionalProtect, searchProfiles);
router.get('/:userId/public-data',  optionalProtect, getUserPublicData);
router.get('/:userId',              optionalProtect, getUserById);

// Friends
router.get('/friends/list',           protect, getFriends);
router.post('/friends/request',       protect, sendFriendRequest);
router.post('/friends/respond',       protect, respondFriendRequest);
router.delete('/friends/:friendId',   protect, removeFriend);

export default router;
