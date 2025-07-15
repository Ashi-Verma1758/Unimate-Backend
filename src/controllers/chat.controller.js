import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';

export const createConversation = async (req, res) => {
  const { userId, otherUserId, projectId } = req.body;

  let convo = await Conversation.findOne({
    members: { $all: [userId, otherUserId] },
    project: projectId
  });

  if (!convo) {
    convo = await Conversation.create({
      members: [userId, otherUserId],
      project: projectId
    });
  }

  res.status(200).json(convo);
};

export const sendMessage = async (req, res) => {
  const { text } = req.body;
  const { conversationId } = req.params;

  const message = await Message.create({
    conversationId,
    sender: req.user._id,
    text
  });

  res.status(201).json(message);
};

export const getMessages = async (req, res) => {
  const { conversationId } = req.params;

  const messages = await Message.find({ conversationId }).sort({ sentAt: 1 });
  res.status(200).json(messages);
};
