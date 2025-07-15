import express from 'express';
import {
  createConversation,
  getMessages,
  sendMessage
} from '../controllers/chat.controller.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/chats/conversation → creates or retrieves a conversation between two users
router.post('/conversation', protect, createConversation);

// GET /api/chats/:conversationId/messages → get all messages in a conversation
router.get('/:conversationId/messages', protect, getMessages);

// POST /api/chats/:conversationId/messages → send a new message
router.post('/:conversationId/messages', protect, sendMessage);

export default router;
