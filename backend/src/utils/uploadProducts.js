// scripts/uploadProducts.js
import xlsx from 'xlsx';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Product from '../models/Product.js';

dotenv.config();

const uploadProducts = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Read Excel file
    const workbook = xlsx.readFile('products.xlsx'); // Replace with your file path
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

    // Process each row
    for (const row of data) {
      try {
        // Validate required fields
        if (!row.Itemcode || !row.Name || !row.department || !row.category || !row.price) {
          throw new Error(`Missing required fields in row: ${JSON.stringify(row)}`);
        }

        // Format the product data
        const product = {
          itemCode: row.Itemcode.toString().trim(),
          name: row.Name.trim(),
          variantName: row.variantName?.trim() || '',
          department: row.department.trim(),
          category: row.category.trim(),
          subcategory: row.subcategory?.trim() || '',
          description: row.description?.trim() || '',
          price: Number(row.price)
        };

        // Check if product already exists
        const existingProduct = await Product.findOne({ itemCode: product.itemCode });
        
        if (existingProduct) {
          // Update existing product
          await Product.findOneAndUpdate(
            { itemCode: product.itemCode },
            product,
            { new: true }
          );
          console.log(`Updated product: ${product.itemCode}`);
        } else {
          // Create new product
          await Product.create(product);
          console.log(`Created product: ${product.itemCode}`);
        }

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          itemCode: row.Itemcode,
          error: error.message
        });
        console.error(`Error processing row:`, error.message);
      }
    }

    // Log final results
    console.log('\nUpload Results:');
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    console.log('\nErrors:');
    results.errors.forEach(error => {
      console.log(`ItemCode ${error.itemCode}: ${error.error}`);
    });

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