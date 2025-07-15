import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  members: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false // optional: if chat is linked to a project
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
