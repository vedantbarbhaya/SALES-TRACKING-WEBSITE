import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  createSale,
  getSales,
  getSaleById,
  updateSaleStatus,
  getSalesStats,
  getDailySales,
  getMonthlyReport,
  getSalesByProduct,
  getSalesBySalesperson,
  cancelSale,
  issueSaleRefund
} from '../controllers/salesController.js';
import { upload } from '../config/upload.js';

const router = express.Router();

// Basic routes
router.route('/')
  .post(protect, upload.single('billPhoto'), createSale)
  .get(protect, getSales);

// Statistics routes
router.get('/stats', protect, getSalesStats);
router.get('/daily', protect, getDailySales);
router.get('/monthly', protect, getMonthlyReport);
router.get('/by-product', protect, getSalesByProduct);
router.get('/by-salesperson', protect, admin, getSalesBySalesperson);

// Individual sale routes
router.route('/:id')
  .get(protect, getSaleById);

// Sale status routes
router.put('/:id/status', protect, updateSaleStatus);
router.post('/:id/cancel', protect, cancelSale);
router.post('/:id/refund', protect, admin, issueSaleRefund);

export default router;