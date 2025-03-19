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

router.route('/')
  .post(protect, admin, createMapping)
  .get(protect, admin, getMappings);

router.route('/:storeId')
  .get(protect, admin, getMappingByStore);

router.route('/id/:id')
  .put(protect, admin, updateMapping)
  .delete(protect, admin, deleteMapping);

export default router;