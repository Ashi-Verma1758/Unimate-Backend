import express from 'express';
import {
  createProject,
  getAllProjects,
  getProjectById,
  joinProject,
  respondToRequest,
  getMyProjects,
  getSentRequests,
  getTeamMembers
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
router.patch('/:projectId/requests/:requestId/respond/:userId', protect, respondToRequest);

// Get projects created by current user
router.get('/me/created', protect, getMyProjects);

// Get projects user is interested in
router.get('/me/incoming-request', protect, getSentRequests);

// Route to get team members for a specific project
// Example: GET /api/projects/:projectId/team
router.get('/:projectId/team', protect, getTeamMembers); 
export default router;
