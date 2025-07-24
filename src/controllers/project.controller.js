import Project from '../models/project.model.js';
import User from '../models/user.model.js';
import Conversation from '../models/conversation.model.js'; 
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

//creating post
export const createProject = async (req, res) => {
  try {
    const {
    title,
    description,
    domain,
    projectType,
    requiredSkills,
    niceToHaveSkills,
    timeCommitment,
    projectDuration,
    teamSize,
    location,
    startDate,
    applicationDeadline,
    remote,
    githubRepo,
    figmaLink,
    demoLink
  } = req.body;

  const newProject = await Project.create({
    title,
    description,
    domain,
    projectType,
    requiredSkills,
    niceToHaveSkills,
    timeCommitment,
    projectDuration,
    teamSize,
    location,
    startDate,
    applicationDeadline,
    remote,
    githubRepo,
    figmaLink,
    demoLink,
    createdBy: req.user._id
  });
    // await newProject.save();
    res.status(201).json({ message: 'Project post created successfully', project: newProject });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create project', error: err.message });
  }
};

//getting all projects
export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'firstName lastName university') 
      .populate('joinRequests')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch projects', error: err.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email university') // <-- Still missing 'university' and 'avatar' for creator
     .populate({
                path: 'joinRequests.user',
                select: 'firstName lastName email university' // Include university and avatar
            })
            .populate({
                path: 'invitedMembers.user', // Also populate invited members
                select: 'firstName lastName email university'
            })
            .exec();

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const teamMembers = [];

        // Add accepted members from joinRequests
        project.joinRequests.forEach(request => {
            if (request.status === 'accepted' && request.user) {
                teamMembers.push({
                    _id: request.user._id,
                    name: request.user.name || `${request.user.firstName} ${request.user.lastName}`,
                    email: request.user.email,
                    university: request.user.university,
                    avatar: request.user.avatar,
                    joinedVia: 'request'
                });
            }
        });
        // Add accepted members from invitedMembers
        project.invitedMembers.forEach(invite => {
            if (invite.status === 'accepted' && invite.user) {
                const isDuplicate = teamMembers.some(member => member._id.toString() === invite.user._id.toString());
                if (!isDuplicate) {
                    teamMembers.push({
                        _id: invite.user._id,
                        name: invite.user.name || `${invite.user.firstName} ${invite.user.lastName}`,
                        email: invite.user.email,
                        university: invite.user.university,
                        avatar: invite.user.avatar,
                        joinedVia: 'invite'
                    });
                }
            }
        });
        res.status(200).json(new ApiResponse(200, { // Use ApiResponse for consistency
            ...project.toObject(),
            teamMembers // include in response
        }));
    } catch (err) {
        // Log the error for debugging
        console.error('Error in getProjectById controller:', err);
        throw new ApiError(500, 'Failed to fetch project details'); // Use ApiError for consistency
    }
}
;

//joining a project like i'm interested
// In project.controller.js
export const joinProject = async (req, res) => {
  try {
    const { message } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // IMPORTANT: Ensure req.user._id is available here.
    // If req.user is correctly set by 'protect', then req.user._id will exist.
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Authentication required: User ID not found on request.' });
    }

    // Prevent duplicate requests
    const alreadyRequested = project.joinRequests.find(
      (reqObj) => reqObj.user.toString() === req.user._id.toString() // Use _id consistently
    );
    if (alreadyRequested) {
      return res.status(400).json({ message: 'You have already requested to join this project' });
    }

    // Add join request
    project.joinRequests.push({
      user: req.user._id, // Use _id consistently
      message,
      status: 'pending'
    });

    await project.save();
    res.status(200).json({ message: 'Join request sent successfully' });
  } catch (err) {
    // Log the actual error on the server side for debugging
    console.error('Error in joinProject controller:', err);
    // Send a generic 500 error to the client, but log details on server
    res.status(500).json({ message: 'Failed to send request due to an internal server error.', error: err.message });
  }
};

//accepting or rejecting req
export const respondToRequest = async (req, res) => {
  try {
    const { status } = req.body; // "accepted" or "rejected"
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    const request = project.joinRequests.find(
      (r) => r.user.toString() === userId
    );

    if (!request) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    request.status = status;
    await project.save();

    //create conv if accepted
    if (status === 'accepted') {
      const existingConversation = await Conversation.findOne({
        members: { $all: [req.user._id, userId] },
        project: projectId
      });

      if (!existingConversation) {
        await Conversation.create({
          members: [req.user._id, userId],
          project: projectId
        });
      }
    }

    res.status(200).json({ message: `Request has been ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update request', error: err.message });
  }
};

//projects by logged in user
export const getMyProjects = async (req, res) => {
try {
const projects = await Project.find({ createdBy: req.user.id })
.sort({ createdAt: -1 });
res.status(200).json(projects);
} catch (err) {
res.status(500).json({ message: 'Failed to fetch your posts', error: err.message });
}
};

//get post logged in user requested to join
export const getMyJoinRequests = async (req, res) => {
  console.log("🔍 Fetching join requests for:", req.user?.id);
try {
const projects = await Project.find({ 'joinRequests.user': req.user.id })
.populate('createdBy', 'firstName lastName university')
.sort({ createdAt: -1 });

res.status(200).json(projects); 

} catch (err) {
res.status(500).json({ message: 'Failed to fetch join requests', error: err.message });
}
};

export const getTeamMembers = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
        .populate({
            path: 'joinRequests.user', // Populate users who requested to join
            select: 'firstName lastName email university avatar'
        })
        .populate({
            path: 'invitedMembers.user', // Populate users who were invited
            select: 'firstName lastName email university avatar'
        })
        .exec();

    if (!project) {
        throw new ApiError(404, 'Project not found');
    }

    const acceptedTeamMembers = [];

    // Add accepted members from joinRequests
    project.joinRequests.forEach(request => {
        if (request.status === 'accepted' && request.user) {
            acceptedTeamMembers.push({
                _id: request.user._id,
                firstName: request.user.firstName,
                lastName: request.user.lastName,
                name: request.user.name || `${request.user.firstName} ${request.user.lastName}`,
                email: request.user.email,
                university: request.user.university,
                avatar: request.user.avatar,
                joinedVia: 'request',
                joinedAt: request.sentAt
            });
        }
    });

    // Add accepted members from invitedMembers
    project.invitedMembers.forEach(invite => {
        if (invite.status === 'accepted' && invite.user) {
            const isDuplicate = acceptedTeamMembers.some(member => member._id.toString() === invite.user._id.toString());
            if (!isDuplicate) {
                acceptedTeamMembers.push({
                    _id: invite.user._id,
                    firstName: invite.user.firstName,
                    lastName: invite.user.lastName,
                    name: invite.user.name || `${invite.user.firstName} ${invite.user.lastName}`,
                    email: invite.user.email,
                    university: invite.user.university,
                    avatar: invite.user.avatar,
                    joinedVia: 'invite',
                    joinedAt: invite.sentAt
                });
            }
        }
    });

    res.status(200).json(new ApiResponse(200, { team: acceptedTeamMembers }));
});