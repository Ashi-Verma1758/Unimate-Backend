import mongoose from 'mongoose';
const projectSchema=new mongoose.Schema({

title: { 
  type: String,
   required: true 
  },
  description: { type: String, required: true },
  domain: {
     type: String,
     enum:[
      'Artificial Intelligence',
      'Web Development',
      'Mobile Development',
      'Data Science',
      'Cyber Security',
      'Blockchain',
      'IoT',
      'Health Technology',
      'Environmental Technology',
      'Financial Technology',
      'Educational Technology',
      'Gaming',
      'Social Impact',
      'Other'
     ],
      required: true },
      projectType: {
      type: String,
      enum: ['Academic Project', 'Hackathon', 'Startup', 'StarUp Idea', 'Research Project', 'Open Source', 'Competition', 'Other'],
      required: true 
      },

  requiredSkills: [{ type: String }],
  niceToHaveSkills: [{ type: String }],

  timeCommitment: { 
    type: String,
    enum: [
      '1-5 hours/week',
      '5-10 hours/week',
      '10-15 hours/week',
      '15-20 hours/week',
      '20+ hours/week',
      'Flexible'
    ],
    required: true
  
  },
  projectDuration: {
     type: String,
     enum:[
      '1-2 weeks',
      '3-4 weeks',
      '1-2 months',
      '3-4 months',
      '5-6 months',
      '6+ months',
      'Ongoing'
     ],
     required:true
     }, 
  teamSize: {
     type: Number,
     enum:[
      '1-2 people',
      '2-3 people',
      '3-4 people',
      '4+ people'
     ],
     required:true
     },
  location: { type: String },
  startDate: { type: Date },
  applicationDeadline: { type: Date },
  remote: { type: Boolean, default: false },

  githubRepo: { type: String },
  figmaLink: { type: String },
  demoLink: { type: String },

  joinRequests: [
{
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
sentAt: { type: Date, default: Date.now }
}
],

invitedMembers: [
{
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
sentAt: { type: Date, default: Date.now }
}
],
status: {
  type: String,
  enum: ['active', 'completed'],
  default: 'active'
},


  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});
 export default mongoose.model('Project', projectSchema);



