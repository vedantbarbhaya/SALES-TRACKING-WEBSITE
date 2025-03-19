import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(mongoose.modelNames());

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
