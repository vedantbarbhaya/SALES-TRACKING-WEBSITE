import asyncHandler from 'express-async-handler';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const getStoreFilter = (storeId, user) => {
  // For admin users selecting 'all'
  if (storeId === 'all' && user.role === 'admin') {
    return { $exists: true };
  }
  
  // For specific store selections
  if (storeId === 'all') {
    return new mongoose.Types.ObjectId(user.store);
  }
  
  return new mongoose.Types.ObjectId(storeId);
};

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
// Modify the createSale controller
export const createSale = asyncHandler(async (req, res) => {
  // Parse items if it's a string (from FormData)
  const items = typeof req.body.items === 'string' ? 
    JSON.parse(req.body.items) : req.body.items;

  const { customerName, totalAmount, salesman} = req.body;

  // Validate items and calculate total
  let calculatedTotal = 0;
  const validatedItems = await Promise.all(items.map(async (item) => {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new Error(`Product not found: ${item.product}`);
    }
    
    const total = Number(item.price) * Number(item.quantity);
    calculatedTotal += total;

    return {
      product: product._id,
      quantity: item.quantity,
      price: item.price, // Taking from the form value
      total
    };
  }));

  // Create bill photo object if photo was uploaded
  const billPhoto = req.file ? {
    data: req.file.buffer,
    contentType: req.file.mimetype
  } : null;

  console.log(billPhoto)
  const sale = await Sale.create({
    store: req.body.store,
    salesperson: req.user._id,
    customerName,
    items: validatedItems,
    totalAmount: calculatedTotal,
    billPhoto,
    salesmanName: salesman
  });

  const populatedSale = await Sale.findById(sale._id)
    .populate('store')
    .populate('salesperson', 'name')
    .populate('items.product', 'name itemCode')
    .select('billPhoto.data'); 
    
  // Don't send the binary data of the photo in the response
  const saleResponse = populatedSale.toObject();
  if (saleResponse.billPhoto) {
    saleResponse.billPhoto = {
      contentType: saleResponse.billPhoto.contentType,
      exists: true
    };
  }

  res.status(201).json(saleResponse);
});


