import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema=new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
     email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  phone: {
    type: String,
    required: true,
  },

  dob: {
    type: Date,
    required: true
  },

  password: {
    type: String,
    required: true,
    minlength: 6
  },

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