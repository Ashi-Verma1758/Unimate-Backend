import express from 'express';
import {
sendProjectInvitation,
respondToProjectInvitation,
getReceivedInvites,
getSentRequests
} from '../controllers/invite.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔒 All routes protected by auth
router.post('/send/:projectId/:userId', protect, sendProjectInvitation); // Send an invite
router.put('/respond/:projectId', protect, respondToProjectInvitation); // Accept or Reject
router.put('/respond/:projectId/:userId', protect, respondToProjectInvitation); // Backward-compatible alias
router.get('/received', protect, getReceivedInvites); // Received invites for user
router.get('/sent', protect, getSentRequests); // Sent invites by creator


export default router;
