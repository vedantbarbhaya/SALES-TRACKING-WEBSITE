// scripts/createDummyStores.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert ESM file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend .env file
const envPath = path.resolve(__dirname, '../backend/.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// Increase timeout settings for MongoDB operations
mongoose.set('bufferTimeoutMS', 30000);

// Define Store schema and model directly in this file
const storeSchema = new mongoose.Schema({
  store_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Connect to MongoDB function
const connectDB = async () => {
  console.log(`Attempting to connect to MongoDB...`);
  
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

// Create the model
const Store = mongoose.model('Store', storeSchema);

const createDummyStores = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Define dummy store data
    const dummyStores = [
      {
        store_id: "GJ1",
        name: "Ahemdabad store",
        location: "Ahemdabad, Gujarat",
        contactNumber: "+91 (555) 123-4567",
        isActive: true
      },
      {
        store_id: "KR1",
        name: "Kerala Jatayu store",
        location: "Chadayamangalam, Kerala",
        contactNumber: "+91 (555) 987-6543",
        isActive: true
      },
      {
        store_id: "REL1",
        name: "Reliance Navi Mumbai",
        location: "Navi Mumbai, Maharashtra",
        contactNumber: "+91 (555) 987-6543",
        isActive: true
      },
      {
        store_id: "HQ",
        name: "Rudhvay Headquarters",
        location: "Ahemdabad, Maharashtra",
        contactNumber: "+91 (555) 987-6543",
        isActive: true
      }
    ];
    
    console.log('Creating dummy stores...');
    
    // Process each store
    for (const storeData of dummyStores) {
      try {
        // Check if store with same ID already exists
        const existingStore = await Store.findOne({ store_id: storeData.store_id });
        
        if (existingStore) {
          console.log(`Store with ID "${storeData.store_id}" already exists. Updating...`);
          
          // Update existing store
          const updatedStore = await Store.findOneAndUpdate(
            { store_id: storeData.store_id },
            storeData,
            { new: true }
          );
          
          console.log(`Updated store: ${updatedStore.name} (ID: ${updatedStore.store_id})`);
        } else {
          // Create new store
          const newStore = await Store.create(storeData);
          console.log(`Created new store: ${newStore.name} (ID: ${newStore.store_id})`);
        }
      } catch (error) {
        console.error(`Error processing store "${storeData.name}":`, error.message);
      }
    }
    
    // Fetch and display all stores
    const allStores = await Store.find({});
    console.log('\nAll stores in database:');
    allStores.forEach(store => {
      console.log(`- ${store.store_id}: ${store.name} (${store.location}), Contact: ${store.contactNumber}, Active: ${store.isActive}`);
    });
    
    console.log(`\nTotal stores: ${allStores.length}`);

  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the script
createDummyStores();