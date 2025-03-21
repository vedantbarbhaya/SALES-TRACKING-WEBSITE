import express from 'express';
import { 
  login, 
  registerUser, 
  getUserProfile, 
  updateUserProfile,
  logout
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/auth.js';
import { loginValidation, registerValidation } from '../middleware/validator.js';

const router = express.Router();

// Apply validation middleware to routes
router.post('/login', loginValidation, login);
router.post('/register', protect, admin, registerValidation, registerUser);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post('/logout', protect, logout);

export default router;