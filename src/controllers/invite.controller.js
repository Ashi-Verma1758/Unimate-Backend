import Project from '../models/project.model.js';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

//send invite to user for project
export const sendTeamInvite = asyncHandler(async (req, res) => {
const { projectId, userId } = req.params;
// const { userId } = req.body;

const project = await Project.findById(projectId);
if (!project) return res.status(404).json({ message: 'Project not found' });

if (project.createdBy.toString() !== req.user._id.toString()) {
 throw new ApiError(403, 'Not authorized to send invites for this project');
  }

  const existingRequest = project.joinRequests.find(
    (r) => r.user.toString() === userId
  );

  if (existingRequest) {
    throw new ApiError(400, 'Invite already sent to this user');
  }

  project.joinRequests.push({ user: userId, status: 'pending' });
  await project.save();

  res.status(200).json(new ApiResponse(200, null, 'Invite sent successfully'));
});

// Accept or Reject an invite
export const respondToInvite = asyncHandler(async (req, res) => {
  const { status } = req.body; // accepted or rejected
  const { projectId } = req.params;
  const userId = req.user._id;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  const request = project.joinRequests.find(
    (r) => r.user.toString() === userId.toString()
  );

  if (!request) throw new ApiError(404, 'No invite found for this project');

  request.status = status;
  await project.save();

  res.status(200).json(new ApiResponse(200, null, `Invite ${status}`));
});

// Get all invites received by the logged in user
export const getReceivedInvites = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const projects = await Project.find({
    'joinRequests.user': userId,
  })
    .populate('createdBy', 'name email')
    .populate('joinRequests.user', 'name email')
    .exec();

  const receivedInvites = projects
    .map((project) => {
      const invite = project.joinRequests.find(
        (r) => r.user._id.toString() === userId.toString()
      );
      return {
        project,
        invite,
      };
    })
    .filter((item) => item.invite.status === 'pending');

  res.status(200).json(new ApiResponse(200, receivedInvites));
});

// Get all invites sent by the logged in user for their created projects
export const getSentRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const projects = await Project.find({ createdBy: userId })
    .populate('joinRequests.user', 'name email')
    .exec();

  const sentRequests = projects.map((project) => ({
    project,
    joinRequests: project.joinRequests,
  }));

  res.status(200).json(new ApiResponse(200, sentRequests));
});

export const getTeamMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId)
    .populate('invitedMembers', 'firstName lastName email university')
    .exec();

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  res.status(200).json({
    team: project.invitedMembers
  });
});
