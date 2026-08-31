import mongoose from 'mongoose';
import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import Project from '../models/project.model.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getProjectTeamIds = (project) => {
  const memberIds = new Set();

  if (project.createdBy) {
    memberIds.add(project.createdBy.toString());
  }

  (project.joinRequests || []).forEach((request) => {
    if (request.status === 'accepted' && request.user) {
      memberIds.add(request.user.toString());
    }
  });

  (project.invitedMembers || []).forEach((invite) => {
    if (invite.status === 'accepted' && invite.user) {
      memberIds.add(invite.user.toString());
    }
  });

  return memberIds;
};

const getAuthorizedProjectTeam = async (projectId, userId, otherUserId) => {
  if (!projectId || !isValidObjectId(projectId)) {
    return { status: 400, message: 'A valid project is required to start chat.' };
  }

  if (!otherUserId || !isValidObjectId(otherUserId)) {
    return { status: 400, message: 'A valid team member is required to start chat.' };
  }

  const project = await Project.findById(projectId).select('createdBy joinRequests invitedMembers');
  if (!project) {
    return { status: 404, message: 'Project not found.' };
  }

  const teamIds = getProjectTeamIds(project);
  const currentUserId = userId.toString();
  const targetUserId = otherUserId.toString();

  if (!teamIds.has(currentUserId) || !teamIds.has(targetUserId)) {
    return {
      status: 403,
      message: 'Chat is available only after both users are accepted team members for this project.',
    };
  }

  if (currentUserId === targetUserId) {
    return { status: 400, message: 'Choose another team member to chat with.' };
  }

  return { project };
};

const findOrCreateProjectConversation = async (userId, otherUserId, projectId) => {
  let conversation = await Conversation.findOne({
    members: { $all: [userId, otherUserId] },
    project: projectId,
  })
    .populate('members', 'firstName lastName email university avatar')
    .populate('project', 'title');

  if (!conversation) {
    conversation = await Conversation.create({
      members: [userId, otherUserId],
      project: projectId,
    });

    conversation = await Conversation.findById(conversation._id)
      .populate('members', 'firstName lastName email university avatar')
      .populate('project', 'title');
  }

  return conversation;
};

const assertConversationAccess = async (conversationId, userId) => {
  if (!isValidObjectId(conversationId)) {
    return { status: 400, message: 'Invalid conversation id.' };
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return { status: 404, message: 'Conversation not found.' };
  }

  if (!conversation.project) {
    return { status: 403, message: 'This conversation is missing a project context.' };
  }

  const isMember = conversation.members.some((memberId) => memberId.toString() === userId.toString());
  if (!isMember) {
    return { status: 403, message: 'You do not have access to this conversation.' };
  }

  const project = await Project.findById(conversation.project).select('createdBy joinRequests invitedMembers');
  if (!project) {
    return { status: 404, message: 'Project for this conversation was not found.' };
  }

  const teamIds = getProjectTeamIds(project);
  const allConversationMembersAreTeamMembers = conversation.members.every((memberId) =>
    teamIds.has(memberId.toString())
  );

  if (!teamIds.has(userId.toString()) || !allConversationMembersAreTeamMembers) {
    return {
      status: 403,
      message: 'Chat is available only for accepted team members of this project.',
    };
  }

  return { conversation };
};

export const createConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otherUserId, projectId } = req.body;
    const authorization = await getAuthorizedProjectTeam(projectId, userId, otherUserId);

    if (authorization.status) {
      return res.status(authorization.status).json({ message: authorization.message });
    }

    const conversation = await findOrCreateProjectConversation(userId, otherUserId, projectId);
    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create conversation', error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { conversationId } = req.params;
    const access = await assertConversationAccess(conversationId, req.user._id);

    if (access.status) {
      return res.status(access.status).json({ message: access.message });
    }

    if (!text?.trim()) {
      return res.status(400).json({ message: 'Message text is required.' });
    }

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      text: text.trim(),
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text.trim(),
      updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'firstName lastName email');

    req.app.get('io')?.to(conversationId).emit('receiveMessage', {
      ...populatedMessage.toObject(),
      conversationId,
      conversation: conversationId,
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const access = await assertConversationAccess(conversationId, req.user._id);

    if (access.status) {
      return res.status(access.status).json({ message: access.message });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'firstName lastName email')
      .sort({ sentAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load messages', error: error.message });
  }
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otherUserId, projectId } = req.query;
    const authorization = await getAuthorizedProjectTeam(projectId, userId, otherUserId);

    if (authorization.status) {
      return res.status(authorization.status).json({ message: authorization.message });
    }

    const conversation = await findOrCreateProjectConversation(userId, otherUserId, projectId);
    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to open conversation', error: error.message });
  }
};

export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      members: userId,
      project: { $exists: true, $ne: null },
    })
      .populate('members', 'firstName lastName email university avatar')
      .populate('project', 'title')
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch conversations', error: err.message });
  }
};
