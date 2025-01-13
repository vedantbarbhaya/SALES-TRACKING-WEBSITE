import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  getProductByBarcode,
  getCategories,
  deactivateProduct,
  bulkUpdateProducts,
  searchProducts
} from '../controllers/productController.js';

const router = express.Router();

// Public routes
router.get('/categories', getCategories);
router.get('/barcode/:code', protect, getProductByBarcode);

// Search and filter routes
router.get('/search', protect, searchProducts);

// Protected routes
router.route('/')
  .get(protect, getProducts)
  .post(protect, admin, createProduct);

// Bulk operations
router.post('/bulk-update', protect, admin, bulkUpdateProducts);

// Individual product operations
router.route('/:id')
  .get(protect, getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deactivateProduct);

export default router;