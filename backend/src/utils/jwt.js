import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, expired: false, id: decoded.id };
  } catch (error) {
    return {
      valid: false,
      expired: error.name === 'TokenExpiredError',
      id: null
    };
  }
};

// backend/src/middleware/auth.js
import asyncHandler from 'express-async-handler';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const { valid, expired, id } = verifyToken(token);

      if (!valid) {
        throw new Error(expired ? 'Token expired' : 'Invalid token');
      }

      // Get user from token
      req.user = await User.findById(id).select('-password');

      if (!req.user) {
        throw new Error('User not found');
      }

      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized: ' + error.message);
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});
