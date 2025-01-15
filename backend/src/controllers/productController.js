import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';

// @desc    Create a product
// @route   POST /api/products
// @access  Admin
export const createProduct = asyncHandler(async (req, res) => {
  const { 
    itemCode, 
    name, 
    variantName,    // New
    department,     // New
    description, 
    price, 
    category,
    subcategory    // New
  } = req.body;

  const productExists = await Product.findOne({ itemCode });

  if (productExists) {
    res.status(400);
    throw new Error('Product with this item code already exists');
  }

  const product = await Product.create({
    itemCode,
    name,
    variantName,    // New
    department,     // New
    description,
    price,
    category,
    subcategory    // New
  });

  res.status(201).json(product);
});

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 20;
  const page = Number(req.query.page) || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { itemCode: { $regex: req.query.keyword, $options: 'i' } }
        ]
      }
    : {};

  const categoryFilter = req.query.category
    ? { category: req.query.category }
    : {};

  const filter = {
    ...keyword,
    ...categoryFilter,
    isActive: true
  };

  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(pageSize * (page - 1))
    .limit(pageSize);

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  });
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const { 
    name, 
    variantName,    // New
    department,     // New
    description, 
    price, 
    category,
    subcategory,   // New 
    isActive 
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.variantName = variantName || product.variantName;    // New
    product.department = department || product.department;        // New
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.subcategory = subcategory || product.subcategory;    // New
    product.isActive = isActive !== undefined ? isActive : product.isActive;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get product by barcode
// @route   GET /api/products/barcode/:code
// @access  Private
export const getProductByBarcode = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ 
    itemCode: req.params.code,
    isActive: true 
  });

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Product.distinct('department', { isActive: true });
  res.json(departments);
});

export const getSubcategories = asyncHandler(async (req, res) => {
  const filter = req.query.category ? { category: req.query.category } : {};
  filter.isActive = true;
  
  const subcategories = await Product.distinct('subcategory', filter);
  res.json(subcategories);
});

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Private
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  res.json(categories);
});

// @desc    Deactivate product
// @route   DELETE /api/products/:id
// @access  Admin
export const deactivateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    product.isActive = false;
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Bulk update products
// @route   POST /api/products/bulk-update
// @access  Admin
export const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    res.status(400);
    throw new Error('Invalid products data');
  }

  const results = {
    successful: [],
    failed: []
  };

  for (const productData of products) {
    try {
      if (!productData._id) {
        throw new Error('Product ID is required');
      }

      const product = await Product.findById(productData._id);
      
      if (!product) {
        throw new Error(`Product not found with ID: ${productData._id}`);
      }

      // Update fields if provided
      if (productData.hasOwnProperty('name')) product.name = productData.name;
      if (productData.hasOwnProperty('description')) product.description = productData.description;
      if (productData.hasOwnProperty('price')) product.price = productData.price;
      if (productData.hasOwnProperty('category')) product.category = productData.category;
      if (productData.hasOwnProperty('isActive')) product.isActive = productData.isActive;
      if (productData.hasOwnProperty('variantName')) product.variantName = productData.variantName;
      if (productData.hasOwnProperty('department')) product.department = productData.department;
      if (productData.hasOwnProperty('subcategory')) product.subcategory = productData.subcategory;

      const updatedProduct = await product.save();
      results.successful.push({
        _id: updatedProduct._id,
        status: 'success'
      });
    } catch (error) {
      results.failed.push({
        _id: productData._id,
        error: error.message,
        status: 'failed'
      });
    }
  }

  res.json({
    message: `Successfully updated ${results.successful.length} products, ${results.failed.length} failed`,
    results
  });
});

// @desc    Search products with advanced filters
// @route   GET /api/products/search
// @access  Private
export const searchProducts = asyncHandler(async (req, res) => {
  const {
    keyword,
    department,    // New
    category,
    subcategory,   // New
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = -1,
    page = 1,
    limit = 20
  } = req.query;

  // Build filter object
  const filter = { isActive: true };

  // Keyword search
  if (keyword) {
    filter.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { itemCode: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { variantName: { $regex: keyword, $options: 'i' } }  // New
    ];
  }

  // Department filter
  if (department) {
    filter.department = department;
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Subcategory filter
  if (subcategory) {
    filter.subcategory = subcategory;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Build sort object
  const sort = {};
  sort[sortBy] = Number(sortOrder);

  try {
    // Get total count for pagination
    const count = await Product.countDocuments(filter);

    // Get products
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Get unique categories for filters
    const categories = await Product.distinct('category', { isActive: true });

    // Get price range for filters
    const priceRange = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(count / Number(limit)),
      total: count,
      filters: {
        departments: await Product.distinct('department', { isActive: true }),  // New
        categories,
        subcategories: await Product.distinct('subcategory', { isActive: true }), // New
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 }
      }
    });
  } catch (error) {
    res.status(500);
    throw new Error('Error searching products: ' + error.message);
  }
});