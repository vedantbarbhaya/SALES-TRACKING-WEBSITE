import express from 'express';
import { 
  login, 
  registerUser, 
  getUserProfile, 
  updateUserProfile 
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', protect, admin, registerUser);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;
