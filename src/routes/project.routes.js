import express from 'express';
import {
  createProject,
  getAllProjects,
  getProjectById,
  joinProject,
  respondToRequest,
  getMyProjects,
  getMyJoinRequests
} from '../controllers/project.controller.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
//creating new projectpost
router.post('/', protect, createProject);

//getting all projects
router.get('/', getAllProjects);

//getting projects by Id
router.get('/:id', getProjectById);

//send join request
router.post('/:id/join', protect, joinProject);

//accpeting or rejecting join req
router.put('/:projectId/respond/:userId', protect, respondToRequest);

// Get projects created by current user
router.get('/me/created', protect, getMyProjects);

// Get projects user is interested in
router.get('/me/joined', protect, getMyJoinRequests);

export default router;
