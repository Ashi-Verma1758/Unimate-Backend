import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// const JWT_SECRET = process.env.JWT_SECRET || 'yourStrongSecretKey';
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'accessSecretKey';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refreshSecretKey';

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, ACCESS_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '10d' });
};
// //Generate JWT token
// const generateToken = (userId) => {
//   return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '10d' });
// };

//register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, dob, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    // Create new user
   const refreshToken = generateRefreshToken(); // call first
const newUser = new User({ name, email, phone, dob, password, refreshToken });
await newUser.save();
const accessToken = generateAccessToken(newUser._id);


    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        dob: newUser.dob
      },
      accessToken,
  refreshToken
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

   const refreshToken = generateRefreshToken(user._id);
user.refreshToken = refreshToken;
await user.save();

const accessToken = generateAccessToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob
      },
      accessToken,
  refreshToken
    });

} catch (err) {

    res.status(500).json({ message: 'Failed to login', error: err.message });
  }
};

export const refreshAccessToken = (req, res) => {
  const token = req.body.refreshToken;

  if (!token) return res.status(401).json({ message: 'No refresh token provided' });

  jwt.verify(token, REFRESH_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== token) {
    return res.status(403).json({ message: 'Refresh token mismatch' });
  }

    const accessToken = generateAccessToken(decoded.id);
    res.status(200).json({ accessToken });
  });
};

export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token is required' });

    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(200).json({ message: 'User already logged out' });

    user.refreshToken = null;
    await user.save();

    res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed', error: err.message });
  }
};

