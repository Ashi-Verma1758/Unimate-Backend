import Project from '../models/project.model.js';
import User from '../models/user.model.js';
import Conversation from '../models/conversation.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
// Function: sendProjectInvitation (from project creator to a user)
export const sendProjectInvitation = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Project not found');
    }

    // Authorization: Only the project creator can send invites
    if (project.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Not authorized to send invitations for this project');
    }

    // Fetch the user to be invited to get their details for denormalization
    const userToInvite = await User.findById(userId).select('firstName lastName university avatar');
    if (!userToInvite) {
        throw new ApiError(404, 'User to invite not found');
    }

    // Check if the user is already an accepted member
    const isAlreadyMember = project.invitedMembers.some(
        (member) => member.user.toString() === userId && member.status === 'accepted'
    );
    if (isAlreadyMember) {
        throw new ApiError(400, 'User is already an accepted member of this project');
    }

    // Check if an invitation (to this user) already exists (pending, accepted, or rejected)
    const existingInvitation = project.invitedMembers.find(
        (inv) => inv.user.toString() === userId
    );

    if (existingInvitation) {
        if (existingInvitation.status === 'pending') {
            throw new ApiError(400, 'Invitation already sent to this user and is pending');
        } else if (existingInvitation.status === 'rejected') {
            // Optionally, allow re-inviting a user who previously rejected
            existingInvitation.status = 'pending';
            // Update denormalized fields in case user info changed
            existingInvitation.userName = userToInvite.name || `${userToInvite.firstName} ${userToInvite.lastName}`;
            existingInvitation.userUniversity = userToInvite.university;
            existingInvitation.userAvatar = userToInvite.avatar;
            existingInvitation.sentAt = new Date(); // Reset sentAt
            await project.save();
            return res.status(200).json(new ApiResponse(200, null, 'Re-invitation sent successfully'));
        }
        // If status is 'accepted', the isAlreadyMember check above already covers it.
    }

    // If no existing invitation, create a new one with denormalized data
    project.invitedMembers.push({
        user: userToInvite._id,
        userName: userToInvite.name || `${userToInvite.firstName} ${userToInvite.lastName}`, // Use virtual 'name' or concatenate
        userUniversity: userToInvite.university,
        userAvatar: userToInvite.avatar,
        status: 'pending',
        sentAt: new Date() // Explicitly set sentAt
    });

    await project.save();

    res.status(200).json(new ApiResponse(200, null, 'Invitation sent successfully'));
});
// Function: respondToProjectInvitation (user responding to an invitation received from a project creator)
export const respondToProjectInvitation = asyncHandler(async (req, res) => {
    const { status } = req.body; // 'accepted' or 'rejected'
    const { projectId } = req.params;
    const userId = req.user._id;

    if (!['accepted', 'rejected'].includes(status)) {
        throw new ApiError(400, 'Invalid status provided. Must be "accepted" or "rejected".');
    }

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, 'Project not found');

    // Find the specific invitation for this user in the 'invitedMembers' array
    const invitation = project.invitedMembers.find(
        (inv) => inv.user.toString() === userId.toString() && inv.status === 'pending' // Only allow responding to pending invites
    );

    if (!invitation) {
        throw new ApiError(404, 'No pending invitation found for this project for you');
    }

    invitation.status = status;
    await project.save();

    if (status === 'accepted') {
        const existingConversation = await Conversation.findOne({
            members: { $all: [project.createdBy, userId] },
            project: projectId
        });

        if (!existingConversation) {
            await Conversation.create({
                members: [project.createdBy, userId],
                project: projectId
            });
        }
    }

    res.status(200).json(new ApiResponse(200, null, `Invitation ${status}`));
});
// Function: getReceivedProjectInvitations (Get all invitations received by the logged-in user from project creators)
export const getReceivedInvites = asyncHandler(async (req, res) => { // Renaming suggested previously: getReceivedProjectInvitations
    const userId = req.user._id;

    const projects = await Project.find({
        'invitedMembers.user': userId, // CORRECT: Query the 'invitedMembers' array
        'invitedMembers.status': 'pending' // Only retrieve pending invitations
    })
    .populate('createdBy', 'firstName lastName university avatar') // CORRECT: Populate 'createdBy' with needed fields
    .exec();

    const receivedInvitations = projects
        .map((project) => {
            // Find the specific invitation relevant to the current user
            const invitation = project.invitedMembers.find(
                (inv) => inv.user.toString() === userId.toString() && inv.status === 'pending'
            );

            // This check ensures we only process valid, pending invitations
            if (!invitation || !project.createdBy) {
                return null; // Skip if invitation not found or creator not populated
            }

            // Construct the data for the TeamInvitationCard directly from populated/denormalized fields
            return {
                projectId: project._id,
                projectName: project.title,
                projectDescription: project.description,
                domain: project.domain,
                timeCommitment: project.timeCommitment,
                projectDuration: project.projectDuration,
                requiredSkills: project.requiredSkills || [],
                fromUserId: project.createdBy._id,
                fromName: project.createdBy.name || `${project.createdBy.firstName} ${project.createdBy.lastName}`, // Use virtual 'name' or concatenate
                fromUniversity: project.createdBy.university,
                fromAvatar: project.createdBy.avatar || '', // Ensure it's a string, even if empty
                timeAgo: calculateTimeAgo(invitation.sentAt), // Ensure calculateTimeAgo is available
                project: project.toObject(),
                // Add any other details needed by the frontend, e.g., the invitation ID itself if required for actions
                invitationId: invitation._id // Useful for frontend
            };
        })
        .filter(item => item !== null); // Filter out any null entries

    res.status(200).json(new ApiResponse(200, receivedInvitations));
});

// Function: getSentRequests (Get all project invitations sent by the logged-in user)
export const getSentRequests = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const projects = await Project.find({ createdBy: userId, 'invitedMembers.0': { $exists: true } })
        .populate('invitedMembers.user', 'firstName lastName email university avatar')
        .exec();

    const sentRequests = projects.flatMap((project) =>
        project.invitedMembers.map((invitation) => {
            const invitedUser = invitation.user || {};
            return {
                invitationId: invitation._id,
                projectId: project._id,
                projectName: project.title,
                projectDescription: project.description,
                domain: project.domain,
                timeCommitment: project.timeCommitment,
                projectDuration: project.projectDuration,
                requiredSkills: project.requiredSkills || [],
                toUserId: invitedUser._id,
                toName: `${invitedUser.firstName || ''} ${invitedUser.lastName || ''}`.trim() || 'Unknown User',
                toUniversity: invitedUser.university || 'University not listed',
                toAvatar: invitedUser.avatar || '',
                status: invitation.status,
                timeAgo: calculateTimeAgo(invitation.sentAt),
                project: project.toObject(),
            };
        })
    );

    res.status(200).json(new ApiResponse(200, sentRequests));
});
 function calculateTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - new Date(date)) / 1000);

    let interval = seconds / 31536000; // years
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000; // months
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400; // days
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600; // hours
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60; // minutes
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}
