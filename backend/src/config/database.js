import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Hide sensitive info in logs
    const sanitizedUri = process.env.MONGODB_URI.replace(
      /mongodb(\+srv)?:\/\/[^:]+:([^@]+)@/,
      'mongodb$1://[username]:[hidden-password]@'
    );
    
    console.log(`Connecting to MongoDB: ${sanitizedUri}`);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Remove the problematic SSL options
      // If you're using mongodb+srv:// protocol, SSL is enabled by default
      retryWrites: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;