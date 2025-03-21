import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from cookie - this is the primary method since your login sets a cookie
  token = req.cookies.token;
  
  // Fallback to Authorization header for API clients
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('No token found in cookies or Authorization header');
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      throw new Error('User not found');
    }
    
    console.log(`Authenticated user: ${req.user.name}, ID: ${req.user._id}`);
    next();
  } catch (error) {
    console.error(`Token verification error: ${error.message}`);
    res.status(401);
    throw new Error('Not authorized');
  }
});

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
};