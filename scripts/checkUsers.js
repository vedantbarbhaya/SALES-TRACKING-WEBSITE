// scripts/checkUsers.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Convert ESM file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find and load .env file
const envPath = path.resolve(__dirname, '../backend/.env');
console.log(`Looking for .env file at: ${envPath}`);

if (!fs.existsSync(envPath)) {
  console.error(`.env file not found at ${envPath}`);
  process.exit(1);
}

// Load environment variables
dotenv.config({ path: envPath });

const checkUsers = async () => {
  let client;
  
  try {
    // Check if MongoDB URI is properly loaded
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI environment variable is not set');
      console.log('Contents of .env file:');
      const envContents = fs.readFileSync(envPath, 'utf8');
      // Only show partial connection string for security
      console.log(envContents.replace(/(MONGODB_URI=mongodb\+srv:\/\/[^:]+:)([^@]+)(@.+)/, '$1[PASSWORD_HIDDEN]$3'));
      process.exit(1);
    }
    
    console.log(`MongoDB URI found: ${uri.substring(0, 20)}...`);
    
    // Connect to MongoDB
    client = new MongoClient(uri);
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    // List all databases
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log("\nAvailable databases:");
    dbs.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
    
    // Let's check each database for users collection
    for (const database of dbs.databases) {
      if (database.name === 'admin' || database.name === 'local' || database.name === 'config') {
        continue; // Skip system databases
      }
      
      const db = client.db(database.name);
      
      try {
        // Check if users collection exists in this database
        const collections = await db.listCollections().toArray();
        const hasUsers = collections.some(c => c.name === 'users');
        
        console.log(`\nChecking database: ${database.name}`);
        console.log(`Contains users collection: ${hasUsers ? 'YES' : 'NO'}`);
        
        if (hasUsers) {
          // Get all users
          const users = await db.collection('users').find({}).toArray();
          console.log(`Found ${users.length} users`);
          
          if (users.length > 0) {
            // Check if admin user exists
            const adminUser = users.find(u => u.email === 'admin@rudhvay.com');
            if (adminUser) {
              console.log("✅ Found admin@rudhvay.com in this database");
              console.log(`User details:`);
              console.log(`- Name: ${adminUser.name}`);
              console.log(`- Role: ${adminUser.role}`);
              console.log(`- Password hash: ${adminUser.password.substring(0, 15)}...`);
              
              // List all users for reference
              console.log("\nAll users in this database:");
              users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
              });
            }
          }
        }
      } catch (err) {
        console.log(`Error checking database ${database.name}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed');
    }
  }
};

console.log('Starting user check...');
checkUsers();