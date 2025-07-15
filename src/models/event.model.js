import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    maxlength: 1000
  },

  date: {
    type: Date,
    required: true
  },

  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  imageUrl: {
    type: String,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Event = mongoose.model('Event', eventSchema);

export default Event;


// title, description, date are required.

// postedBy: links the event to the user who created it (usually a university role).

// imageUrl: optional Cloudinary-hosted image for event poster.

// createdAt: auto-generated timestamp.