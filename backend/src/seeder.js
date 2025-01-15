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
    // Smartphones
    {
      itemCode: 'SM001',
      name: 'Galaxy S23',
      variantName: '128GB',
      description: 'Samsung Galaxy S23 Smartphone',
      price: 799.99,
      department: 'Electronics',
      category: 'Smartphones',
      subcategory: 'Android'
    },
    {
      itemCode: 'SM002',
      name: 'Galaxy S23',
      variantName: '256GB',
      description: 'Samsung Galaxy S23 Smartphone',
      price: 899.99,
      department: 'Electronics',
      category: 'Smartphones',
      subcategory: 'Android'
    },
    {
      itemCode: 'SM003',
      name: 'iPhone 15',
      variantName: '128GB',
      description: 'Apple iPhone 15',
      price: 899.99,
      department: 'Electronics',
      category: 'Smartphones',
      subcategory: 'iOS'
    },
    {
      itemCode: 'SM004',
      name: 'iPhone 15',
      variantName: '256GB',
      description: 'Apple iPhone 15',
      price: 999.99,
      department: 'Electronics',
      category: 'Smartphones',
      subcategory: 'iOS'
    },

    // Laptops
    {
      itemCode: 'LP001',
      name: 'MacBook Air',
      variantName: '256GB',
      description: 'Apple MacBook Air with M2 chip',
      price: 999.99,
      department: 'Electronics',
      category: 'Laptops',
      subcategory: 'MacBook'
    },
    {
      itemCode: 'LP002',
      name: 'MacBook Air',
      variantName: '512GB',
      description: 'Apple MacBook Air with M2 chip',
      price: 1199.99,
      department: 'Electronics',
      category: 'Laptops',
      subcategory: 'MacBook'
    },
    {
      itemCode: 'LP003',
      name: 'XPS 13',
      variantName: 'i5/8GB',
      description: 'Dell XPS 13 Laptop',
      price: 899.99,
      department: 'Electronics',
      category: 'Laptops',
      subcategory: 'Windows'
    },
    {
      itemCode: 'LP004',
      name: 'XPS 13',
      variantName: 'i7/16GB',
      description: 'Dell XPS 13 Laptop',
      price: 1299.99,
      department: 'Electronics',
      category: 'Laptops',
      subcategory: 'Windows'
    },

    // Tablets
    {
      itemCode: 'TB001',
      name: 'iPad Air',
      variantName: '64GB',
      description: 'Apple iPad Air',
      price: 599.99,
      department: 'Electronics',
      category: 'Tablets',
      subcategory: 'iPads'
    },
    {
      itemCode: 'TB002',
      name: 'iPad Air',
      variantName: '256GB',
      description: 'Apple iPad Air',
      price: 749.99,
      department: 'Electronics',
      category: 'Tablets',
      subcategory: 'iPads'
    },
    {
      itemCode: 'TB003',
      name: 'Galaxy Tab S9',
      variantName: '128GB',
      description: 'Samsung Galaxy Tab S9',
      price: 699.99,
      department: 'Electronics',
      category: 'Tablets',
      subcategory: 'Android'
    },
    {
      itemCode: 'TB004',
      name: 'Galaxy Tab S9',
      variantName: '256GB',
      description: 'Samsung Galaxy Tab S9',
      price: 849.99,
      department: 'Electronics',
      category: 'Tablets',
      subcategory: 'Android'
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

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}