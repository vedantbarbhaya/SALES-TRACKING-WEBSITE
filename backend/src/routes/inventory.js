import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  getInventory,
  updateInventoryItem,
  bulkUpdateInventory,
  getInventoryStats
} from '../controllers/inventoryController.js';

const router = express.Router();

// Get inventory items from a specific collection
router.get('/', protect, getInventory);

// Get inventory statistics
router.get('/stats', protect, getInventoryStats);

// Update a single inventory item (admin only)
router.put('/:id', protect, admin, updateInventoryItem);

// Bulk update inventory items (admin only)
router.post('/bulk-update', protect, admin, bulkUpdateInventory);

export default router;