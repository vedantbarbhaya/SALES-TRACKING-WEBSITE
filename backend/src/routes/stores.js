import express from 'express';
import { 
  getStores, 
  getStoreById, 
  createStore, 
  updateStore, 
  deleteStore 
} from '../controllers/storeController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getStores)
  .post(protect, admin, createStore);

router.route('/:id')
  .get(protect, admin, getStoreById)
  .put(protect, admin, updateStore)
  .delete(protect, admin, deleteStore);

export default router;
