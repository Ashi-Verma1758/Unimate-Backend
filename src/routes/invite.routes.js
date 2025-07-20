import express from 'express';
import {
sendTeamInvite,
respondToInvite,
getReceivedInvites,
getSentRequests
} from '../controllers/invite.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔒 All routes protected by auth
router.post('/send/:projectId/:userId', protect, sendTeamInvite); // Send an invite
router.put('/respond/:projectId/:userId', protect, respondToInvite); // Accept or Reject
router.get('/received', protect, getReceivedInvites); // Received invites for user
router.get('/sent/:projectId', protect, getSentRequests); // Sent invites by creator


export default router;