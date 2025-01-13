import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error(`Error: ${err.message}`.red);
  console.error(err.stack);

  // Clean up uploaded files if there's an error
  if (req.file) {
    const filePath = path.join(__dirname, '../../uploads', req.file.filename);
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error deleting uploaded file:', error);
    }
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) { // MongoDB duplicate key error
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `Duplicate ${field} error. This ${field} already exists.`
    });
  }

  // Set status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // Send error response
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    // Only send detailed error info in development
    ...(process.env.NODE_ENV !== 'production' && { 
      details: err.details || null,
      code: err.code || null
    })
  });
};