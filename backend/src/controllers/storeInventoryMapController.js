import asyncHandler from 'express-async-handler';
import StoreInventoryMap from '../models/StoreInventoryMap.js';
import Store from '../models/Store.js';
import { createInventoryModel } from '../models/InventoryFactory.js';

// @desc    Create a store-inventory mapping
// @route   POST /api/stores/inventory-mapping
// @access  Admin
export const createMapping = asyncHandler(async (req, res) => {
  const { storeId, inventoryCollection } = req.body;

  // Validate store exists
  const store = await Store.findById(storeId);
  if (!store) {
    res.status(404);
    throw new Error(`Store not found with ID: ${storeId}`);
  }

  // Check if a mapping already exists for this store
  const existingMapping = await StoreInventoryMap.findOne({ store: storeId });
  if (existingMapping) {
    res.status(400);
    throw new Error(`Mapping already exists for store: ${store.name} (${inventoryCollection})`);
  }

  // Create the mapping
  const mapping = await StoreInventoryMap.create({
    store: storeId,
    inventoryCollection
  });

  // Initialize the inventory model/collection
  try {
    const modelName = `Inventory${inventoryCollection.replace('INV_', '')}`;
    createInventoryModel(modelName, inventoryCollection);
  } catch (error) {
    console.error('Error initializing inventory model:', error);
    // Continue anyway, as the model might already exist
  }

  res.status(201).json(mapping);
});

// @desc    Get all store-inventory mappings
// @route   GET /api/stores/inventory-mapping
// @access  Admin
export const getMappings = asyncHandler(async (req, res) => {
  const mappings = await StoreInventoryMap.find({})
    .populate('store', 'name location');
  
  res.json(mappings);
});

// @desc    Get mapping by store ID
// @route   GET /api/stores/inventory-mapping/:storeId
// @access  Admin
export const getMappingByStore = asyncHandler(async (req, res) => {
  const mapping = await StoreInventoryMap.findOne({ store: req.params.storeId })
    .populate('store', 'name location');
  
  if (!mapping) {
    res.status(404);
    throw new Error(`No inventory mapping found for store ID: ${req.params.storeId}`);
  }
  
  res.json(mapping);
});

// @desc    Update a store-inventory mapping
// @route   PUT /api/stores/inventory-mapping/:id
// @access  Admin
export const updateMapping = asyncHandler(async (req, res) => {
  const { inventoryCollection } = req.body;
  
  const mapping = await StoreInventoryMap.findById(req.params.id);
  
  if (!mapping) {
    res.status(404);
    throw new Error(`Mapping not found with ID: ${req.params.id}`);
  }
  
  // Update the mapping
  mapping.inventoryCollection = inventoryCollection;
  await mapping.save();
  
  // Initialize the new inventory model/collection
  try {
    const modelName = `Inventory${inventoryCollection.replace('INV_', '')}`;
    createInventoryModel(modelName, inventoryCollection);
  } catch (error) {
    console.error('Error initializing inventory model:', error);
    // Continue anyway, as the model might already exist
  }
  
  res.json(mapping);
});

// @desc    Delete a store-inventory mapping
// @route   DELETE /api/stores/inventory-mapping/:id
// @access  Admin
export const deleteMapping = asyncHandler(async (req, res) => {
  const mapping = await StoreInventoryMap.findById(req.params.id);
  
  if (!mapping) {
    res.status(404);
    throw new Error(`Mapping not found with ID: ${req.params.id}`);
  }
  
  await mapping.remove();
  
  res.json({ message: 'Mapping removed' });
});