import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose'; 

// Load env vars before other imports
dotenv.config();

import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import salesRoutes from './routes/sales.js';
import productRoutes from './routes/products.js';
import storeRoutes from './routes/stores.js';
import uploadRoutes from './routes/upload.js';
import storeInventoryMapRoutes from './routes/storeInventoryMap.js';
import inventoryRoutes from './routes/inventory.js';



// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stores/inventory-mapping', storeInventoryMapRoutes);

// temp code
app.get('/api/direct-test', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collectionName = 'INV_KR1';
    
    // Check if collection exists
    const collections = await db.listCollections({name: collectionName}).toArray();
    const collectionExists = collections.length > 0;
    
    if (!collectionExists) {
      return res.json({
        error: `Collection ${collectionName} does not exist`,
        availableCollections: await db.listCollections().toArray()
      });
    }
    
    // Get count and sample documents
    const count = await db.collection(collectionName).countDocuments({});
    const sample = await db.collection(collectionName).find({}).limit(2).toArray();
    
    res.json({
      database: db.databaseName,
      collection: collectionName,
      exists: collectionExists,
      count,
      sample
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/api/model-test', async (req, res) => {
  try {
    // Import the function dynamically
    const { createInventoryModel } = await import('./models/InventoryFactory.js');
    const collectionName = 'INV_KR1';
    const modelName = `Inventory${collectionName.replace('INV_', '')}`;
    
    // Create the model
    const InventoryModel = createInventoryModel(modelName, collectionName);
    
    // Test a find operation
    const findResult = await InventoryModel.find({}).limit(5);
    
    res.json({
      modelName,
      collectionName,
      modelRegistered: mongoose.models[modelName] ? true : false,
      findResultCount: findResult.length,
      findResult
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message, 
      stack: error.stack 
    });
  }
});
// temp code

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  const staticPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(staticPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(staticPath, 'index.html'));
  });
}



// Error Handler - should be after routes
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 