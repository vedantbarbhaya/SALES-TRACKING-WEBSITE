// scripts/createUsers.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Convert ESM file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend .env file
const envPath = path.resolve(__dirname, '../backend/.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

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
    
    return mongoose.connect(fullUri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000
    })
    .then(async (conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log(`Using database: ${conn.connection.name}`);
      
      // Perform a test query to verify the connection
      try {
        // Get direct access to the native MongoDB driver connection
        const db = conn.connection.db;
        
        // List all collections using the native driver
        const collections = await db.listCollections().toArray();
        console.log(`Connection verified! Found ${collections.length} collections:`);
        collections.forEach(collection => {
          console.log(`- ${collection.name}`);
        });
        
        // Use the native MongoDB collection directly instead of Mongoose models
        const storesCollection = db.collection('stores');
        const stores = await storesCollection.find({}).toArray();
        console.log(`Found ${stores.length} documents in the stores collection:`);
        stores.forEach(store => {
          console.log(`- ${store.name || 'Unnamed Store'} (${store._id})`);
        });
       
      } catch (queryError) {
        console.warn(`Warning: Connected to database but test query failed: ${queryError.message}`);
      }
      
      return conn;
    })
    .catch(err => {
      console.error(`Error connecting to MongoDB: ${err.message}`);
      process.exit(1);
    });
};

// Define User schema for mongoose model
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'salesperson'],
    default: 'salesperson'
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

// Main function to create users
const createUsers = async () => {
  let connection;
  let db;
  
  try {
    // Connect to database
    connection = await connectDB();
    db = connection.connection.db;
    
    // Use native driver to access stores
    const storesCollection = db.collection('stores');
    const stores = await storesCollection.find({}).toArray();
    
    if (stores.length === 0) {
      console.error('No stores found in the database. Please add stores first.');
      process.exit(1);
    }
    
    // List all available stores to help with assignment
    console.log(`\nPreparing to create users for ${stores.length} stores:`);
    stores.forEach(store => {
      console.log(`- "${store.name}" (${store._id})`);
    });
    
    // Create users collection reference (for checking existing users)
    const usersCollection = db.collection('users');
    
    // Check if admin already exists to avoid duplicate emails
    const existingAdmin = await usersCollection.findOne({ email: 'admin@rudhvay.com' });
    
    const adminStoreID = 'HQ'; // Replace with your actual store name
    let adminStore = stores.find(store => store.store_id === adminStoreID);
    
    if (!adminStore) {
      console.error(`Store "${adminStoreID}" not found for admin. Using first available store instead.`);
      // Use the first store as fallback
      adminStore = stores[0]; // Now this works because adminStore is a let variable
    }
    
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create admin user password hash manually
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('R@sha@21', salt);
      
      // Create admin user using native driver
      const adminUser = await usersCollection.insertOne({
        name: 'Rashi Soni',
        email: 'admin@rudhvay.com',
        password: hashedPassword,
        role: 'admin',
        store: adminStore._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`Admin user created: Rashi Soni (assigned to ${adminStore.name})`);
    }
    
    // Create salesperson accounts with specific store assignments by name
    const salespersons = [
      {
        name: 'Rahula',
        email: 'rahula.rudhvay@gmail.com',
        password: 'Kerala@Rahula@01', 
        storeID: 'KR1', 
        role: 'salesperson'
      },
      {
        name: 'Ancy',
        email: 'ancy.rudhvay@gmail.com',
        password: 'Kerala@ancy@01', 
        storeID: 'KR1', 
        role: 'salesperson'
      }
    ];
    
    for (const salesData of salespersons) {
      // Find store by name using native driver query
      const store = stores.find(s => s.store_id === salesData.storeID);
      
      if (!store) {
        console.log(`Warning: Store "${salesData.storeID}" not found. Skipping user creation for ${salesData.email}`);
        continue;
      }
      
      // Check if user already exists using native driver
      const existingUser = await usersCollection.findOne({ email: salesData.email });
      
      if (existingUser) {
        console.log(`User with email ${salesData.email} already exists`);
      } else {
        // Hash password manually
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(salesData.password, salt);
        
        // Create user using native driver
        const result = await usersCollection.insertOne({
          name: salesData.name,
          email: salesData.email,
          password: hashedPassword,
          role: salesData.role,
          store: store._id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`Salesperson created: ${salesData.name} (assigned to ${store.name})`);
      }
    }
    
    // List all users
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`\nTotal users in database: ${allUsers.length}`);
    console.log('All users:');
    allUsers.forEach(user => {
      console.log(`- ${user.name}, ${user.email} (${user.role})`);
    });
    
    console.log('\nUser creation process completed.');
    
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    // Close database connection
    if (connection) {
      await mongoose.connection.close();
      console.log('\nDatabase connection closed');
    }
  }
};

// Run the script
createUsers().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});