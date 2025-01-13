import asyncHandler from 'express-async-handler';
import Store from '../models/Store.js';

// @desc    Get all stores
// @route   GET /api/stores
// @access  Private/Admin
export const getStores = asyncHandler(async (req, res) => {
  const stores = await Store.find({});
  res.status(200).json(stores);
});

// @desc    Get store by ID
// @route   GET /api/stores/:id
// @access  Private/Admin
export const getStoreById = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (store) {
    res.status(200).json(store);
  } else {
    res.status(404);
    throw new Error('Store not found');
  }
});

// @desc    Create a new store
// @route   POST /api/stores
// @access  Private/Admin
export const createStore = asyncHandler(async (req, res) => {
  const { name, location, contactNumber } = req.body;

  const store = new Store({
    name,
    location,
    contactNumber,
  });

  const createdStore = await store.save();
  res.status(201).json(createdStore);
});

// @desc    Update a store
// @route   PUT /api/stores/:id
// @access  Private/Admin
export const updateStore = asyncHandler(async (req, res) => {
  const { name, location, contactNumber, isActive } = req.body;

  const store = await Store.findById(req.params.id);

  if (store) {
    store.name = name || store.name;
    store.location = location || store.location;
    store.contactNumber = contactNumber || store.contactNumber;
    store.isActive = isActive !== undefined ? isActive : store.isActive;

    const updatedStore = await store.save();
    res.status(200).json(updatedStore);
  } else {
    res.status(404);
    throw new Error('Store not found');
  }
});

// @desc    Delete a store
// @route   DELETE /api/stores/:id
// @access  Private/Admin
export const deleteStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);

  if (store) {
    await store.remove();
    res.status(200).json({ message: 'Store removed' });
  } else {
    res.status(404);
    throw new Error('Store not found');
  }
});
