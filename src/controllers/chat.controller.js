import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';

export const createConversation = async (req, res) => {
  const userId = req.user._id;
const { otherUserId, projectId } = req.body;

  let convo = await Conversation.findOne({
    members: { $all: [userId, otherUserId] },
    project: projectId
  }).populate('members', 'firstName lastName email');;

  if (!convo) {
    convo = await Conversation.create({
      members: [userId, otherUserId],
      project: projectId
    });
    if (!convo) {
  convo = await Conversation.create({
    members: [userId, otherUserId],
    project: projectId
  });

  convo = await Conversation.findById(convo._id)
    .populate('members', 'firstName lastName email');
}

  }

  res.status(200).json(convo);
};

export const sendMessage = async (req, res) => {
  const { text } = req.body;
  const { conversationId } = req.params;
try {
const message = await Message.create({
conversationId,
sender: req.user._id,
text
});

//  Update lastMessage in the conversation
await Conversation.findByIdAndUpdate(conversationId, {
  lastMessage: text,
  updatedAt: new Date() 
});

res.status(201).json(message);
} catch (error) {
res.status(500).json({ message: 'Failed to send message', error: error.message });
}
};

export const getMessages = async (req, res) => {
  const { conversationId } = req.params;

  const messages = await Message.find({ conversationId }).sort({ sentAt: 1 });
  res.status(200).json(messages);
};

//get or create convo
export const getOrCreateConversation = async (req, res) => {
  const userId = req.user._id;
  const { otherUserId, projectId } = req.query;

  let convo = await Conversation.findOne({
    members: { $all: [userId, otherUserId] },
    project: projectId
    
  });

  

  if (!convo) {
    convo = await Conversation.create({
      members: [userId, otherUserId],
      project: projectId
    });
  

  // populate after creating
    convo = await Conversation.findById(convo._id)
      .populate('members', 'firstName lastName email ');
  }

  res.status(200).json(convo);
};

// Get all conversations for the logged-in user
export const getUserConversations = async (req, res) => {
try {
const userId = req.user._id;
const conversations = await Conversation.find({
  members: userId
})
  .populate('members', 'firstName lastName email')
  .populate('project', 'title') // Optional: populate project details
  .sort({ updatedAt: -1 });

res.status(200).json(conversations);
} catch (err) {
res.status(500).json({ message: 'Failed to fetch conversations', error: err.message });
}
};