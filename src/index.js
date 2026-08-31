import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import mongoose from 'mongoose';
import connectDB from './db/index.js';
import http from 'http';
import { Server } from 'socket.io';
import { initializeJwtSecrets } from './config/jwt.config.js';
import Conversation from './models/conversation.model.js';
import Message from './models/message.model.js';
import Project from './models/project.model.js';

initializeJwtSecrets(process.env.ACCESS_TOKEN_SECRET, process.env.REFRESH_TOKEN_SECRET);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
});

app.set('io', io);

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

io.on('connection', (socket) => {
  console.log('📡 New user connected:', socket.id);

  const handleJoinConversation = (conversationId) => {
    if (!conversationId) return;
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  };

  socket.on('joinRoom', ({ conversationId }) => handleJoinConversation(conversationId));
  socket.on('joinConversation', (conversationId) => handleJoinConversation(conversationId));

  socket.on('sendMessage', async ({ conversationId, sender, text }) => {
    if (!conversationId || !sender || !text?.trim()) return;

    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation?.project) return;

      const isConversationMember = conversation.members.some((memberId) => memberId.toString() === sender.toString());
      if (!isConversationMember) return;

      const project = await Project.findById(conversation.project).select('createdBy joinRequests invitedMembers');
      if (!project) return;

      const teamIds = getProjectTeamIds(project);
      const allConversationMembersAreTeamMembers = conversation.members.every((memberId) =>
        teamIds.has(memberId.toString())
      );

      if (!teamIds.has(sender.toString()) || !allConversationMembersAreTeamMembers) return;

      const savedMessage = await Message.create({
        conversationId,
        sender,
        text: text.trim(),
        sentAt: new Date(),
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text.trim(),
        updatedAt: new Date(),
      });

      io.to(conversationId).emit('receiveMessage', {
        ...savedMessage.toObject(),
        conversationId,
        conversation: conversationId,
      });
    } catch (error) {
      console.error('Socket message save error:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

connectDB()
  .then(() => {
    server.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT || 8000}`);
      console.log('📂 Using DB:', mongoose.connection.name);
    });
  })
  .catch((err) => {
    console.log('MongoDB connection failed', err);
  });


