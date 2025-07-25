import Project from '../models/project.model.js';
import User from '../models/user.model.js';
import Conversation from '../models/conversation.model.js'; 
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import mongoose from 'mongoose';
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
      .populate('createdBy', 'firstName lastName university academicYear rating projectsCompleted avatar') // <--- ADDED FIELDS
      .populate('joinRequests') // Still populating full requests to get their length for responseCount
      // If you add currentTeamCount as a stored field or derived with virtual
      // You may need to .populate('teamMembers') if it's an array of User IDs directly on Project
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch projects', error: err.message });
  }
};


// In your project.controller.js

export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email university academicYear rating projectsCompleted avatar')
            .populate({
                path: 'joinRequests.user',
                select: 'firstName lastName email university academicYear rating projectsCompleted avatar'
            })
            .populate({
                path: 'invitedMembers.user',
                select: 'firstName lastName email university academicYear rating projectsCompleted avatar'
            })
            .exec();

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // --- ADD THIS LOGIC TO INCREMENT VIEWS ---
        project.views = (project.views || 0) + 1; // Increment view count
        await project.save(); // Save the updated project with the new view count
        // --- END ADDITION ---

        const teamMembers = [];
        if (project.createdBy) {
            teamMembers.push({
                _id: project.createdBy._id,
                name: project.createdBy.name || `${project.createdBy.firstName} ${project.createdBy.lastName}`,
                email: project.createdBy.email,
                university: project.createdBy.university,
                avatar: project.createdBy.avatar,
                role: 'Project Lead',
            });
        }

        project.joinRequests.forEach(request => {
            if (request.status === 'accepted' && request.user) {
                const isDuplicate = teamMembers.some(member => member._id.toString() === request.user._id.toString());
                if (!isDuplicate) {
                    teamMembers.push({
                        _id: request.user._id,
                        name: request.user.name || `${request.user.firstName} ${request.user.lastName}`,
                        email: request.user.email,
                        university: request.user.university,
                        avatar: request.user.avatar,
                        joinedVia: 'request',
                        role: 'Member'
                    });
                }
            }
        });
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
                        joinedVia: 'invite',
                        role: 'Member'
                    });
                }
            }
        });

        res.status(200).json(new ApiResponse(200, {
            ...project.toObject(),
            currentTeamCount: project.currentTeamCount, // This virtual will be included
            teamMembers
        }));
    } catch (err) {
        console.error('Error in getProjectById controller:', err);
        throw new ApiError(500, 'Failed to fetch project details');
    }
};

// Note: getAllProjects will automatically include the 'views' field
// as long as it's defined in the schema and not explicitly excluded by .select()


//joining a project like i'm interested
// In project.controller.js
//joining a project like i'm interested
// In project.controller.js
export const joinProject = async (req, res) => {
    try {
        const { message } = req.body;
         const projectId = req.params.id;
          if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: 'Invalid project ID format.' });
        }
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
export const respondToRequest = asyncHandler(async (req, res) => { // Wrapped in asyncHandler
    try {
        const { status } = req.body; // "accepted" or "rejected"
        // CHANGE: Expect requestId in params, not userId
        const { projectId, requestId } = req.params; // Assumes route is like /api/projects/:projectId/requests/:requestId/respond

        if (!['accepted', 'rejected'].includes(status)) {
            throw new ApiError(400, 'Invalid status provided. Must be "accepted" or "rejected".');
        }

        const project = await Project.findById(projectId);
        if (!project) throw new ApiError(404, 'Project not found');

        // Authorization: Only the project creator can respond
        if (project.createdBy.toString() !== req.user._id.toString()) { // Use req.user._id for consistency
            throw new ApiError(403, 'Not authorized to respond to this request');
        }

        // Find the specific join request by its _id within the project's joinRequests array
        // Mongoose's .id() method is perfect for finding subdocuments by their _id
        const request = project.joinRequests.id(requestId);

        if (!request) {
            throw new ApiError(404, 'Join request not found');
        }

        // Prevent responding to already processed requests
        if (request.status !== 'pending') {
            throw new ApiError(400, `Request has already been ${request.status}.`);
        }

        request.status = status;
        await project.save();

        // Create conversation if accepted (ensure Conversation model is imported)
        if (status === 'accepted') {
            // Check if conversation already exists between creator (req.user._id) and requester (request.user) for this project
            const existingConversation = await Conversation.findOne({
                members: { $all: [req.user._id, request.user] },
                project: projectId
            });

            if (!existingConversation) {
                await Conversation.create({
                    members: [req.user._id, request.user], // Add both creator and requester
                    project: projectId
                });
            }
        }

        res.status(200).json(new ApiResponse(200, null, `Request has been ${status}`)); // Use ApiResponse
    } catch (err) {
        console.error('Error in respondToRequest controller:', err); // Log details on server
        throw new ApiError(500, 'Failed to update request'); // Send generic ApiError to client
    }
});
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
export const getSentRequests = asyncHandler(async (req, res) => { // Wrapped in asyncHandler
    const userId = req.user._id;
console.log("🔍 [Backend] Logged-in User ID for getSentRequests:", userId.toString());
    // Find projects created by the logged-in user
    const projects = await Project.find({ createdBy: userId }) // CORRECT: Find projects *I* created
        .populate({
            path: 'joinRequests.user', // Populate the user who sent the join request
            // Select all fields needed by JoinRequestCard. Removed 'avatar' and 'rating' based on your schema.
            select: 'firstName lastName email university academicYear major skills projectsCount' // Assuming projectsCount is on User
        })
        .select('title joinRequests') // Select only title and joinRequests for efficiency
        .exec();
 console.log("🔍 [Backend] Projects found for user's ID:", JSON.stringify(projects, null, 2)); // Stringify to see full objects
    const incomingJoinRequests = [];

    projects.forEach(project => {
        // Iterate through each project's joinRequests
        project.joinRequests.forEach(request => {
             console.log(`  🔍 [Backend] Processing request: User ID: ${request.user?._id?.toString()}, Status: ${request.status}`);
          // Push only 'pending' requests that have a populated user object
            if (request.status === 'pending' && request.user) {
                incomingJoinRequests.push({
                    project: { // Group project details
                        _id: project._id,
                        title: project.title
                    },
                    request: { // Group request details (the join request itself)
                        _id: request._id, // This is the unique ID of the join request subdocument
                        user: request.user._id, // The actual user ID of the requester
                        message: request.message,
                        status: request.status,
                        sentAt: request.sentAt
                    },
                    requesterDetails: { // Flattened user details for easier frontend consumption
                        _id: request.user._id,
                        firstName: request.user.firstName,
                        lastName: request.user.lastName,
                        name: request.user.name || `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim(), // Virtual or concat
                        email: request.user.email,
                        university: request.user.university || 'N/A',
                        academicYear: request.user.academicYear || 'N/A',
                        major: request.user.major || 'N/A',
                        skills: request.user.skills || [],
                        avatar: null, // Explicitly null as per your backend
                        rating: 0,    // Explicitly 0 as per your backend
                        projectsCount: request.user.projectsCount || 0 // Assuming projectsCount might be on User, defaults to 0
                    }
                });
            }
        });
    });
 console.log("🔍 [Backend] Final incomingJoinRequests array before sending:", JSON.stringify(incomingJoinRequests, null, 2));
    res.status(200).json(new ApiResponse(200, incomingJoinRequests)); // Wrap in ApiResponse
});



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