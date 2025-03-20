import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  createMapping,
  getMappings,
  getMappingByStore,
  updateMapping,
  deleteMapping
} from '../controllers/storeInventoryMapController.js';

const router = express.Router();

// Routes that require admin access
router.route('/')
  .post(protect, admin, createMapping)
  .get(protect, admin, getMappings);

// Store mapping route - accessible to all authenticated users
router.route('/:storeId')
  .get(protect, getMappingByStore); // Removed admin middleware

// Routes for specific mapping IDs - require admin access
router.route('/id/:id')
  .put(protect, admin, updateMapping)
  .delete(protect, admin, deleteMapping);

export default router;