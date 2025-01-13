import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

// Default upload path if not specified in env
const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads';

// Create absolute path for uploads
const uploadDir = path.join(process.cwd(), UPLOAD_PATH);

// Ensure upload directory exists
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  console.log(`Upload directory created at: ${uploadDir}`);
} catch (error) {
  console.error('Error creating upload directory:', error);
  // Create a fallback directory in the current folder
  const fallbackDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Clean the original filename
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9]/g, '-');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${cleanFileName}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/heic'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and HEIC images are allowed.'), false);
  }
};

// Create and export multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Export the upload directory path for use in other files
export const uploadsPath = uploadDir;