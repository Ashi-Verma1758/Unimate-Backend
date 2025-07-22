import express from 'express';
import {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent
} from '../controllers/event.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// 🟢 Public - Get all events
router.get('/', getAllEvents);

// 🔐 Protected - Create new event
router.post('/', protect, requireAdmin, createEvent);

// 🔐 Protected - Update event by ID (only creator)
router.put('/:id', protect, requireAdmin,  updateEvent);

// 🔐 Protected - Delete event by ID (only creator)
router.delete('/:id', protect, requireAdmin,  deleteEvent);

export default router;
