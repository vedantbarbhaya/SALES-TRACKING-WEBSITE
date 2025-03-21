import { validationResult, check } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Auth validation rules
export const loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').not().isEmpty(),
  validateRequest
];

export const registerValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  check('role', 'Role must be admin or salesperson').isIn(['admin', 'salesperson']),
  check('storeId', 'Store ID is required').not().isEmpty(),
  validateRequest
];

// Product validation rules
export const productValidation = [
  check('itemCode', 'Item code is required').not().isEmpty(),
  check('name', 'Product name is required').not().isEmpty(),
  check('department', 'Department is required').not().isEmpty(),
  check('category', 'Category is required').not().isEmpty(),
  check('price', 'Price must be a positive number').isFloat({ min: 0 }),
  validateRequest
];

// Sales validation rules
export const saleValidation = [
  check('items')
    .custom((value, { req }) => {
      // Handle both array and string JSON formats
      try {
        const items = typeof value === 'string' ? JSON.parse(value) : value;
        
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error('Items must be a non-empty array');
        }
        
        // Validate each item in the array
        items.forEach(item => {
          if (!item.quantity || parseInt(item.quantity) < 1) {
            throw new Error('Quantity must be a positive integer');
          }
          if (!item.price || parseFloat(item.price) <= 0) {
            throw new Error('Price must be a positive number');
          }
        });
        
        // Store the parsed items back in the request body
        req.body.items = items;
        return true;
      } catch (err) {
        throw new Error(err.message || 'Invalid items format');
      }
    }),
  check('store', 'Store ID is required').not().isEmpty(),
  validateRequest
];