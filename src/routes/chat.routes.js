import express from 'express';
import {
  createConversation,
  getMessages,
  sendMessage,
  getOrCreateConversation,
  getUserConversations
} from '../controllers/chat.controller.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/chats/conversation → creates or retrieves a conversation between two users
router.post('/conversation', protect, createConversation);

// Usage: /api/chats/get-or-create?otherUserId=xxx&projectId=yyy
router.get('/get-or-create', protect, getOrCreateConversation);


// GET /api/chats/:conversationId/messages → get all messages in a conversation
router.get('/:conversationId/messages', protect, getMessages);

// POST /api/chats/:conversationId/messages → send a new message
router.post('/:conversationId/messages', protect, sendMessage);

//get all cono of logged in user
router.get('/my', protect, getUserConversations);

export default router;