// @desc    Get all sales for a store
// @route   GET /api/sales
// @access  Private
export const getSales = asyncHandler(async (req, res) => {
  console.log('GetSales called with query:', req.query);
  console.log('User:', req.user);

  const pageSize = 10;
  const page = Number(req.query.page) || 1;

  // For debugging, first get all sales
  const allSales = await Sale.find({});
  console.log('Total sales in database (unfiltered):', allSales.length);
  
  // Build filter object
  const filter = {};

  // Handle store filtering based on user role
  if (req.user.role === 'admin') {
    // Admin can see all stores unless specific store requested
    if (req.query.storeId && req.query.storeId !== 'all') {
      filter.store = new mongoose.Types.ObjectId(req.query.storeId);
    }
  } else {
    // Non-admin users can only see their store's sales
    filter.store = new mongoose.Types.ObjectId(req.user.store);
  }

  // Add date filters if provided
  if (req.query.startDate) {
    filter.createdAt = { $gte: new Date(req.query.startDate) };
  }
  if (req.query.endDate) {
    if (!filter.createdAt) filter.createdAt = {};
    filter.createdAt.$lte = new Date(req.query.endDate);
  }

  // Add search filter if provided
  if (req.query.search) {
    filter.$or = [
      { saleNumber: { $regex: req.query.search, $options: 'i' } },
      { customerName: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  console.log('Applied filter:', JSON.stringify(filter, null, 2));

  try {
    // Get count of filtered results
    const count = await Sale.countDocuments(filter);
    console.log('Count after applying filter:', count);

    // Get paginated sales with population
    const sales = await Sale.find(filter)
      .populate('store', 'name')
      .populate('salesperson', 'name')
      .populate({
        path: 'items.product',
        select: 'name itemCode variantName department category subcategory'
      })
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    console.log('Number of sales found after pagination:', sales.length);
    
    // Log a sample sale for debugging (first sale if exists)
    if (sales.length > 0) {
      console.log('Sample sale data:', JSON.stringify(sales[0], null, 2));
    }

    res.json({
      sales,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    console.error('Error in getSales:', error);
    throw error;
  }
});

// @desc    Get all sales for a store
// @route   GET /api/sales
// @access  Private
// In salesController.js, modify getSales function:

// In getSalesStats function:
export const getSalesStats = asyncHandler(async (req, res) => {
  const startDate = req.query.startDate 
    ? new Date(req.query.startDate)
    : new Date(new Date().setHours(0, 0, 0, 0));
  
  const endDate = req.query.endDate
    ? new Date(req.query.endDate)
    : new Date(new Date().setHours(23, 59, 59, 999));

  const storeId = req.query.storeId || req.user.store;
  const storeFilter = getStoreFilter(storeId, req.user);

  // Base match condition for all aggregations
  const baseMatch = {
    store: storeFilter,
    createdAt: { $gte: startDate, $lte: endDate },
    status: 'completed'
  };

  // Get overall stats
  const stats = await Sale.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        averageAmount: { $avg: '$totalAmount' },
        uniqueCustomers: { $addToSet: '$customerName' }
      }
    },
    {
      $project: {
        _id: 0,
        totalSales: 1,
        totalAmount: { $round: ['$totalAmount', 2] },
        averageAmount: { $round: ['$averageAmount', 2] },
        uniqueCustomers: { $size: '$uniqueCustomers' }
      }
    }
  ]);

  // Get department sales
  const departmentSales = await Sale.aggregate([
      { $match: baseMatch },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.department',
          totalAmount: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      {
        $project: {
          department: '$_id',
          totalAmount: { $round: ['$totalAmount', 2] },
          totalQuantity: 1,
          _id: 0
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get category sales
    const categorySales = await Sale.aggregate([
      { $match: baseMatch },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          totalAmount: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalAmount: { $round: ['$totalAmount', 2] },
          totalQuantity: 1,
          _id: 0
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

  const topProducts = await Sale.aggregate([
    {
      $match: {
        store: storeFilter,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' },
        totalAmount: { $sum: '$items.total' }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        name: '$product.name',
        itemCode: '$product.itemCode',
        variantName: '$product.variantName',    // New
        department: '$product.department',       // New
        category: '$product.category',
        subcategory: '$product.subcategory',    // New
        totalQuantity: 1,
        totalAmount: { $round: ['$totalAmount', 2] }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 }
  ]);

   res.json({
    summary: stats[0] || {
      totalSales: 0,
      totalAmount: 0,
      averageAmount: 0,
      uniqueCustomers: 0
    },
    departmentSales,
    categorySales,
    topProducts
  });
});


// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private
export const getSaleById = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('store')
    .populate('salesperson', 'name')
    .populate('items.product', 'name itemCode variantName department category subcategory');

  if (sale) {
    // Verify user has access to this sale
    if (sale.store._id.toString() !== req.user.store.toString() && 
        req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to view this sale');
    }
    res.json(sale);
  } else {
    res.status(404);
    throw new Error('Sale not found');
  }
});

// @desc    Update sale status
// @route   PUT /api/sales/:id/status
// @access  Private
export const updateSaleStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const sale = await Sale.findById(req.params.id);

  if (sale) {
    // Verify user has access to this sale
    if (sale.store.toString() !== req.user.store.toString() && 
        req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this sale');
    }

    sale.status = status;
    const updatedSale = await sale.save();

    res.json(updatedSale);
  } else {
    res.status(404);
    throw new Error('Sale not found');
  }
});

// @desc    Cancel a sale
// @route   POST /api/sales/:id/cancel
// @access  Private
export const cancelSale = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const sale = await Sale.findById(req.params.id);

  if (!sale) {
    res.status(404);
    throw new Error('Sale not found');
  }

  // Check if sale is already cancelled
  if (sale.status === 'cancelled') {
    res.status(400);
    throw new Error('Sale is already cancelled');
  }

  // Verify user has access to this sale
  if (sale.store.toString() !== req.user.store.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to cancel this sale');
  }

  // Only allow cancellation within 24 hours of sale creation
  const saleDate = new Date(sale.createdAt);
  const currentDate = new Date();
  const hoursDifference = (currentDate - saleDate) / (1000 * 60 * 60);
  
  if (hoursDifference > 24 && req.user.role !== 'admin') {
    res.status(400);
    throw new Error('Sales can only be cancelled within 24 hours of creation');
  }

  // Update sale status
  sale.status = 'cancelled';
  sale.cancelReason = reason;
  sale.cancelledAt = new Date();
  sale.cancelledBy = req.user._id;

  const updatedSale = await sale.save();

  // Populate necessary fields with new product fields included
  const populatedSale = await Sale.findById(updatedSale._id)
    .populate('store')
    .populate('salesperson', 'name')
    .populate('cancelledBy', 'name')
    .populate('items.product', 'name itemCode variantName department category subcategory');

  res.json(populatedSale);
});

// @desc    Get daily sales data
// @route   GET /api/sales/daily
// @access  Private

export const getDailySales = asyncHandler(async (req, res) => {
  const startDate = req.query.startDate 
    ? new Date(req.query.startDate)
    : new Date(new Date().setDate(new Date().getDate() - 7));
  
  const endDate = req.query.endDate
    ? new Date(req.query.endDate)
    : new Date();

  const storeId = req.query.storeId || req.user.store;

  // Check permission
  if (storeId !== 'all' && storeId !== req.user.store.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this store\'s data');
  }

  // Create store filter
  const storeFilter = getStoreFilter(storeId, req.user);

  // Set time to start and end of days
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const dailySales = await Sale.aggregate([
    {
      $match: {
        store: storeFilter,
        status: 'completed',
        createdAt: { 
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { 
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        date: { $first: '$createdAt' },
        amount: { $sum: '$totalAmount' },
        totalSales: { $sum: 1 },
        averageAmount: { $avg: '$totalAmount' },
        items: { $sum: { $size: '$items' } }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        amount: { $round: ['$amount', 2] },
        totalSales: 1,
        averageAmount: { $round: ['$averageAmount', 2] },
        totalItems: '$items'
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);

  // Fill in missing dates
  const filledDailySales = [];
  const currentDate = new Date(startDate);
  const salesByDate = Object.fromEntries(
    dailySales.map(day => [day.date, day])
  );

  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split('T')[0];
    filledDailySales.push(
      salesByDate[dateString] || {
        date: dateString,
        amount: 0,
        totalSales: 0,
        averageAmount: 0,
        totalItems: 0
      }
    );
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate additional statistics
  const summary = {
    totalSales: dailySales.reduce((sum, day) => sum + day.totalSales, 0),
    totalAmount: Number(dailySales.reduce((sum, day) => sum + day.amount, 0).toFixed(2)),
    averageDailySales: Number((dailySales.reduce((sum, day) => sum + day.totalSales, 0) / 
      (filledDailySales.length || 1)).toFixed(2)),
    totalItems: dailySales.reduce((sum, day) => sum + day.totalItems, 0)
  };

  // Add percentage changes if there's enough data
  if (dailySales.length > 1) {
    const firstDay = dailySales[0];
    const lastDay = dailySales[dailySales.length - 1];
    
    summary.salesTrend = Number((((lastDay.totalSales - firstDay.totalSales) / 
      firstDay.totalSales) * 100).toFixed(2));
    summary.amountTrend = Number((((lastDay.amount - firstDay.amount) / 
      firstDay.amount) * 100).toFixed(2));
  }

  res.json({
    dailySales: filledDailySales,
    summary
  });
});

// @desc    Get monthly sales report
// @route   GET /api/sales/monthly
// @access  Private
export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  
  // If no year/month provided, use current month
  const targetDate = year && month 
    ? new Date(year, month - 1) // month is 0-based
    : new Date();

  const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

  const monthlyData = await Sale.aggregate([
    {
      $match: {
        store: getStoreFilter(req.query.storeId || req.user.store, req.user),
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        averageAmount: { $avg: '$totalAmount' },
        totalItems: { $sum: { $size: '$items' } }
      }
    },
    {
      $project: {
        _id: 0,
        totalSales: 1,
        totalAmount: { $round: ['$totalAmount', 2] },
        averageAmount: { $round: ['$averageAmount', 2] },
        totalItems: 1
      }
    }
  ]);

  // Get sales by payment method if implemented in your model
  const salesByCategory = await Sale.aggregate([
    {
      $match: {
        store: req.user.store,
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $group: {
        _id: {
          department: '$productInfo.department',
          category: '$productInfo.category',
          subcategory: '$productInfo.subcategory'
        },
        totalSales: { $sum: '$items.quantity' },
        totalAmount: { $sum: '$items.total' }
      }
    },
    {
      $project: {
        _id: 0,
        department: '$_id.department',
        category: '$_id.category',
        subcategory: '$_id.subcategory',
        totalSales: 1,
        totalAmount: { $round: ['$totalAmount', 2] }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);

  res.json({
    month: targetDate.toLocaleString('default', { month: 'long' }),
    year: targetDate.getFullYear(),
    summary: monthlyData[0] || {
      totalSales: 0,
      totalAmount: 0,
      averageAmount: 0,
      totalItems: 0
    },
    salesByCategory
  });
});

// @desc    Get sales by product
// @route   GET /api/sales/by-product
// @access  Private
export const getSalesByProduct = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const productSales = await Sale.aggregate([
    {
      $match: {
        store: getStoreFilter(req.query.storeId || req.user.store, req.user),
        status: 'completed',
        ...dateFilter
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' },
        totalAmount: { $sum: '$items.total' },
        salesCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: '$product.name',
        itemCode: '$product.itemCode',
        variantName: '$product.variantName',    
        department: '$product.department',      
        category: '$product.category',
        subcategory: '$product.subcategory',    
        totalQuantity: 1,
        totalAmount: { $round: ['$totalAmount', 2] },
        salesCount: 1,
        averageAmount: { 
          $round: [{ $divide: ['$totalAmount', '$salesCount'] }, 2] 
        }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  res.json(productSales);
});

// @desc    Get sales by salesperson
// @route   GET /api/sales/by-salesperson
// @access  Private/Admin
export const getSalesBySalesperson = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Only admins can see all salesperson data
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to access this data');
  }

  const salesData = await Sale.aggregate([
    {
      $match: {
        store: getStoreFilter(req.query.storeId || req.user.store, req.user),
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: '$salesperson',
        totalSales: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalItems: { $sum: { $size: '$items' } }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'salesperson'
      }
    },
    { $unwind: '$salesperson' },
    {
      $project: {
        _id: 0,
        salesPersonId: '$_id',
        name: '$salesperson.name',
        totalSales: 1,
        totalAmount: { $round: ['$totalAmount', 2] },
        totalItems: 1,
        averageAmount: { 
          $round: [{ $divide: ['$totalAmount', '$totalSales'] }, 2] 
        }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  res.json(salesData);
});

// @desc    Issue refund for a sale
// @route   POST /api/sales/:id/refund
// @access  Private/Admin
export const issueSaleRefund = asyncHandler(async (req, res) => {
  const { reason, items } = req.body;
  
  const sale = await Sale.findById(req.params.id);

  if (!sale) {
    res.status(404);
    throw new Error('Sale not found');
  }

  // Only allow refunds for completed sales
  if (sale.status !== 'completed') {
    res.status(400);
    throw new Error(`Cannot refund a sale with status: ${sale.status}`);
  }

  // Verify user has access to this sale
  if (sale.store.toString() !== req.user.store.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to refund this sale');
  }

  // Calculate refund amount
  let refundAmount = 0;
  if (items && items.length > 0) {
    // Partial refund
    items.forEach(refundItem => {
      const saleItem = sale.items.find(item => 
        item._id.toString() === refundItem.itemId
      );
      if (!saleItem) {
        throw new Error(`Item ${refundItem.itemId} not found in sale`);
      }
      if (refundItem.quantity > saleItem.quantity) {
        throw new Error(`Cannot refund more items than purchased`);
      }
      refundAmount += (saleItem.price * refundItem.quantity);
    });
  } else {
    // Full refund
    refundAmount = sale.totalAmount;
  }

  // Update sale
  sale.status = 'refunded';
  sale.refundReason = reason;
  sale.refundedAt = new Date();
  sale.refundedBy = req.user._id;
  sale.refundAmount = refundAmount;
  sale.refundedItems = items || sale.items;

  const updatedSale = await sale.save();

  // Populate necessary fields
  const populatedSale = await Sale.findById(updatedSale._id)
    .populate('store')
    .populate('salesperson', 'name')
    .populate('refundedBy', 'name')
    .populate('items.product', 'name itemCode');

  res.json(populatedSale);
});