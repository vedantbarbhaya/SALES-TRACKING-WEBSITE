// scripts/uploadProductsfromExcel.js
import xlsx from 'xlsx';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Convert ESM file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend .env file
const envPath = path.resolve(__dirname, '../backend/.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// Increase timeout settings for MongoDB operations
mongoose.set('bufferTimeoutMS', 30000);

// Connect to MongoDB function
const connectDB = async () => {
  console.log(`Attempting to connect to MongoDB with URI: ${process.env.MONGODB_URI ? '(URI exists)' : '(URI is undefined)'}`);
  
  if (!process.env.MONGODB_URI) {
    console.error('MongoDB URI is missing in .env file');
    process.exit(1);
  }
  
  // Extract the base URI without database name if it exists
  const baseUri = process.env.MONGODB_URI.replace(/\/[^/]*$/, '');
  
  // Create full URI with explicit database name
  const fullUri = `${baseUri}/RudhvayMainData`;
  
  console.log(`Connecting to database: RudhvayMainData`);
  
  try {
    const conn = await mongoose.connect(fullUri, {
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Using database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Define Product schema and model directly in this file
// (This avoids import issues with external model files)
const productSchema = new mongoose.Schema({
  itemCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  variantName: {
    type: String,
    default: '',
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  price: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Create the model
const Product = mongoose.model('Product', productSchema);

const uploadProducts = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Specify the path to your Excel file
    const excelFilePath = path.resolve(__dirname, 'products.xlsx');
    console.log(`Checking for Excel file at: ${excelFilePath}`);

    // Check if the file exists
    if (!fs.existsSync(excelFilePath)) {
      console.error('Excel file not found');
      process.exit(1);
    }
    
    // Read Excel file
    console.log('Reading Excel file...');
    const workbook = xlsx.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log(`Found ${data.length} products to upload`);

    // Track results
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process in batches
    const batchSize = 20;
    console.log(`Processing ${data.length} products in batches of ${batchSize}`);
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(data.length/batchSize)} (${batch.length} products)`);
      
      // Process each item in the batch
      const batchPromises = batch.map(async (row) => {
        try {
          // Validate required fields
          if (!row.Itemcode || !row.Name || !row.department || !row.category || row.price === undefined) {
            throw new Error(`Missing required fields in row: ${JSON.stringify(row)}`);
          }

          // Format the product data
          const product = {
            itemCode: row.Itemcode.toString().trim(),
            name: row.Name.trim(),
            // Handle variantName which might be a number
            variantName: row.variantName !== undefined ? String(row.variantName).trim() : '',
            department: row.department.trim(),
            category: row.category.trim(),
            // Convert other fields to strings as well to avoid similar issues
            subcategory: row.subcategory !== undefined ? String(row.subcategory).trim() : '',
            description: row.description !== undefined ? String(row.description).trim() : '',
            price: Number(row.price)
          };

          // Update or create product (upsert)
          await Product.findOneAndUpdate(
            { itemCode: product.itemCode },
            product,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          
          console.log(`Processed product: ${product.itemCode} - ${product.name}`);
          return { success: true };
        } catch (error) {
          console.error(`Error processing row ${row.Itemcode}:`, error.message);
          return { 
            success: false, 
            itemCode: row.Itemcode,
            error: error.message 
          };
        }
      });
      
      // Wait for the batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Count results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push({
              itemCode: result.value.itemCode,
              error: result.value.error
            });
          }
        } else {
          results.failed++;
          results.errors.push({
            itemCode: 'Unknown',
            error: result.reason.message
          });
        }
      });
      
      // Progress update
      console.log(`Progress: ${i + batch.length}/${data.length} (${results.successful} succeeded, ${results.failed} failed)`);
      
      // Add a small delay between batches
      if (i + batchSize < data.length) {
        console.log('Pausing between batches...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log final results
    console.log('\nUpload Results:');
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(error => {
        console.log(`ItemCode ${error.itemCode}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the script
uploadProducts();