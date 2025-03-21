import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log(`Login attempt for email: ${email}`);
  
  try {
    // Try case-insensitive query with trimmed email
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } 
    });
    
    if (!user) {
      console.log(`User not found with email: ${email}`);
      
      // Debug: Check if any users exist
      const allUsers = await User.find({}).limit(5);
      console.log(`Total users in database: ${allUsers.length}`);
      if (allUsers.length > 0) {
        console.log('Sample users:');
        allUsers.forEach(u => console.log(` - ${u.email}`));
      }
      
      res.status(401);
      throw new Error('Invalid email or password');
    }
    
    console.log(`User found: ${user.name}`);
    
    // Populate store information separately if needed
    try {
      await user.populate('store');
    } catch (err) {
      console.log(`Warning: Could not populate store: ${err.message}`);
      // Continue anyway, don't fail the login
    }
    
    // Check password
    const isMatch = await user.matchPassword(password);
    
    if (isMatch) {
      // Generate token
      const token = generateToken(user._id);
      
      // Set token in HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure in production
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      // Return user data without sending token in body
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        store: user.store
      });
    } else {
      console.log('Password verification failed');
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    res.status(error.statusCode || 401);
    throw new Error(error.message || 'Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Admin
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, storeId } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    store: storeId,
  });

  if (user) {
    // Don't send token in the response, just user data
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      store: user.store
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('store');

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      store: user.store,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Don't send token in the response, just user data
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      store: updatedUser.store
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  
  res.status(200).json({ message: 'Logged out successfully' });
});