import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { getAccessSecret } from '../config/jwt.config.js';

// Then, use getAccessSecret() instead of ACCESS_SECRET


export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {token = req.headers.authorization.split(' ')[1];
    console.log('🔐 Incoming token (protect middleware):', token);

    const ACCESS_SECRET_FOR_VERIFICATION = getAccessSecret(); // <--- GET IT HERE!
    if (!ACCESS_SECRET_FOR_VERIFICATION) {
      console.error("FATAL: ACCESS_SECRET is null/undefined when verifying token!");
      return res.status(500).json({ message: 'Server configuration error: JWT secret missing.' });
    }

    console.log('🔐 Access Secret (protect middleware):', ACCESS_SECRET_FOR_VERIFICATION);
    try {
      const decoded = jwt.verify(token, ACCESS_SECRET_FOR_VERIFICATION);
      console.log("Decoded token:", decoded);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error('❌ JWT Error:', error.message);
      return res.status(401).json({ message: 'Token invalid or expired' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
};