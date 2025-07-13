import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yourStrongSecretKey';

// Middleware to protect routes
export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]; // Remove "Bearer "

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Attach user info to req
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) return res.status(401).json({ message: 'User not found' });

      next(); // Move to the next route/controller
    } catch (error) {
      return res.status(401).json({ message: 'Token invalid or expired' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
};
