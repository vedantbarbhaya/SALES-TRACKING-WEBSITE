// src/controllers/inventoryController.js
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { createInventoryModel } from '../models/InventoryFactory.js';

// @desc    Get inventory items from a specific collection
// @route   GET /api/inventory
// @access  Private
export const getInventory = asyncHandler(async (req, res) => {
  const { collection, search, department, category, page = 1, limit = 20 } = req.query;
  
  // Validate collection name
  if (!collection || !collection.match(/^INV_[A-Za-z0-9]+$/)) {
    res.status(400);
    throw new Error('Invalid collection name');
  }
  
  try {
    // Create model for the requested collection
    const modelName = `Inventory${collection.replace('INV_', '')}`;
    const InventoryModel = createInventoryModel(modelName, collection);
    
    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { itemCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { variantName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) {
      filter.department = department;
    }
    
    if (category) {
      filter.category = category;
    }
    
    // Add isActive filter if it exists in the schema
    filter.isActive = true;
    
    // Get count
    const total = await InventoryModel.countDocuments(filter);
    
    // Get data with pagination
    const items = await InventoryModel.find(filter)
      .sort({ itemCode: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({
      items,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(`Error fetching inventory from ${collection}:`, error);
    res.status(500);
    throw new Error(`Failed to fetch inventory: ${error.message}`);
  }
});

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private/Admin
export const updateInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { collection, ...itemData } = req.body;
  
  // Validate collection name
  if (!collection || !collection.match(/^INV_[A-Za-z0-9]+$/)) {
    res.status(400);
    throw new Error('Invalid collection name');
  }
  
  try {
    // Create model for the requested collection
    const modelName = `Inventory${collection.replace('INV_', '')}`;
    const InventoryModel = createInventoryModel(modelName, collection);
    
    // Find and update item
    const item = await InventoryModel.findById(id);
    
    if (!item) {
      res.status(404);
      throw new Error('Inventory item not found');
    }
    
    // Update fields
    Object.keys(itemData).forEach(key => {
      item[key] = itemData[key];
    });
    
    // Save changes
    const updatedItem = await item.save();
    
    res.json(updatedItem);
  } catch (error) {
    console.error(`Error updating inventory item in ${collection}:`, error);
    res.status(500);
    throw new Error(`Failed to update inventory item: ${error.message}`);
  }
});

// @desc    Bulk update inventory items
// @route   POST /api/inventory/bulk-update
// @access  Private/Admin
export const bulkUpdateInventory = asyncHandler(async (req, res) => {
  const { collection, items } = req.body;
  
  // Validate collection name
  if (!collection || !collection.match(/^INV_[A-Za-z0-9]+$/)) {
    res.status(400);
    throw new Error('Invalid collection name');
  }
  
  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Invalid items data');
  }
  
  try {
    // Create model for the requested collection
    const modelName = `Inventory${collection.replace('INV_', '')}`;
    const InventoryModel = createInventoryModel(modelName, collection);
    
    // Track results
    const results = {
      successful: [],
      failed: []
    };
    
    // Process each item
    for (const item of items) {
      try {
        if (!item._id) {
          throw new Error('Item ID is required');
        }
        
        const inventoryItem = await InventoryModel.findById(item._id);
        
        if (!inventoryItem) {
          throw new Error(`Item not found with ID: ${item._id}`);
        }
        
        // Update fields
        Object.keys(item).forEach(key => {
          if (key !== '_id') {
            inventoryItem[key] = item[key];
          }
        });
        
        // Save changes
        const updatedItem = await inventoryItem.save();
        
        results.successful.push({
          _id: updatedItem._id,
          itemCode: updatedItem.itemCode,
          status: 'success'
        });
      } catch (error) {
        results.failed.push({
          _id: item._id,
          error: error.message,
          status: 'failed'
        });
      }
    }
    
    res.json({
      message: `Successfully updated ${results.successful.length} items, ${results.failed.length} failed`,
      results
    });
  } catch (error) {
    console.error(`Error bulk updating inventory in ${collection}:`, error);
    res.status(500);
    throw new Error(`Failed to bulk update inventory: ${error.message}`);
  }
});

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private
export const getInventoryStats = asyncHandler(async (req, res) => {
  const { collection } = req.query;
  
  // Validate collection name
  if (!collection || !collection.match(/^INV_[A-Za-z0-9]+$/)) {
    res.status(400);
    throw new Error('Invalid collection name');
  }
  
  try {
    // Create model for the requested collection
    const modelName = `Inventory${collection.replace('INV_', '')}`;
    const InventoryModel = createInventoryModel(modelName, collection);
    
    // Get total item count
    const totalItems = await InventoryModel.countDocuments({ isActive: true });
    
    // Get out of stock count
    const outOfStock = await InventoryModel.countDocuments({ 
      isActive: true,
      quantity: { $lte: 0 }
    });
    
    // Get low stock count (less than 10)
    const lowStock = await InventoryModel.countDocuments({ 
      isActive: true,
      quantity: { $gt: 0, $lt: 10 }
    });
    
    // Get total inventory value
    const inventoryValue = await InventoryModel.aggregate([
      { $match: { isActive: true } },
      { $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$price", "$quantity"] } }
        }
      }
    ]);
    
    // Get top categories by value
    const topCategories = await InventoryModel.aggregate([
      { $match: { isActive: true } },
      { $group: {
          _id: "$category",
          totalValue: { $sum: { $multiply: ["$price", "$quantity"] } },
          itemCount: { $sum: 1 }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      totalItems,
      outOfStock,
      lowStock,
      inStock: totalItems - outOfStock,
      inventoryValue: inventoryValue.length > 0 ? inventoryValue[0].totalValue : 0,
      topCategories: topCategories.map(category => ({
        category: category._id,
        totalValue: category.totalValue,
        itemCount: category.itemCount
      }))
    });
  } catch (error) {
    console.error(`Error getting inventory stats from ${collection}:`, error);
    res.status(500);
    throw new Error(`Failed to get inventory statistics: ${error.message}`);
  }
});