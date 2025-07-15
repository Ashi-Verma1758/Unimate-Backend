import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'yourStrongSecretKey';

//Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '10d' });
};

//register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, dob, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    // Create new user
    const newUser = new User({ name, email, phone, dob, password });
    await newUser.save();

    const token = generateToken(newUser._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        dob: newUser.dob
      },
      token
    });

  } catch (err) {

    res.status(500).json({ message: 'Failed to register user', error: err.message });
    
  }
};

//login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid email or password' });

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob
      },
      token
    });

} catch (err) {

    res.status(500).json({ message: 'Failed to login', error: err.message });
  }
};
