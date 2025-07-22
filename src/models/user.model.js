import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema=new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

     email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  university: { type: String, required: true },

  academicYear:{
    type:String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Other'],
    required:true
  },

  major: { type: String },
  // phone: {
  //   type: String,
  //   required: true,
  // },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role:{
    type:String,
    enum:['user','admin'],
    default:'user',
  },

  linkedin: String,
  github: String,
  college: String,
  skills: [String],

  refreshToken: { type: String },

  createdAt: {
    type: Date,
    default: Date.now
  }
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});


userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;