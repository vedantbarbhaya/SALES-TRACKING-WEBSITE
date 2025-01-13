import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Store from './models/Store.js';
import Product from './models/Product.js';

dotenv.config();

const seedData = {
  stores: [
    {
      name: 'Downtown Store',
      location: 'City Center',
      contactNumber: '123-456-7890'
    },
    {
      name: 'Mall Store',
      location: 'City Mall',
      contactNumber: '123-456-7891'
    }
  ],
  products: [
    {
      itemCode: 'P001',
      name: 'Product 1',
      description: 'Description for product 1',
      price: 29.99,
      category: 'Category 1'
    },
    {
      itemCode: 'P002',
      name: 'Product 2',
      description: 'Description for product 2',
      price: 39.99,
      category: 'Category 1'
    },
    {
      itemCode: 'P003',
      name: 'Product 3',
      description: 'Description for product 3',
      price: 49.99,
      category: 'Category 2'
    }
  ]
};

const importData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear existing data
    await Store.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    // Insert stores
    const createdStores = await Store.insertMany(seedData.stores);

    // Create admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123', // This will be hashed by the User model pre-save middleware
      role: 'admin',
      store: createdStores[0]._id
    });

    // Create test salesperson
    await User.create({
      name: 'Test Salesperson',
      email: 'sales@example.com',
      password: 'sales123',
      role: 'salesperson',
      store: createdStores[0]._id
    });

    // Insert products
    await Product.insertMany(seedData.products);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Store.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

// Add to package.json scripts:
// "seed": "node src/seeder.js",
// "seed:destroy": "node src/seeder.js -d"

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}