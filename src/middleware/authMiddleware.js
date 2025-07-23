import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'accessSecretKey';


export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
console.log('🔐 Incoming token:', token);
console.log('🔐 Access Secret:', process.env.ACCESS_TOKEN_SECRET);
    try {
     

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
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
