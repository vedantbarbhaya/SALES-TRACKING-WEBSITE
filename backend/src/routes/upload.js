import express from 'express';
import { uploadExcelData } from '../controllers/uploadController.js';
import { protect, admin } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer();

router.post('/excel', protect, admin, upload.single('file'), uploadExcelData);

export default router;