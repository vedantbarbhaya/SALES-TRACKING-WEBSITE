import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import mongoose from 'mongoose';
import {
  getInventory,
  updateInventoryItem,
  bulkUpdateInventory,
  getInventoryStats
} from '../controllers/inventoryController.js';

const router = express.Router();

// temp code - Temporary simplified version of getInventory
router.get('/simple-test', protect, async (req, res) => {
  try {
    const { collection } = req.query;
    
    if (!collection || !collection.match(/^INV_[A-Za-z0-9]+$/)) {
      return res.status(400).json({ error: 'Invalid collection name' });
    }
    
    // Use direct MongoDB access instead of Mongoose models
    const items = await mongoose.connection.db
      .collection(collection)
      .find({})
      .limit(20)
      .toArray();
    
    res.json({
      items,
      page: 1,
      pages: Math.ceil(items.length / 20),
      total: items.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// temp code

// Get inventory items from a specific collection
router.get('/', protect, getInventory);

// Get inventory statistics
router.get('/stats', protect, getInventoryStats);

// Update a single inventory item (admin only)
router.put('/:id', protect, admin, updateInventoryItem);

// Bulk update inventory items (admin only)
router.post('/bulk-update', protect, admin, bulkUpdateInventory);

export default router;