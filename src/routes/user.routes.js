import express from 'express';
import {
  getAllUsers,
  getUserProfile,
  getUserProfileById,
  updateUserProfile
} from '../controllers/user.controller.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
//get user profile
router.get('/me', protect, getUserProfile);

//update user profile
router.put('/me', protect, updateUserProfile);

//get all users
router.get('/all',protect,getAllUsers);

//get another user's profile
router.get('/:userId', protect, getUserProfileById);

export default router;
