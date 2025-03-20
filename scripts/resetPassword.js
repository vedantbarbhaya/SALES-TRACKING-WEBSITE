// scripts/resetPassword.js
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
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

// Reset password for a specific user
const resetPassword = async (email, newPassword) => {
  let client;
  
  try {
    // Check if MongoDB URI is properly loaded
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI environment variable is not set');
      process.exit(1);
    }
    
    console.log(`MongoDB URI found: ${uri.substring(0, 20)}...`);
    
    // Connect to MongoDB
    client = new MongoClient(uri);
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Find which database contains the users collection
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    
    // Variables to track where we found users
    let foundInDb = null;
    let usersCollection = null;
    let userFound = false;
    
    // Search each database for the users collection
    for (const database of dbs.databases) {
      if (database.name === 'admin' || database.name === 'local' || database.name === 'config') {
        continue; // Skip system databases
      }
      
      const db = client.db(database.name);
      
      try {
        // Check if users collection exists in this database
        const collections = await db.listCollections().toArray();
        const hasUsers = collections.some(c => c.name === 'users');
        
        if (hasUsers) {
          console.log(`Found users collection in database: ${database.name}`);
          
          // Check if the user exists in this collection
          const collection = db.collection('users');
          const user = await collection.findOne({ email });
          
          if (user) {
            console.log(`Found user ${email} in database ${database.name}`);
            foundInDb = database.name;
            usersCollection = collection;
            userFound = true;
            break;
          }
        }
      } catch (err) {
        console.log(`Error checking database ${database.name}: ${err.message}`);
      }
    }
    
    if (!userFound) {
      console.log(`User with email ${email} not found in any database`);
      return;
    }
    
    // Reset the password
    console.log(`Resetting password for ${email} in database ${foundInDb}`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    const result = await usersCollection.updateOne(
      { email },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
    
    if (result.modifiedCount === 1) {
      console.log(`✅ Password reset successful for ${email}`);
    } else {
      console.log(`⚠️ Password update attempted but no changes were made`);
    }
    
    // Verify the update
    const updatedUser = await usersCollection.findOne({ email });
    if (updatedUser) {
      console.log(`User password hash is now: ${updatedUser.password.substring(0, 15)}...`);
    }
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed');
    }
  }
};

// Email and new password to use for reset
const email = 'ancy.rudhvay@gmail.com';
const newPassword = 'Kerala@ancy@01';

console.log(`Starting password reset for ${email}...`);
resetPassword(email, newPassword);