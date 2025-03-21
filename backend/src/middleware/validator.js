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
  check('items', 'Items are required').isArray({ min: 1 }),
  check('items.*.quantity', 'Quantity must be a positive integer').isInt({ min: 1 }),
  check('items.*.price', 'Price must be a positive number').isFloat({ min: 0 }),
  check('store', 'Store ID is required').not().isEmpty(),
  validateRequest
];