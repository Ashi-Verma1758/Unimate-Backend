import express from 'express';
import {
  getUserProfile,
  updateUserProfile
} from '../controllers/user.controller.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
//get user profile
router.get('/me', protect, getUserProfile);

//update user profile
router.put('/me', protect, updateUserProfile);

export default router;
