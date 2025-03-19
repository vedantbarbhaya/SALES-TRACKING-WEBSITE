// scripts/testInventorySystem.js
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert ESM file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../backend/.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// Database and collections
let client;
let db;
let storesCollection;
let productsCollection;
let salesCollection;
let usersCollection;
let mappingsCollection;
let inventoryCollection;

// Connect to MongoDB function using direct MongoDB driver
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  console.log(`Attempting to connect to MongoDB with URI: ${uri ? '(URI exists)' : '(URI is undefined)'}`);
  
  if (!uri) {
    console.error('MongoDB URI is missing in .env file');
    process.exit(1);
  }
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('MongoDB Connected!');
    
    // Get database from URI or use default
    const dbName = uri.split('/').pop().split('?')[0] || 'RudhvayMainData';
    db = client.db(dbName);
    console.log(`Using database: ${dbName}`);
    
    // Initialize collections
    storesCollection = db.collection('stores');
    productsCollection = db.collection('products');
    salesCollection = db.collection('sales');
    usersCollection = db.collection('users');
    mappingsCollection = db.collection('storeinventorymaps');
    
    return { client, db };
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Reduce inventory function
const reduceInventoryFromSale = async (sale, inventoryCollectionName) => {
  try {
    const inventoryCollection = db.collection(inventoryCollectionName);
    
    // Track results
    const results = {
      successful: [],
      failed: []
    };
    
    // Process each item in the sale
    for (const item of sale.items) {
      try {
        // Find the product to get its details
        const product = await productsCollection.findOne({ _id: new ObjectId(item.product) });
        
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }
        
        // Find the inventory item
        const inventoryItem = await inventoryCollection.findOne({
          itemCode: product.itemCode,
          variantName: product.variantName || ''
        });
        
        if (!inventoryItem) {
          throw new Error(`Inventory item not found for product: ${product.itemCode} (${product.variantName || 'no variant'})`);
        }
        
        // Ensure there's enough inventory
        if (inventoryItem.quantity < item.quantity) {
          throw new Error(`Insufficient inventory for ${product.name} (${product.variantName || 'no variant'}). Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`);
        }
        
        // Update the inventory quantity
        const updateResult = await inventoryCollection.updateOne(
          { _id: inventoryItem._id },
          { $inc: { quantity: -item.quantity } }
        );
        
        if (updateResult.modifiedCount !== 1) {
          throw new Error(`Failed to update inventory for ${product.name}`);
        }
        
        // Get the updated inventory item
        const updatedItem = await inventoryCollection.findOne({ _id: inventoryItem._id });
        
        results.successful.push({
          itemCode: product.itemCode,
          variantName: product.variantName || '',
          quantityReduced: item.quantity,
          newQuantity: updatedItem.quantity
        });
      } catch (error) {
        results.failed.push({
          product: item.product,
          quantity: item.quantity,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error reducing inventory:', error);
    throw error;
  }
};

// Test function
const runTest = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('\n--- STEP 1: Create Test Store ---');
    
    // Create a test store if it doesn't exist
    let testStore = await storesCollection.findOne({ name: 'Test Inventory Store' });
    
    if (!testStore) {
      const result = await storesCollection.insertOne({
        name: 'Test Inventory Store',
        location: 'Test Location',
        contactNumber: '123-456-7890',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      testStore = await storesCollection.findOne({ _id: result.insertedId });
      console.log(`Created test store: ${testStore.name} (${testStore._id})`);
    } else {
      console.log(`Using existing test store: ${testStore.name} (${testStore._id})`);
    }
    
    console.log('\n--- STEP 2: Create Inventory Mapping ---');
    
    // Create or get inventory mapping
    const inventoryCollectionName = 'INV_TEST';
    let storeMapping = await mappingsCollection.findOne({ store: testStore._id });
    
    if (!storeMapping) {
      const result = await mappingsCollection.insertOne({
        store: testStore._id,
        inventoryCollection: inventoryCollectionName,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      storeMapping = await mappingsCollection.findOne({ _id: result.insertedId });
      console.log(`Created inventory mapping: ${storeMapping.inventoryCollection}`);
    } else {
      console.log(`Using existing inventory mapping: ${storeMapping.inventoryCollection}`);
    }
    
    console.log('\n--- STEP 3: Initialize Inventory Collection ---');
    
    // Make sure inventory collection exists
    inventoryCollection = db.collection(inventoryCollectionName);
    console.log(`Using inventory collection: ${inventoryCollectionName}`);
    
    console.log('\n--- STEP 4: Add Test Products ---');
    
    // Ensure we have test products
    const testProducts = [
      {
        itemCode: 'TEST001',
        name: 'Test Product 1',
        variantName: 'Standard',
        department: 'Test',
        category: 'Test Category',
        subcategory: 'Test Subcategory',
        description: 'Test product for inventory system',
        price: 99.99,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        itemCode: 'TEST002',
        name: 'Test Product 2',
        variantName: 'Premium',
        department: 'Test',
        category: 'Test Category',
        subcategory: 'Test Subcategory',
        description: 'Another test product',
        price: 149.99,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Create the products if they don't exist
    const products = [];
    for (const productData of testProducts) {
      let product = await productsCollection.findOne({ itemCode: productData.itemCode });
      
      if (!product) {
        const result = await productsCollection.insertOne(productData);
        product = await productsCollection.findOne({ _id: result.insertedId });
        console.log(`Created product: ${product.name} (${product.itemCode})`);
      } else {
        console.log(`Using existing product: ${product.name} (${product.itemCode})`);
      }
      
      products.push(product);
    }
    
    console.log('\n--- STEP 5: Add Inventory Items ---');
    
    // Add inventory items
    for (const product of products) {
      let inventoryItem = await inventoryCollection.findOne({ 
        itemCode: product.itemCode,
        variantName: product.variantName 
      });
      
      if (!inventoryItem) {
        const result = await inventoryCollection.insertOne({
          itemCode: product.itemCode,
          name: product.name,
          variantName: product.variantName,
          department: product.department,
          category: product.category,
          subcategory: product.subcategory,
          price: product.price,
          quantity: 100, // Starting quantity
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        inventoryItem = await inventoryCollection.findOne({ _id: result.insertedId });
        console.log(`Added inventory item: ${inventoryItem.name} (${inventoryItem.itemCode}), Quantity: ${inventoryItem.quantity}`);
      } else {
        // Update quantity to ensure we have enough
        if (inventoryItem.quantity < 100) {
          await inventoryCollection.updateOne(
            { _id: inventoryItem._id },
            { 
              $set: { 
                quantity: 100,
                updatedAt: new Date() 
              } 
            }
          );
          inventoryItem = await inventoryCollection.findOne({ _id: inventoryItem._id });
          console.log(`Updated inventory item quantity: ${inventoryItem.name} (${inventoryItem.itemCode}), New Quantity: ${inventoryItem.quantity}`);
        } else {
          console.log(`Using existing inventory item: ${inventoryItem.name} (${inventoryItem.itemCode}), Quantity: ${inventoryItem.quantity}`);
        }
      }
    }
    
    console.log('\n--- STEP 6: Get Test User ---');
    
    // Get a test user
    let testUser = await usersCollection.findOne({ role: 'admin' });
    
    if (!testUser) {
      console.log('No admin user found. Creating a test user...');
      // Create a simple test user (in a real app, you'd hash the password)
      const result = await usersCollection.insertOne({
        name: 'Test Admin',
        email: 'testadmin@example.com',
        password: 'password123',
        role: 'admin',
        store: testStore._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      testUser = await usersCollection.findOne({ _id: result.insertedId });
    }
    
    console.log(`Using user: ${testUser.name} (${testUser._id})`);
    
    console.log('\n--- STEP 7: Create Test Sale ---');
    
    // Create a test sale
    const saleItems = products.map(product => ({
      product: product._id,
      quantity: 5,
      price: product.price,
      total: product.price * 5
    }));
    
    const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0);
    
    // Generate a unique sale number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const salesCount = await salesCollection.countDocuments();
    const saleNumber = `SALE${year}${month}${(salesCount + 1).toString().padStart(4, '0')}`;
    
    const saleData = {
      saleNumber,
      store: testStore._id,
      salesperson: testUser._id,
      customerName: 'Test Customer',
      items: saleItems,
      totalAmount,
      salesmanName: testUser.name,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const saleResult = await salesCollection.insertOne(saleData);
    const testSale = await salesCollection.findOne({ _id: saleResult.insertedId });
    
    console.log(`Created test sale: ${testSale._id}, Total Amount: ${testSale.totalAmount}`);
    
    console.log('\n--- STEP 8: Reduce Inventory ---');
    
    // Reduce inventory based on the sale
    const inventoryResults = await reduceInventoryFromSale(testSale, inventoryCollectionName);
    
    console.log('Inventory reduction results:');
    console.log('Successful updates:', inventoryResults.successful.length);
    
    for (const update of inventoryResults.successful) {
      console.log(`Item: ${update.itemCode} (${update.variantName}), Reduced: ${update.quantityReduced}, New Quantity: ${update.newQuantity}`);
    }
    
    if (inventoryResults.failed.length > 0) {
      console.error('Failed updates:', inventoryResults.failed.length);
      console.error(inventoryResults.failed);
    }
    
    console.log('\n--- STEP 9: Verify Inventory Quantities ---');
    
    // Verify new inventory quantities
    for (const product of products) {
      const inventoryItem = await inventoryCollection.findOne({ 
        itemCode: product.itemCode,
        variantName: product.variantName 
      });
      
      console.log(`Current inventory for ${product.name} (${product.itemCode}): ${inventoryItem.quantity}`);
    }
    
    console.log('\n--- Test Completed Successfully ---');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Close the MongoDB connection
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed');
    }
  }
};

// Run the test
runTest();