import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'accessSecretKey';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refreshSecretKey';
const generateAccessToken = (userId) => {
  console.log('✅ Generating access token for user:', userId);
  return jwt.sign({ id: userId }, ACCESS_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (userId) => {
  console.log('✅ Generating refresh token for user:', userId);
  return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '10d' });
};

export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, university, academicYear, major, password } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    // Step 1: Create user without refreshToken
    const newUser = new User({
      firstName,
      lastName,
      email,
      university,
      academicYear,
      major,
      password,
      role: 'user'
    });

    await newUser.save(); // now newUser._id is available

    // Step 2: Now generate refresh token using newUser._id
    const refreshToken = generateRefreshToken(newUser._id);
    const accessToken = generateAccessToken(newUser._id);

    // Step 3: Update user with refreshToken
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        university: newUser.university,
        academicYear: newUser.academicYear,
        role: newUser.role
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
  console.log("⚡ Login route hit");

  try {
    const { email, password } = req.body;
console.log("➡️ Email:", email);
  console.log("➡️ Password:", password);
    // Find user by email
    const users = await User.find({}, 'email');
console.log("🔎 Emails in DB:", users.map(u => u.email));

    const user = await User.findOne({ email });
    console.log("🔍 Found user:", user);
    if (!user)
      return res.status(400).json({ message: 'Invalid email or password' });

    console.log("🔍 Email:", email);
console.log("🔍 Password:", password);
console.log("🔎 Found User:", user);
console.log("🔐 Stored Hash:", user.password);
console.log("🔐 Comparing with:", password);

    // Compare password
    const isMatch = await user.comparePassword(password);
    console.log("🔐 Password match?", isMatch);
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
        name: `${user.firstName} ${user.lastName}`,

        email: user.email,
        role: user.role
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

