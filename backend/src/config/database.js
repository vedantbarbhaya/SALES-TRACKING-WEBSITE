// Updated src/config/database.js with better logging and explicit database selection
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    
    // Extract the URI parts to explicitly set the database name
    let uri = process.env.MONGODB_URI;
    let dbName = '';
    
    // Check if URI contains a database name
    if (uri.includes('@')) {
      const uriParts = uri.split('@')[1].split('/');
      if (uriParts.length > 1 && uriParts[1].includes('?')) {
        // Extract database name from URI (before query parameters)
        dbName = uriParts[1].split('?')[0];
      }
    }
    
    // If no database name in URI, we'll need to set it explicitly
    if (!dbName || dbName === '') {
      console.log('No database name found in URI, will connect to default database');
      
      // You might want to explicitly specify the database if it's missing
      // For example:
      // uri = uri.replace(/(\?|$)/, '/RudhvayData?$1');
      // console.log('Using modified URI with explicit database name');
    } else {
      console.log(`Database name from URI: ${dbName}`);
    }
    
    // Connect to MongoDB
    const conn = await mongoose.connect(uri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Using database: ${conn.connection.db.databaseName}`);
    
    // List all collections to verify we can see the users collection
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Test if we can find the admin user
    try {
      const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}));
      const adminUser = await User.findOne({ email: 'admin@rudhvay.com' });
      if (adminUser) {
        console.log('✅ Successfully found admin user in the database');
      } else {
        console.log('⚠️ Admin user not found in the database');
      }
    } catch (err) {
      console.log(`Error testing for admin user: ${err.message}`);
    }
    
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;