import express from 'express';
import {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent
} from '../controllers/event.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🟢 Public - Get all events
router.get('/', getAllEvents);

// 🔐 Protected - Create new event
router.post('/', protect, createEvent);

// 🔐 Protected - Update event by ID (only creator)
router.put('/:id', protect, updateEvent);

// 🔐 Protected - Delete event by ID (only creator)
router.delete('/:id', protect, deleteEvent);

export default router;
